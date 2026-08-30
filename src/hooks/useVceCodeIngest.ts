import { useCallback, useState } from "react";
import { useCanvas } from "@/contexts/CanvasContext";

const VCE_RENDERER_URL = process.env.NEXT_PUBLIC_VCE_API_URL || "http://localhost:8766";

export interface VceClaim {
  claim_id: string;
  text: string;
  confidence: number;
  action: "accepted" | "review" | "rejected";
  certitude: number;
  compliance: number;
  corroborating_sources: string[];
  function_name?: string;
  dependency_to?: string;
  language?: string;
  assertion?: string;
}

export interface IngestResult {
  atom_id: string;
  filename: string;
  language: string;
  claims: VceClaim[];
}

export function useVceCodeIngest() {
  const { updateNodeData, nodes, addNode, connectSemantic } = useCanvas();
  const [ingestingNodeId, setIngestingNodeId] = useState<string | null>(null);

  const ingestCode = useCallback(
    async (
      nodeId: string,
      filename: string,
      codeContent: string,
      language: string = "python"
    ): Promise<IngestResult | null> => {
      setIngestingNodeId(nodeId);
      updateNodeData(nodeId, { vceIngestStatus: "loading", vceError: undefined });

      try {
        const res = await fetch(`${VCE_RENDERER_URL}/ingest/code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            doc_id: nodeId,
            filename: filename || "script.ts",
            code_content: codeContent || "",
            language: language || "typescript",
            domain: "code_source",
          }),
        });

        if (!res.ok) {
          throw new Error(`Erreur VCE (${res.status}): Impossible d'ingérer le code`);
        }

        const data = await res.json();
        if (data.status === "success" && data.data) {
          const result: IngestResult = data.data;

          updateNodeData(nodeId, {
            vceClaims: result.claims,
            vceIngestStatus: "success",
            vceAtomId: result.atom_id,
          });

          // Parent node position
          const parentNode = nodes.find((n) => n.id === nodeId);
          const parentX = parentNode?.position?.x ?? 300;
          const parentY = parentNode?.position?.y ?? 200;

          // Auto-spawn spatial dependency links for accepted/review claims
          result.claims.forEach((claim, idx) => {
            const depName = claim.dependency_to || (claim.function_name ? `fn:${claim.function_name}` : null);
            if (!depName) return;

            const childId = `dep_atom_${nodeId}_${idx}`;

            // Check if node already exists
            const existing = nodes.find((n) => n.id === childId || n.data?.label === depName);
            const targetId = existing ? existing.id : childId;

            if (!existing) {
              const angle = (idx * Math.PI) / 3;
              const distance = 260;
              const childX = parentX + Math.cos(angle) * distance;
              const childY = parentY + Math.sin(angle) * distance;

              addNode({
                id: childId,
                position: { x: childX, y: childY },
                type: "custom",
                data: {
                  label: depName,
                  category: "note",
                  messages: [
                    {
                      role: "assistant",
                      content: `**Atome de Dépendance World Graph VCE**\n- **Nom** : \`${depName}\`\n- **Assertion** : ${claim.text}\n- **Confiance** : ${Math.round(claim.confidence * 100)}%\n- **Statut** : ${claim.action.toUpperCase()}`,
                    },
                  ],
                },
              } as any);
            }

            // Create semantic edge linking parent code to dependency
            connectSemantic(nodeId, targetId, claim.dependency_to ? "importe" : "exécute");
          });

          return result;
        } else {
          throw new Error(data.detail || "Erreur d'ingestion VCE");
        }
      } catch (err: any) {
        console.error("[useVceCodeIngest] Erreur:", err);
        updateNodeData(nodeId, {
          vceIngestStatus: "error",
          vceError: err.message || "Erreur de connexion au backend VCE",
        });
        return null;
      } finally {
        setIngestingNodeId(null);
      }
    },
    [updateNodeData, nodes, addNode, connectSemantic]
  );

  return { ingestCode, ingestingNodeId };
}
