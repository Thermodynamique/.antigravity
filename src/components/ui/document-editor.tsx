"use client";

import { useState, useEffect } from "react";
import { FileText, FileDown, Moon, Sun, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { filterSuggestionItems, insertOrUpdateBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { AlertCircle, Shield, CheckCircle2, AlertTriangle, ExternalLink, Bookmark, HelpCircle } from "lucide-react";
import { createPortal } from "react-dom";
import { useCanvas } from "@/contexts/CanvasContext";
import { useRigorousResearch } from "@/contexts/RigorousResearchContext";

interface DocumentEditorProps {
    nodeId: string;
    initialTitle: string;
    initialData: any;
    onClose: () => void;
    onSave: (title: string, data: any) => void;
    mode?: "inline" | "floating" | "fullscreen" | "canvas-focus";
}

export function DocumentEditor({ nodeId, initialTitle, initialData, onClose, onSave, mode = "inline" }: DocumentEditorProps) {
    const { isLightMode, setIsLightMode } = useCanvas();
    const { isRigorousModeEnabled, documentClaims, invalidationAlerts, triggerClaimInvalidation } = useRigorousResearch();
    const [title, setTitle] = useState(initialTitle || "Sans titre");
    const [isMounted, setIsMounted] = useState(false);
    const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setIsMounted(true);
        if (mode === "canvas-focus") {
            setPortalNode(document.getElementById("canvas-top-left-controls"));
        }
    }, [mode]);

    const isValidContent = Array.isArray(initialData) && initialData.length > 0;

    const editor = useCreateBlockNote({
        initialContent: isValidContent ? initialData : undefined,
    });

    const handleClose = () => {
        const currentData = editor.document;
        onSave(title, currentData);
        onClose();
    };

    const handleExport = async (format: 'md' | 'txt' | 'html' | 'pdf' | 'doc') => {
        if (format === 'pdf') {
            window.print();
            return;
        }

        let content = "";
        let mimeType = "text/plain";
        if (format === 'md') {
            const blocks = await editor.blocksToMarkdownLossy(editor.document);
            content = `# ${title}\n\n${blocks}`;
        } else if (format === 'html') {
            const blocks = await editor.blocksToHTMLLossy(editor.document);
            content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; color: #2D231E; background: #E8E3D7; }
        .page { background: #FDFCF8; padding: 60px 80px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }
        h1 { color: #2D231E; font-size: 2.2em; border-bottom: 2px solid #EAE5D9; padding-bottom: 12px; margin-bottom: 24px; }
        p { margin-bottom: 1em; }
    </style>
</head>
<body>
    <div class="page">
        <h1>${title}</h1>
        ${blocks}
    </div>
</body>
</html>`;
            mimeType = "text/html";
        } else if (format === 'doc') {
            const blocks = await editor.blocksToHTMLLossy(editor.document);
            content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${title}</title></head>
<body><h1>${title}</h1>${blocks}</body></html>`;
            mimeType = "application/msword";
        } else {
            const blocks = await editor.blocksToMarkdownLossy(editor.document);
            content = `${title}\n\n${blocks}`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title || 'Document'}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!isMounted) return null;

    return (
        <div className={cn(
            "flex flex-col w-full h-full overflow-hidden transition-colors duration-500 font-sans",
            isLightMode ? "bg-[#EAE5D9] text-[#2D231E]" : "bg-[#121214] text-[#ECECF1]"
        )}>
            {/* Document Header Bar */}
            <div className={cn(
                "flex items-center justify-between px-6 py-3.5 shrink-0 border-b backdrop-blur-md transition-colors duration-500 z-10",
                isLightMode
                    ? "bg-[#EAE5D9]/80 border-[#DDD7C9] text-[#2D231E]"
                    : "bg-[#121214]/80 border-neutral-800/80 text-neutral-300"
            )}>
                <div className="flex items-center gap-3 max-w-[60%] overflow-hidden">
                    <div className={cn(
                        "p-1.5 rounded-lg shrink-0",
                        isLightMode ? "bg-[#DFD9CA] text-[#5C4D42]" : "bg-neutral-800 text-purple-400"
                    )}>
                        <FileText className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            onSave(e.target.value, editor.document);
                        }}
                        className={cn(
                            "bg-transparent font-semibold text-sm outline-none w-full min-w-[120px] max-w-[350px] transition-colors truncate",
                            isLightMode
                                ? "text-[#2D231E] placeholder:text-[#8C7E72] focus:bg-[#F2ECE0]/60 rounded px-1.5 py-0.5"
                                : "text-neutral-200 placeholder:text-neutral-600 focus:bg-neutral-800/60 rounded px-1.5 py-0.5"
                        )}
                        placeholder="Titre du document..."
                    />
                </div>

                {/* Actions Top Right — Épuré & minimaliste au survol */}
                <div className="flex items-center gap-2 shrink-0 opacity-40 hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => setIsLightMode(!isLightMode)}
                        className="p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 text-neutral-400 hover:text-white"
                        title={isLightMode ? "Passer en mode sombre" : "Passer en mode papier clair"}
                    >
                        {isLightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                    </button>

                    {/* BOUTON FERMER LE DOCUMENT (ÉPURÉ) */}
                    <button
                        onClick={handleClose}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 text-neutral-400 hover:text-white hover:bg-white/10"
                        title="Fermer le document et revenir au Canvas"
                    >
                        <span>✕</span>
                    </button>
                </div>
            </div>


            {/* Canvas Focus Floating Controls (Portal) */}
            {mode === "canvas-focus" && portalNode && createPortal(
                <div className="flex items-center gap-3 animate-in fade-in duration-500 delay-100 fill-mode-both pointer-events-auto">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-neutral-900/90 hover:bg-neutral-800 text-white font-medium text-xs rounded-xl border border-neutral-700 shadow-2xl transition-all flex items-center gap-2"
                    >
                        Fermer la vue plein écran
                    </button>
                </div>,
                portalNode
            )}

            {/* Document Paper Sheet Container */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar flex flex-col w-full mx-auto p-4 sm:p-8 md:p-12 items-center"
                style={{ overscrollBehavior: 'contain', scrollBehavior: 'smooth' }}
                onWheel={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                {/* THE ELEGANT PAPER SHEET (matching reference design) */}
                <div className="flex gap-6 w-full max-w-[1150px] items-start my-4">
                    <div className={cn(
                        "flex-1 min-h-[1050px] transition-all duration-300 rounded-2xl p-8 sm:p-14 md:p-16 relative",
                        isLightMode
                            ? "bg-[#FDFCF8] text-[#2D231E] shadow-[0_20px_60px_-15px_rgba(45,35,30,0.12)] border border-[#E3DDD0]"
                            : "bg-[#1A1A1C] text-[#ECECF1] shadow-[0_25px_70px_rgba(0,0,0,0.5)] border border-neutral-800/90"
                    )}>
                        {/* BANNER : ALERTE COHÉRENCE ET INVALIDATION (Modèle Bi-temporel) */}
                        {isRigorousModeEnabled && invalidationAlerts.some(a => !a.resolved) && (
                            <div className="mb-6 p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 flex items-start gap-3 animate-in fade-in duration-300">
                                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div className="flex-1 text-xs">
                                    <div className="font-bold text-sm text-amber-300 mb-1 flex items-center gap-2">
                                        <span>⚠️ Cohérence du Document — Passage à Revoir</span>
                                        <span className="px-2 py-0.5 rounded-full bg-amber-900 text-amber-200 text-[10px] font-mono font-bold">Bi-temporel (valid_until)</span>
                                    </div>
                                    <p className="leading-relaxed">
                                        Une assertion source liée à ce document a été contredite ou invalidée dans la Couche 1 (Workspace). Le passage dépendant est conservé mais marqué pour révision.
                                    </p>
                                    <div className="mt-2 space-y-1">
                                        {invalidationAlerts.filter(a => !a.resolved).map(alert => (
                                            <div key={alert.id} className="p-2 rounded bg-amber-900/40 border border-amber-500/30 flex items-center justify-between gap-2">
                                                <span className="font-mono text-[11px] truncate">"{alert.claimText}"</span>
                                                <span className="text-[10px] font-bold text-amber-400">Raison: {alert.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Document Title Header */}
                        <div className="mb-8 border-b pb-6 transition-colors border-neutral-200/60 dark:border-neutral-800/80">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    onSave(e.target.value, editor.document);
                                }}
                                className={cn(
                                    "bg-transparent font-bold text-3xl sm:text-4xl outline-none w-full tracking-tight transition-colors font-serif",
                                    isLightMode
                                        ? "text-[#2D231E] placeholder:text-[#A39589]"
                                        : "text-neutral-100 placeholder:text-neutral-600"
                                )}
                                placeholder="Titre du document..."
                            />
                            <div className={cn(
                                "flex items-center justify-between mt-2 text-xs font-mono",
                                isLightMode ? "text-[#8C7E72]" : "text-neutral-500"
                            )}>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Document structuré VCE • Couche 2 (Projection matérialisée)</span>
                                </div>
                                {isRigorousModeEnabled && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Shield className="w-3 h-3 text-emerald-400" /> Mode Recherche Rigoureuse
                                    </span>
                                )}
                            </div>
                        </div>

                    {/* Editor Content Area */}
                    <div className="w-full min-h-[750px] leading-relaxed">
                        <style>{`
                            .bn-side-menu { opacity: 0.4; transition: opacity 0.2s; }
                            .bn-side-menu:hover { opacity: 1; }
                            .bn-block-content { padding-top: 3px !important; padding-bottom: 3px !important; }
                            .bn-editor { padding-left: 0 !important; padding-right: 0 !important; background: transparent !important; }
                            .bn-container { background: transparent !important; }
                        `}</style>
                        <BlockNoteView
                            editor={editor}
                            theme={isLightMode ? "light" : "dark"}
                            slashMenu={false}
                            onChange={() => onSave(title, editor.document)}
                        >
                            <SuggestionMenuController
                                triggerCharacter={"/"}
                                getItems={async (query) =>
                                    filterSuggestionItems(
                                        [
                                            ...getDefaultReactSlashMenuItems(editor),
                                            {
                                                title: "Idée / Brainstorm",
                                                onItemClick: () => {
                                                    insertOrUpdateBlock(editor, {
                                                        type: "paragraph",
                                                        content: "💡 ",
                                                    });
                                                },
                                                aliases: ["idee", "brainstorm", "idea"],
                                                group: "IA Co-pilot",
                                                icon: <AlertCircle size={18} />,
                                                subtext: "Générer une idée avec l'IA",
                                            }
                                        ],
                                        query
                                    )
                                }
                            />
                        </BlockNoteView>
                    </div>
                </div>

                {/* MARGINALIA EN FLOTTAISON (GLASS NOTES) — ALIGNÉES DANS LA MARGE DROITE */}
                {isRigorousModeEnabled && documentClaims.length > 0 && (
                    <div className="w-64 shrink-0 space-y-3 font-sans opacity-30 hover:opacity-100 transition-opacity duration-500 hidden xl:block">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 px-2 pb-1 border-b border-white/5 flex items-center justify-between">
                            <span>Annotations & Preuves</span>
                            <Shield className="w-3 h-3 text-cyan-400" />
                        </div>

                        <div className="space-y-2.5">
                            {documentClaims.map((claim, idx) => (
                                <div
                                    key={claim.claimId || idx}
                                    className={cn(
                                        "p-3 rounded-2xl backdrop-blur-2xl border text-xs space-y-1.5 transition-all shadow-xl",
                                        claim.status === "invalidated"
                                            ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                                            : "bg-neutral-950/70 border-white/10 text-neutral-300 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
                                        <span className="text-neutral-500 font-semibold">Preuve #{idx + 1}</span>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-full font-bold text-[9px]",
                                            claim.status === "invalidated"
                                                ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                                                : "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                                        )}>
                                            {claim.status === "invalidated" ? "⚠️ À réviser" : "🛡️ Certifié"}
                                        </span>
                                    </div>

                                    <p className="text-[11px] leading-relaxed font-sans font-normal text-neutral-200/90">
                                        "{claim.text}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
    );
}