import { NextRequest } from "next/server";

// Modèles disponibles par fournisseur
const PROVIDERS = {
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama-3.3-70b-versatile",
  },
  nvidia: {
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY!,
    model: "meta/llama-3.1-70b-instruct",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: process.env.GEMINI_API_KEY!,
    model: "gemini-1.5-pro",
  }
} as const;

type Provider = keyof typeof PROVIDERS;

export const runtime = "edge"; // Edge runtime pour le streaming optimal

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, provider = "groq", visualState } = body as {
      messages: { role: string; content: string }[];
      provider?: Provider;
      visualState?: string | null;
      spatialTopology?: string | null;
    };

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages requis." }), { status: 400 });
    }

    const config = PROVIDERS[provider] ?? PROVIDERS.groq;

    if (!config.apiKey) {
      return new Response(
        JSON.stringify({ error: `Clé API manquante pour le fournisseur "${provider}".` }),
        { status: 500 }
      );
    }

    // Compression du contexte : max 6 derniers messages
    const trimmedMessages = messages.slice(-6);

    const systemMessages: { role: string; content: string }[] = [
      {
        role: "system",
        content:
          "Tu es NightCode, un assistant IA intelligent, concis et créatif. Tu aides l'utilisateur à construire, planifier et coder des projets. Tes réponses sont claires, bien structurées et en français sauf si l'utilisateur parle une autre langue.",
      },
    ];

    // Si une image VCE est présente, on doit utiliser un modèle Vision et formater l'image
    let finalModel: string = config.model;

    console.log("[API/CHAT] Requête reçue. Provider:", provider);
    console.log("[API/CHAT] visualState présent ?", !!visualState);
    if (visualState) {
        console.log("[API/CHAT] Longueur visualState:", visualState.length);
    }

    if (visualState) {
      if (provider === "groq") {
        finalModel = "llama-3.2-90b-vision-preview"; // Modèle multimodal Groq
      } else if (provider === "nvidia") {
        finalModel = "meta/llama-3.2-90b-vision-instruct"; // Modèle multimodal NVIDIA (si disponible, fallback sinon)
      } else if (provider === "gemini") {
        finalModel = "gemini-1.5-pro"; // Gemini est nativement multimodal
      }

      systemMessages[0].content += " [Visual Context Engineering activé] L'utilisateur a partagé un instantané visuel (capture d'écran) de son espace de travail Spatial (Canvas). Tu as donc une image de son écran. La topologie visible représente l'état global de sa réflexion et de ses documents. Prends en compte cette structure visuelle dans ta réponse et fais-y référence si pertinent.";
    }

    let finalMessages = [...systemMessages, ...trimmedMessages];

    // Modifier le dernier message de l'utilisateur pour inclure l'image si visualState
    if (visualState) {
      const lastMessageIndex = finalMessages.length - 1;
      if (lastMessageIndex >= 0 && finalMessages[lastMessageIndex].role === "user") {
        const originalText = finalMessages[lastMessageIndex].content;

        finalMessages[lastMessageIndex] = {
          role: "user",
          content: [
            { type: "text", text: originalText as string },
            {
              type: "image_url",
              image_url: {
                url: visualState.startsWith("data:image") ? visualState : `data:image/jpeg;base64,${visualState}`
              }
            }
          ] as any
        };
      }
    }

    // Appel en mode STREAMING (stream: true)
    const upstreamResponse = await fetch(`${config.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: finalModel,
        messages: finalMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true, // ← STREAMING ACTIVÉ
      }),
    });

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text();
      return new Response(
        JSON.stringify({ error: `Erreur ${provider}: ${upstreamResponse.status} ${errText}` }),
        { status: upstreamResponse.status }
      );
    }

    // Transformer le flux SSE upstream en flux SSE propre vers le client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = upstreamResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Traiter les lignes SSE du buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? ""; // Garder le fragment incomplet

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") {
                if (trimmed === "data: [DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
                continue;
              }

              if (trimmed.startsWith("data: ")) {
                try {
                  const json = JSON.parse(trimmed.slice(6));
                  const delta = json.choices?.[0]?.delta?.content;
                  if (delta) {
                    // On envoie le delta brut sous forme SSE
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
                    );
                  }
                } catch {
                  // Ligne SSE malformée — on ignore
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Provider": provider,
        "X-Model": config.model,
      },
    });
  } catch (error: any) {
    console.error("Erreur route /api/chat :", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne : " + error.message }),
      { status: 500 }
    );
  }
}
