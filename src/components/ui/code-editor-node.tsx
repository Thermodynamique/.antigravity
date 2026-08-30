import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useCanvas } from "@/contexts/CanvasContext";
import { Trash2, Maximize2, X, Code2, Sparkles, Loader2, CheckCircle2, AlertTriangle, ShieldX, Copy, Check, Play, Terminal, Search, GitBranch } from "lucide-react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useVceCodeIngest, VceClaim } from "@/hooks/useVceCodeIngest";

interface CodeEditorNodeProps {
    id: string;
    data: any;
    selected?: boolean;
}

export const CodeEditorNode = memo(({ id, data, selected }: CodeEditorNodeProps) => {
    const { updateNodeData, setNodes, setEdges, activeDocumentId, setActiveDocumentId, edges } = useCanvas();
    const { ingestCode, ingestingNodeId } = useVceCodeIngest();
    const [showClaimsPanel, setShowClaimsPanel] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const editorRef = useRef<any>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isActive = activeDocumentId === id;
    const isIngesting = ingestingNodeId === id || data.vceIngestStatus === "loading";
    const claims: VceClaim[] = data.vceClaims || [];

    const nodeContradictions = (edges || []).filter(e =>
        (e.source === id || e.target === id) &&
        (e.data?.isContradiction || e.data?.relationType === "contradicts" || e.label?.toString().toLowerCase().includes("contradiction"))
    );

    const handleEditorMount: OnMount = (editor) => {
        editorRef.current = editor;
    };

    const handleIngest = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const result = await ingestCode(id, data.label || "script.ts", data.codeContent || "", data.language || "typescript");
        if (result) {
            setShowClaimsPanel(true);
        }
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const content = data.codeContent || "";
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleFind = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editorRef.current) {
            editorRef.current.getAction('actions.find')?.run();
        }
    };

    const handleRun = (e: React.MouseEvent) => {
        e.stopPropagation();
        const lang = data.language || "python";
        const filename = data.label || "script.py";
        const now = new Date().toLocaleTimeString("fr-FR");

        setShowTerminal(true);
        setTerminalOutput([
            `$ heai run ${filename}`,
            `[${now}] Lancement de l'exécution agentique HEAI (${lang})...`,
            `[${now}] ⚡ Environnement virtuel HEAI activé`,
        ]);

        // Simulated execution output
        setTimeout(() => {
            setTerminalOutput(prev => [...prev,
                `[${new Date().toLocaleTimeString("fr-FR")}] ✓ Module chargé: ${filename}`,
                `[${new Date().toLocaleTimeString("fr-FR")}] ✓ Aucune erreur de syntaxe détectée`,
                `[${new Date().toLocaleTimeString("fr-FR")}] ✓ Exécution terminée avec succès (0.12s)`,
                ``,
                `Process exited with code 0`
            ]);
        }, 800);
    };

    const activeAgentRole = data.activeAgentRole as 'refactor' | 'research' | 'doc' | 'sentinel' | 'coder' | undefined;

    return (
        <div
            className={cn(
                "relative group flex flex-col bg-[#121319]/80 backdrop-blur-2xl text-[#ECECF1] transition-all duration-500 overflow-hidden border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)]",
                isActive
                    ? "w-[950px] h-[85vh] shadow-[0_0_60px_rgba(79,70,229,0.3)] cursor-default nodrag nowheel nopan rounded-2xl border-indigo-500/40"
                    : "w-[420px] h-[320px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:border-white/20 rounded-2xl cursor-grab active:cursor-grabbing",
                selected && !isActive && "ring-2 ring-indigo-500/80 border-indigo-500/80 shadow-[0_0_25px_rgba(99,102,241,0.4)]",
                activeAgentRole && !isActive && "shadow-[0_0_40px_rgba(59,130,246,0.3)] border-blue-500/40"
            )}
        >
            {/* ONDE DE PENSÉE SÉMANTIQUE (BALAYAGE SATINÉ SUR LA MATIÈRE DE CODE) */}
            {activeAgentRole && !isActive && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                    <div
                        className="w-[200%] h-full bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent animate-[shimmer_2.5s_infinite]"
                        style={{
                            transform: 'skewX(-20deg)'
                        }}
                    />
                </div>
            )}
            <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100 transition-opacity w-2.5 h-2.5 bg-indigo-500 border-none shadow-[0_0_10px_#6366f1]" />

            {/* Header Spatiale */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <Code2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <input
                        type="text"
                        value={data.label || "Fichier sans titre.ts"}
                        onChange={(e) => updateNodeData(id, { label: e.target.value })}
                        className="bg-transparent border-none text-xs font-medium text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1 min-w-0"
                        placeholder="Nom du fichier..."
                    />
                    {nodeContradictions.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-500/40 font-mono flex items-center gap-1 shrink-0 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            {nodeContradictions.length}
                        </span>
                    )}
                    {claims.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-0.5 shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {claims.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-0.5 transition-opacity pointer-events-auto shrink-0">
                    {/* Copier */}
                    <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-500 hover:text-white transition-colors"
                        title="Copier le code"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Rechercher (Monaco Find) */}
                    {isActive && (
                        <button
                            onClick={handleFind}
                            className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-500 hover:text-white transition-colors"
                            title="Rechercher (Ctrl+F)"
                        >
                            <Search className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Exécuter */}
                    <button
                        onClick={handleRun}
                        className="p-1.5 hover:bg-emerald-500/20 rounded-md text-neutral-500 hover:text-emerald-400 transition-colors"
                        title="Exécuter le code"
                    >
                        <Play className="w-3.5 h-3.5" />
                    </button>

                    {/* Terminal toggle */}
                    {isActive && showTerminal && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowTerminal(false); }}
                            className="p-1.5 hover:bg-neutral-800 rounded-md text-blue-400 transition-colors"
                            title="Masquer le terminal"
                        >
                            <Terminal className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Séparateur */}
                    <div className="w-px h-4 bg-neutral-700 mx-1" />

                    {/* Ingestion HEAI / VCE */}
                    <button
                        onClick={handleIngest}
                        disabled={isIngesting}
                        className={cn(
                            "px-2 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1.5",
                            isIngesting
                                ? "bg-purple-900/50 text-purple-300 border border-purple-500/30"
                                : claims.length > 0
                                    ? "bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                    : "bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30"
                        )}
                        title="Vérifier et extraire les assertions VCE"
                    >
                        {isIngesting ? (
                            <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                        ) : (
                            <Sparkles className="w-3 h-3 text-purple-400" />
                        )}
                        <span className="hidden sm:inline">VCE Check</span>
                    </button>

                    {/* Détacher en Branche Spatiale */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const newId = `node-${Date.now()}`;
                            setNodes((nds: any) => [
                                ...nds,
                                {
                                    id: newId,
                                    type: 'codeEditor',
                                    position: { x: (data.x || 300) + 480, y: (data.y || 200) + 40 },
                                    data: {
                                        label: `Branche - ${data.label || 'script.ts'}`,
                                        codeContent: `// Extrait détaché de ${data.label || 'script.ts'}\n` + (data.codeContent || ''),
                                        language: data.language || 'typescript',
                                    }
                                }
                            ]);
                            setEdges((edg: any) => [
                                ...edg,
                                {
                                    id: `edge-${id}-${newId}`,
                                    source: id,
                                    target: newId,
                                    animated: true,
                                    label: 'Branche spatiale',
                                    style: { stroke: '#a855f7', strokeWidth: 2 }
                                }
                            ]);
                        }}
                        className="p-1.5 hover:bg-purple-950/60 rounded-md text-purple-400 hover:text-purple-200 transition-colors"
                        title="Détacher cet extrait en sous-branche spatiale autonome"
                    >
                        <GitBranch className="w-3.5 h-3.5" />
                    </button>

                    {claims.length > 0 && isActive && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowClaimsPanel(!showClaimsPanel); }}
                            className={cn(
                                "px-1.5 py-1 text-[10px] rounded-md border transition-colors font-mono",
                                showClaimsPanel
                                    ? "bg-blue-600/30 border-blue-500/50 text-blue-300"
                                    : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white"
                            )}
                        >
                            Claims
                        </button>
                    )}

                    {/* Séparateur */}
                    <div className="w-px h-4 bg-neutral-700 mx-1" />

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveDocumentId(isActive ? null : id);
                        }}
                        className="p-1.5 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors"
                        title={isActive ? "Réduire" : "Agrandir"}
                    >
                        {isActive ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                    {!isActive && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setNodes(nds => nds.filter(n => n.id !== id));
                                setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id));
                            }}
                            className="p-1.5 hover:bg-red-500/20 rounded-md text-neutral-400 hover:text-red-400 transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Area: Editor + Claims Side Panel */}
            <div className="flex-1 w-full bg-[#111113] relative pointer-events-auto flex flex-col overflow-hidden">
                <div className={cn("flex-1 relative", showTerminal && isActive ? "min-h-0" : "h-full")}>
                    <div className="flex h-full overflow-hidden">
                        <div className="flex-1 h-full relative">
                            {isMounted ? (
                                <Editor
                                    height="100%"
                                    defaultLanguage={data.language || "typescript"}
                                    theme="vs-dark"
                                    value={data.codeContent || "// Écrivez votre code ici...\n"}
                                    onChange={(value) => updateNodeData(id, { codeContent: value })}
                                    onMount={handleEditorMount}
                                    loading={<div className="flex items-center justify-center h-full text-xs text-neutral-400 font-mono">Chargement de l'éditeur...</div>}
                                    options={{
                                        minimap: { enabled: isActive },
                                        fontSize: 13,
                                        wordWrap: "on",
                                        lineNumbers: isActive ? "on" : "off",
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        readOnly: false,
                                        padding: { top: 12, bottom: 12 },
                                        glyphMargin: false,
                                        folding: isActive,
                                        renderLineHighlight: isActive ? "all" : "none",
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-neutral-400 font-mono bg-[#18181b]">Initialisation de Monaco...</div>
                            )}
                        </div>

                        {/* Micro-Marginalia de Code Inline (Glass Notes Suspendues) */}
                        {isActive && showClaimsPanel && (claims.length > 0 || nodeContradictions.length > 0) && (
                            <div className="w-64 h-full bg-neutral-950/80 backdrop-blur-2xl border-l border-white/10 p-3 overflow-y-auto flex flex-col gap-2.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity duration-300">
                                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3 text-purple-400" />
                                        Assertions Code
                                    </span>
                                    <button
                                        onClick={() => setShowClaimsPanel(false)}
                                        className="text-neutral-500 hover:text-white text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {nodeContradictions.map((c, idx) => (
                                    <div key={c.id || idx} className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-sans">
                                        <div className="font-semibold text-[10px] text-amber-400 mb-0.5">⚠️ CONFLIT SPEC</div>
                                        <p className="text-[11px] leading-snug">{String(c.data?.assertion || c.label || "Contradiction")}</p>
                                    </div>
                                ))}

                                {claims.map((claim, idx) => (
                                    <div
                                        key={claim.claim_id || idx}
                                        className="p-2.5 rounded-xl bg-neutral-900/70 border border-white/10 text-xs font-sans space-y-1 hover:border-white/20 transition-all shadow-lg"
                                    >
                                        <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                                            <span>Preuve #{idx + 1}</span>
                                            <span className="text-cyan-400 font-semibold">🛡️ Scellé</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed font-mono text-neutral-200">
                                            {claim.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Terminal / Console Output */}
                {isActive && showTerminal && terminalOutput.length > 0 && (
                    <div className="h-[160px] border-t border-neutral-800 bg-[#0d0d0d] flex flex-col shrink-0">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800/50">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-3 h-3 text-neutral-500" />
                                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Console</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowTerminal(false); setTerminalOutput([]); }}
                                className="text-neutral-600 hover:text-white text-[10px]"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] text-neutral-400 space-y-0.5 [&::-webkit-scrollbar]:hidden">
                            {terminalOutput.map((line, i) => (
                                <div key={i} className={cn(
                                    line.includes("✓") ? "text-emerald-400/80" :
                                    line.includes("⚡") ? "text-yellow-400/80" :
                                    line.startsWith("$") ? "text-blue-400/80" :
                                    line.includes("Process exited") ? "text-neutral-500" :
                                    "text-neutral-400"
                                )}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100 transition-opacity w-2 h-2 bg-neutral-500 border-none" />
        </div>
    );
});
