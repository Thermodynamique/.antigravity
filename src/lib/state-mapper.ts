import { toJpeg } from 'html-to-image';

/**
 * Capture le Canvas React Flow sous forme d'image compressée
 * afin de l'envoyer au LLM (Visual State Mapping).
 */
export async function captureVisualState(): Promise<string | null> {
    try {
        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewport) {
            console.warn("Viewport React Flow introuvable pour la capture.");
            return null;
        }

        // Augmente la qualité pour que le LLM puisse lire le texte des documents
        const dataUrl = await toJpeg(viewport, {
            quality: 0.9,
            pixelRatio: 1.5,
            filter: (node) => {
                // Exclure les contrôles UI (boutons, minimap) de la capture
                if (node.classList && (
                    node.classList.contains('react-flow__controls') ||
                    node.classList.contains('react-flow__minimap')
                )) {
                    return false;
                }
                return true;
            }
        });

        return dataUrl;
    } catch (error) {
        console.error("Erreur lors de la capture du Visual State:", error);
        return null;
    }
}
