import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckSquare, Trash2, LucideIcon, Sparkles, FileText, Bookmark, Star, Zap, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvas } from "@/contexts/CanvasContext";

interface BranchNodeProps {
    id: string;
    data: any;
    selected?: boolean;
    category: string;
    catColor: string;
    catBorder: string;
    catBg: string;
    CatIcon: LucideIcon;
    lastMessage: string;
    handleSummarize: () => void;
}

export const BranchNode = memo(({
    id, data, selected, category, catColor, catBorder, catBg, CatIcon, lastMessage, handleSummarize
}: BranchNodeProps) => {
    const { setNodes, setEdges, updateNodeData } = useCanvas();
    const attentionScore = data.attentionScore ?? (data.vceClaims ? 0.85 : 0.50);
    const isHighAttention = attentionScore >= 0.75;
    const zoomLevel = data.semanticZoomLevel ?? 3;

    // D2 — Mémoire à 5 Niveaux (0: Éphémère, 1: Contexte, 2: Retenu, 3: Critique, 4: Intégré)
    const retentionLevel: 0 | 1 | 2 | 3 | 4 = data.retentionLevel ?? 1;

    const memoryBadges: Record<number, { label: string; icon: any; color: string; border: string; bg: string }> = {
        0: { label: "N0 Éphémère", icon: Zap, color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-950/40" },
        1: { label: "N1 Contexte", icon: Bookmark, color: "text-neutral-400", border: "border-neutral-800", bg: "bg-neutral-900" },
        2: { label: "N2 Retenu", icon: Bookmark, color: "text-blue-400", border: "border-blue-500/40", bg: "bg-blue-950/40" },
        3: { label: "N3 Critique", icon: Star, color: "text-purple-300", border: "border-purple-500/50", bg: "bg-purple-950/60" },
        4: { label: "N4 Intégré", icon: FileCheck, color: "text-emerald-300", border: "border-emerald-500/50", bg: "bg-emerald-950/60" },
    };

    const currentMemory = memoryBadges[retentionLevel];
    const MemIcon = currentMemory.icon;

    const cycleRetentionLevel = (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextLevel = ((retentionLevel + 1) % 5) as 0 | 1 | 2 | 3 | 4;
        updateNodeData(id, { retentionLevel: nextLevel });
    };

    // ─── LEVEL 4: ATOME EXACT (expanded with claims & metadata) ─────
    if (zoomLevel === 4) {
        const claims = data.vceClaims || [];
        return (
            <div
                className={cn(
                    "relative group flex flex-col min-w-[320px] max-w-[400px] bg-[#111113] border transition-all duration-300 hover:shadow-2xl hover:border-neutral-600",
                    selected && "ring-2 ring-neutral-400 scale-[1.02] z-50 border-neutral-400",
                    data.isActive && "ring-2 ring-neutral-400 border-neutral-400",
                    isHighAttention && "shadow-[0_0_24px_rgba(168,85,247,0.15)]",
                    retentionLevel === 3 && "border-purple-500/60 ring-1 ring-purple-500/30",
                    retentionLevel === 4 && "border-emerald-500/60 ring-1 ring-emerald-500/30",
                    retentionLevel === 0 && "opacity-70 border-amber-900/40",
                    (retentionLevel !== 3 && retentionLevel !== 4 && retentionLevel !== 0) && "border-neutral-800"
                )}
            >
                <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-neutral-600 rounded-none opacity-0 group-hover:opacity-100 transition-opacity border-none" />

                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-800/60">
                    <div className={cn("flex items-center justify-center w-7 h-7 rounded-full shrink-0 shadow-sm border", catBg, catColor, catBorder)}>
                        <CatIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 truncate flex-1">
                        {data.label?.replace(/^(Exploration|Hypothèse|Décision|Action)\s*:\s*/i, "") || "Discussion"}
                    </span>

                    {/* D2 — Badge Mémoire 5 niveaux */}
                    <button
                        onClick={cycleRetentionLevel}
                        className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 transition-all hover:scale-105 shrink-0",
                            currentMemory.bg, currentMemory.color, currentMemory.border
                        )}
                        title="Cliquer pour changer le niveau de mémoire (N0 Éphémère -> N4 Intégré)"
                    >
                        <MemIcon className="w-2.5 h-2.5" />
                        {currentMemory.label}
                    </button>

                    <span className={cn(
                        "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 shrink-0",
                        isHighAttention ? "bg-purple-950/60 text-purple-300 border-purple-500/40" : "bg-neutral-900 text-neutral-400 border-neutral-800"
                    )}>
                        {isHighAttention && <Sparkles className="w-2.5 h-2.5 text-purple-400" />}
                        {Math.round(attentionScore * 100)}%
                    </span>
                </div>

                {/* Message Body */}
                <div className="px-3 py-2">
                    <p className="text-[12px] text-neutral-300 leading-relaxed line-clamp-4">
                        {lastMessage || "Aucun message."}
                    </p>
                </div>

                {/* Claims Section */}
                {claims.length > 0 && (
                    <div className="px-3 py-2 border-t border-neutral-800/40">
                        <div className="text-[8px] uppercase font-bold tracking-widest text-purple-400 mb-1.5 flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" /> Claims ({claims.length})
                        </div>
                        <div className="space-y-1 max-h-[100px] overflow-y-auto">
                            {claims.slice(0, 4).map((c: any, i: number) => (
                                <div key={i} className="flex items-start gap-1.5 text-[10px]">
                                    <span className={cn(
                                        "px-1 py-0.5 rounded text-[7px] font-mono font-bold shrink-0 mt-0.5",
                                        c.action === 'auto_accepted' ? "bg-green-950 text-green-400" :
                                        c.action === 'rejected' ? "bg-red-950 text-red-400" :
                                        "bg-yellow-950 text-yellow-400"
                                    )}>
                                        {c.action === 'auto_accepted' ? '✓' : c.action === 'rejected' ? '✗' : '?'}
                                    </span>
                                    <span className="text-neutral-400 line-clamp-1">{c.text || "—"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions (Hover) */}
                <div className="flex items-center justify-end px-2 py-1.5 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity border-t border-neutral-800/20">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (id) {
                                updateNodeData(id, {
                                    category: 'code',
                                    domain: 'code_source',
                                    code: `// Converti depuis la branche VCE : ${data.label || 'Code'}\n// ${lastMessage.replace(/\n/g, '\n// ')}\n`,
                                    language: 'typescript'
                                });
                            }
                        }}
                        className="p-1.5 text-blue-400 hover:text-blue-200 hover:bg-blue-900/40 rounded-full transition-colors flex items-center gap-1 text-[9px] font-bold"
                        title="Basculer vers le Skin Code Source (Monaco IDE)"
                    >
                        <span>💻 Monaco</span>
                    </button>
                    <button onClick={handleSummarize} className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full transition-colors" title="Résumer en Document">
                        <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); if (id) { setNodes(nds => nds.filter(n => n.id !== id)); setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id)); } }}
                        className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-900/30 rounded-full transition-colors" title="Supprimer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>

                <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-neutral-600 rounded-none opacity-0 group-hover:opacity-100 transition-opacity border-none" />
            </div>
        );
    }

    // ─── STANDARD FULL VUE ────────────────
    return (
        <div
            className={cn(
                "relative group flex items-center min-w-[300px] max-w-[360px] bg-[#121319]/70 backdrop-blur-2xl border rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] hover:border-white/30 text-white shadow-xl",
                selected && "ring-2 ring-indigo-500/80 scale-[1.02] z-50 border-indigo-400/80 shadow-[0_0_35px_rgba(99,102,241,0.4)]",
                data.isActive && "ring-2 ring-indigo-400 border-indigo-400",
                isHighAttention && "shadow-[0_0_25px_rgba(168,85,247,0.25)] border-purple-500/40",
                retentionLevel === 3 && "border-purple-500/60 ring-1 ring-purple-500/30",
                retentionLevel === 4 && "border-emerald-500/60 ring-1 ring-emerald-500/30",
                retentionLevel === 0 && "opacity-75 border-amber-900/40",
                (retentionLevel !== 3 && retentionLevel !== 4 && retentionLevel !== 0) && "border-white/10"
            )}
        >
            <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border-none" />

            {/* Icon Bubble */}
            <div className={cn("flex items-center justify-center w-8 h-8 rounded-full shrink-0 ml-2 shadow-sm border", catBg, catColor, catBorder)}>
                <CatIcon className="w-3.5 h-3.5" />
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 py-2.5 px-3 overflow-hidden">
                <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-300 truncate">
                        {data.label?.replace(/^(Exploration|Hypothèse|Décision|Action)\s*:\s*/i, "") || "Discussion"}
                    </span>

                    {/* D2 — Badge Mémoire 5 niveaux */}
                    <button
                        onClick={cycleRetentionLevel}
                        className={cn(
                            "text-[8px] font-bold px-1.5 py-0.2 rounded-full border flex items-center gap-0.5 transition-all hover:scale-105 shrink-0",
                            currentMemory.bg, currentMemory.color, currentMemory.border
                        )}
                        title="Cliquer pour changer le niveau de mémoire (N0 Éphémère -> N4 Intégré)"
                    >
                        <MemIcon className="w-2 h-2" />
                        {currentMemory.label}
                    </button>

                    <span
                        className={cn(
                            "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border flex items-center gap-0.5 shrink-0",
                            isHighAttention ? "bg-purple-950/80 text-purple-300 border-purple-500/40" : "bg-neutral-950 text-neutral-400 border-neutral-800"
                        )}
                        title={`Attention Score VCE : ${Math.round(attentionScore * 100)}%`}
                    >
                        {isHighAttention && <Sparkles className="w-2.5 h-2.5 text-purple-400" />}
                        {Math.round(attentionScore * 100)}%
                    </span>
                </div>
                <p className="text-xs text-neutral-300/90 leading-snug line-clamp-2 font-sans">
                    {lastMessage || "Aucun message."}
                </p>
            </div>

            {/* Actions (Hover) */}
            <div className="flex items-center pr-2 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={handleSummarize} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Fermer et transformer en résumé">
                    <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); if (id) { setNodes(nds => nds.filter(n => n.id !== id)); setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id)); } }}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded-full transition-colors" title="Supprimer la branche"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border-none" />
        </div>
    );
});

BranchNode.displayName = "BranchNode";
