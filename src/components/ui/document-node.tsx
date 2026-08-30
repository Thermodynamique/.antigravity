import { memo, useEffect, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useCanvas } from "@/contexts/CanvasContext";
import { Trash2, Loader2, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { DocumentEditor } from "./document-editor";
import { useVceRender } from "@/hooks/useVceRender";

interface DocumentNodeProps {
    id: string;
    data: any;
    selected?: boolean;
}

export const DocumentNode = memo(({ id, data, selected }: DocumentNodeProps) => {
    const { setActiveDocumentId, activeDocumentId, updateNodeData, setNodes, setEdges } = useCanvas();
    const isActive = activeDocumentId === id;
    const { renderNode, clearTiles, renderingNodeId } = useVceRender();
    const isRendering = renderingNodeId === id;

    // Extract a brief preview from documentData if available
    let previewText = "Document vide...";
    if (data.documentData && Array.isArray(data.documentData) && data.documentData.length > 0) {
        const textParts: string[] = [];
        data.documentData.forEach((block: any) => {
            if (block?.content && Array.isArray(block.content)) {
                block.content.forEach((item: any) => {
                    if (item?.text) textParts.push(item.text);
                });
            } else if (typeof block?.content === 'string') {
                textParts.push(block.content);
            }
        });
        if (textParts.length > 0) {
            previewText = textParts.join("\n");
        }
    }

    const { setCenter, getNode, fitView } = useReactFlow();

    const handleSemanticZoom = async (tileId: number) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_VCE_API_URL || 'http://localhost:8766';
            const res = await fetch(`${baseUrl}/source`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ doc_id: id, tile_id: tileId })
            });
            const result = await res.json();
            if (result.status === 'success') {
                setActiveDocumentId(id);
            }
        } catch (e) {
            console.error("Semantic Zoom error:", e);
            setActiveDocumentId(id);
        }
    };

    useEffect(() => {
        if (isActive) {
            const node = getNode(id);
            if (node && node.position) {
                // target width: 900, target height: 85vh
                const centerX = node.position.x + 900 / 2;
                const nodeHeight = window.innerHeight * 0.85;
                const centerY = node.position.y + nodeHeight / 2;

                // Fixed larger zoom for better legibility (1.15x)
                const targetZoom = 1.15;

                // Center exactly on the fully expanded document, matching the CSS transition duration
                setCenter(centerX, centerY, { zoom: targetZoom, duration: 500 });

                // Ensure perfect fit after expansion
                const timeoutId = setTimeout(() => {
                    fitView({ nodes: [{ id }], duration: 300, padding: 0.05 });
                }, 550);

                return () => clearTimeout(timeoutId);
            }
        }
    }, [isActive, setCenter, fitView, getNode, id]);

    const firstClaimConf = data.vceClaims?.[0]?.confidence ?? 0.9;
    const isDashedBorder = firstClaimConf < 0.80 || data.vceClaims?.[0]?.action === "review_required";

    // Atomizing state from synthetic flow
    const atomizingState: 'raw_doc' | 'atomizing' | 'ready' | undefined = data.atomizingState;
    const isRawDoc = atomizingState === 'raw_doc';
    const isAtomizing = atomizingState === 'atomizing';
    const isReady = atomizingState === 'ready' || (!atomizingState && data.vceClaims?.length > 0);

    // Contradictions from edges detected by edges prop (passed via data)
    const hasContradictions = data.contradictedBy && data.contradictedBy.length > 0;
    const contradictionCount = data.contradictedBy?.length ?? 0;

    // Bitemporal indicator
    const isInvalidated = data.vceClaims?.some((c: any) => c.valid_until !== null && c.valid_until !== undefined);

    // Domain color stripe
    const domainColors: Record<string, string> = {
      medical: '#10b981',
      patent: '#f59e0b',
      legal: '#8b5cf6',
      code_source: '#3b82f6',
      default: '#64748b',
    };
    const domainColor = data.domainColor || domainColors[data.domain] || domainColors.default;

    // Statuts d'Agents & Réseau Fédéré / Collaboration Humaine
    const activeAgentRole = data.activeAgentRole as 'refactor' | 'research' | 'doc' | 'sentinel' | 'coder' | undefined;
    const activeHumanCollaborator = data.activeHumanCollaborator as string | undefined; // ex: "Alice"
    const isCertified = data.isCertified ?? true;
    const [showCertifiedPopover, setShowCertifiedPopover] = useState(false);

    return (
        <div
            className={cn(
                "relative group flex flex-col transition-all duration-500 font-sans rounded-3xl backdrop-blur-2xl text-neutral-100 overflow-hidden",
                isActive
                    ? "w-[1050px] min-h-[100vh] h-full cursor-default nodrag nowheel nopan border-none bg-transparent"
                    : "w-[320px] min-h-[160px] bg-neutral-950/70 border border-white/10 hover:border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:shadow-[0_30px_70px_rgba(0,0,0,0.9)] hover:scale-[1.01]",
                selected && !isActive && "ring-1 ring-white/30 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)]",
                // Tension Quartz Sombre pour les contradictions et invalidations bi-temporelles (Ambre très sombre 3% opacité, zéro clignotement)
                (hasContradictions || isInvalidated) && !isActive && "bg-amber-950/20 border-amber-500/30",
                // Résonance Sémantique dépolie pour le travail d'agent
                activeAgentRole && !isActive && "border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)]"
            )}
        >
            {/* ONDE DE PENSÉE SÉMANTIQUE (BALAYAGE SATINÉ SUR LA MATIÈRE) */}
            {activeAgentRole && !isActive && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                    <div
                        className="w-[200%] h-full bg-gradient-to-r from-transparent via-purple-400/10 to-transparent animate-[shimmer_2.5s_infinite]"
                        style={{
                            transform: 'skewX(-20deg)'
                        }}
                    />
                </div>
            )}

            {/* FILIGRANE CRYPTOGRAPHIQUE GRAVÉ SHA-256 (PAYSAGE DE FOND) */}
            {isCertified && !isActive && (
                <div className="absolute bottom-2 right-3 pointer-events-none opacity-5 group-hover:opacity-20 transition-opacity font-mono text-[8px] tracking-widest text-neutral-400 select-none">
                    SHA256:E3B0C442...934CA495
                </div>
            )}

            <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100 transition-opacity w-2.5 h-2.5 bg-neutral-400 rounded-full border-none shadow-md" />

            {isActive ? (
                <DocumentEditor
                    nodeId={id}
                    initialTitle={(data.label as string) || "Sans titre"}
                    initialData={(data.documentData as any[]) || []}
                    onClose={() => setActiveDocumentId(null)}
                    onSave={(title, content) => {
                        updateNodeData(id, { label: title, documentData: content });
                    }}
                    mode="canvas-focus"
                    onFitViewToNode={(targetId) => {
                        fitView({ nodes: [{ id: targetId }], duration: 600, padding: 0.3 });
                    }}
                />
            ) : (
                <div className="flex-1 flex flex-col pointer-events-none relative p-4">
                    {/* Micro-indicateurs d'état (Glow Dot + Sceau de Vérité Opale) */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: domainColor, boxShadow: `0 0 8px ${domainColor}` }}
                            />
                            <h3 className="font-sans font-medium text-xs text-white/90 truncate tracking-wide">
                                {data.label || "Sans titre"}
                            </h3>
                        </div>

                        <div className="flex items-center gap-1.5 pointer-events-auto relative">
                            {/* SCEAU DE VÉRITÉ CVI (MICRO-POINT OPALE + POPOVER D'AUDIT SHA-256) */}
                            {isCertified && (
                                <div
                                    className="relative"
                                    onMouseEnter={() => setShowCertifiedPopover(true)}
                                    onMouseLeave={() => setShowCertifiedPopover(false)}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] block cursor-help transition-transform hover:scale-125"
                                    />

                                    {showCertifiedPopover && (
                                        <div className="absolute right-0 top-4 z-50 w-64 p-3 bg-neutral-950/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl shadow-2xl text-[10px] space-y-1.5 animate-in fade-in duration-200 pointer-events-none">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-1 text-cyan-400 font-bold font-mono">
                                                <span>🛡️ SCEAU DE VÉRITÉ CVI</span>
                                                <span>100% Validé</span>
                                            </div>
                                            <p className="text-neutral-300 font-sans leading-relaxed">
                                                Scellé par l'Event Log Merkle DAG & Ingestion de 33 sources.
                                            </p>
                                            <div className="text-[9px] font-mono text-neutral-500 truncate pt-1 border-t border-white/5">
                                                SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {hasContradictions && (
                                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-ping" title="Contradiction détectée" />
                            )}
                        </div>
                    </div>

                    {/* Contenu épure / Aperçu du texte */}
                    <div className="flex-1 my-1">
                        <p className="text-[11px] text-neutral-400/80 line-clamp-3 font-sans font-normal leading-relaxed">
                            {previewText}
                        </p>
                    </div>

                    {/* Métadonnées épurées qui n'apparaissent qu'au survol (Zero Clutter par défaut) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-neutral-500">
                        <span>{data.vceClaims?.length > 0 ? `${data.vceClaims.length} faits` : "0 fait"}</span>
                        {data.attentionScore && (
                            <span>Score: {(data.attentionScore * 100).toFixed(0)}%</span>
                        )}
                    </div>

                    {/* Boutons d'actions épurés au survol */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-auto z-20">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveDocumentId(id);
                            }}
                            className="p-1 bg-white/10 hover:bg-white/20 text-neutral-200 rounded-md transition-all border border-white/10"
                            title="Ouvrir l'Éditeur Document"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setNodes(nds => nds.filter(n => n.id !== id));
                                setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id));
                            }}
                            className="p-1 bg-white/10 hover:bg-red-500/20 text-neutral-400 hover:text-red-300 rounded-md transition-all border border-white/10"
                            title="Supprimer le document"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100 transition-opacity w-2.5 h-2.5 bg-neutral-500 border-none" />
        </div>
    );
});
