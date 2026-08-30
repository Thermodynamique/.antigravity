import { useCallback, useState } from "react";
import { useCanvas } from "@/contexts/CanvasContext";

const VCE_RENDERER_URL = process.env.NEXT_PUBLIC_VCE_API_URL || "http://localhost:8766";

/**
 * Hook qui connecte un nœud du Canvas au microservice VCE-Renderer Python.
 * - Envoie le contenu du nœud (HTML généré depuis documentData) au renderer
 * - Récupère les tuiles générées et met à jour le nœud avec `data.tiles`
 */
export function useVceRender() {
    const { nodes, updateNodeData } = useCanvas();
    const [renderingNodeId, setRenderingNodeId] = useState<string | null>(null);

    const renderNode = useCallback(async (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        setRenderingNodeId(nodeId);

        // Transforme le documentData BlockNote en HTML minimal lisible
        const documentData = (node.data?.documentData as any[]) || [];
        const htmlContent = buildHtmlFromDocument(
            node.data?.label as string,
            documentData
        );

        try {
            const res = await fetch(`${VCE_RENDERER_URL}/render`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({
                    doc_id: nodeId,
                    html_content: htmlContent,
                }),
            });

            if (!res.ok) throw new Error(`VCE Renderer error: ${res.status}`);

            const result = await res.json();

            if (result.status === "success") {
                const tiles = result.data.tiles.map((tile: any) => ({
                    id: tile.id,
                    url: `${VCE_RENDERER_URL}${tile.url}`, // URL absolue vers le serveur Python
                    x: tile.x,
                    y: tile.y,
                    width: tile.width,
                    height: tile.height,
                }));

                // Met à jour le nœud avec les tuiles
                updateNodeData(nodeId, { tiles, vceRendered: true });
            }
        } catch (err) {
            console.error("VCE Render failed:", err);
            // Si le renderer est hors ligne, on indique l'erreur discrètement
            updateNodeData(nodeId, {
                vceError: "Microservice VCE hors ligne (lancez vce-renderer/main.py)"
            });
        } finally {
            setRenderingNodeId(null);
        }
    }, [nodes, updateNodeData]);

    const clearTiles = useCallback((nodeId: string) => {
        updateNodeData(nodeId, { tiles: undefined, vceRendered: false, vceError: undefined });
    }, [updateNodeData]);

    return { renderNode, clearTiles, renderingNodeId };
}

/**
 * Convertit le format BlockNote (documentData) en HTML propre
 * pour le moteur de rendu Headless Playwright.
 */
function buildHtmlFromDocument(title: string, blocks: any[]): string {
    const bodyContent = blocks.map(block => {
        const text = block.content?.map((c: any) => c.text || "").join("") || "";

        switch (block.type) {
            case "heading":
                const level = block.props?.level || 2;
                return `<h${level}>${escapeHtml(text)}</h${level}>`;
            case "paragraph":
                return text ? `<p>${escapeHtml(text)}</p>` : "<br/>";
            case "bulletListItem":
                return `<li>${escapeHtml(text)}</li>`;
            case "numberedListItem":
                return `<li>${escapeHtml(text)}</li>`;
            case "code":
                return `<pre><code>${escapeHtml(text)}</code></pre>`;
            default:
                return text ? `<p>${escapeHtml(text)}</p>` : "";
        }
    }).join("\n");

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #000; background: #fff; max-width: 1200px; margin: 0 auto; padding: 40px; }
  h1, h2, h3 { font-weight: 700; margin: 1.5em 0 0.5em; }
  p { margin: 0.8em 0; }
  code, pre { background: #f4f4f4; border: 1px solid #ddd; border-radius: 4px; padding: 2px 6px; font-family: monospace; }
  pre { padding: 16px; overflow-x: auto; }
  li { margin: 0.4em 0; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${bodyContent}
</body>
</html>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
