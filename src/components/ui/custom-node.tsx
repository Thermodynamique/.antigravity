"use client";

import React, { memo } from "react";
import { useNodeId } from "@xyflow/react";
import { Compass, FlaskConical, CheckCircle2, Zap, BookMarked } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { RootNode } from "./root-node";
import { DocumentNode } from "./document-node";
import { NoteNode } from "./note-node";
import { BranchNode } from "./branch-node";
import { Handle, Position } from "@xyflow/react";
import { FileIcon, Trash2, Link as LinkIcon, Table as TableIcon, Video } from "lucide-react";
import dynamic from 'next/dynamic';

// Import dynamique de CodeEditorNode pour s'assurer qu'il est rendu côté client
const CodeEditorNode = dynamic(() => import("./code-editor-node").then(mod => mod.CodeEditorNode), { ssr: false });


interface CustomNodeProps {
    data: {
        label: string;
        messages?: { role: string; content: string }[];
        isActive?: boolean;
        isDocument?: boolean;
        documentData?: any;
        emoji?: string;
        category?: string;
        youtubeId?: string;
        url?: string;
        imageUrl?: string;
    };
    selected?: boolean;
}

export const CustomNode = memo(({ data, selected }: CustomNodeProps) => {
    const id = useNodeId();
    const { updateNodeData, setNodes, setEdges, setActiveDocumentId } = useCanvas();

    const lastMessage = data.messages && data.messages.length > 0
        ? data.messages[data.messages.length - 1].content
        : "Cliquez pour commencer la réflexion...";

    const category = data.category || 'exploration';

    let CatIcon = Compass;
    let catColor = "text-neutral-400";
    let catBorder = "border-neutral-800";
    let catBg = "bg-neutral-900/50";
    let catLabel = "Exploration";

    if (category === 'hypothesis') {
        CatIcon = FlaskConical;
        catColor = "text-purple-400";
        catBorder = "border-purple-500/30";
        catBg = "bg-purple-900/10";
        catLabel = "Hypothèse";
    } else if (category === 'decision') {
        CatIcon = CheckCircle2;
        catColor = "text-green-400";
        catBorder = "border-green-500/30";
        catBg = "bg-green-900/10";
        catLabel = "Décision";
    } else if (category === 'action') {
        CatIcon = Zap;
        catColor = "text-orange-400";
        catBorder = "border-orange-500/30";
        catBg = "bg-orange-900/10";
        catLabel = "Action";
    } else if (category === 'note') {
        CatIcon = BookMarked;
        catColor = "text-yellow-500";
        catBorder = "border-yellow-500/40";
        catBg = "bg-yellow-900/20";
        catLabel = "Note";
    }

    const handleSummarize = () => {
        if (id) {
            updateNodeData(id, { isDocument: true, documentData: [] });
            setActiveDocumentId(id);
        }
    };

    if (id === "root") {
        return <RootNode id={id} data={data} selected={selected} />;
    }

    if (data.isDocument) {
        return <DocumentNode id={id} data={data} selected={selected} />;
    }

    // Vue Compacte (Pour les Notes)
    if (category === 'note') {
        return <NoteNode id={id} data={data} selected={selected} lastMessage={lastMessage} />;
    }

    if (category === 'code') {
        return <CodeEditorNode id={id} data={data} selected={selected} />;
    }

    // Vue Image (Plein ratio + Zoom cliquable avec lightbox inline)
    const imgSrc = data.imageUrl || data.url;
    const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
    if (category === 'image' && imgSrc) {
        return (
            <>
                <div className={`relative group flex flex-col min-w-[240px] max-w-[420px] bg-[#111111] border rounded-xl shadow-xl transition-all overflow-hidden ${selected ? 'ring-2 ring-purple-500/50 border-purple-500/50' : 'border-neutral-800'}`}>
                    <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100" />
                    <div className="flex items-center justify-between p-2 border-b border-white/10 shrink-0 bg-neutral-900/80 backdrop-blur-md">
                        <span className="text-xs font-semibold text-neutral-300 truncate px-1">{data.label || "Image"}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                            className="text-[10px] text-purple-400 hover:text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 transition-colors cursor-pointer border-none"
                        >
                            Agrandir 🔍
                        </button>
                    </div>
                    <div className="w-full max-h-[350px] overflow-hidden bg-black/40 flex items-center justify-center p-1">
                        <img
                            src={imgSrc}
                            alt={data.label || "Image canvas"}
                            className="w-full h-auto object-contain rounded-lg max-h-[340px] cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                        />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (id) {
                                setNodes(nds => nds.filter(n => n.id !== id));
                                setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id));
                            }
                        }}
                        className="absolute -top-2 -right-2 p-1.5 bg-neutral-800 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100" />
                </div>
                {/* Lightbox Overlay */}
                {isLightboxOpen && (
                    <div
                        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
                        onClick={() => setIsLightboxOpen(false)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setIsLightboxOpen(false); }}
                        tabIndex={0}
                        role="dialog"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <img
                            src={imgSrc}
                            alt={data.label || "Image"}
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'default' }}
                        />
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </>
        );
    }

    // Vue YouTube
    if (category === 'youtube' && data.youtubeId) {
        return (
            <div className={`relative group flex flex-col w-[280px] bg-[#111111] border rounded-xl shadow-lg transition-all ${selected ? 'ring-2 ring-red-500/50 border-red-500/50' : 'border-neutral-800'}`}>
                <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100" />
                <div className="flex items-center gap-2 p-2 border-b border-white/10">
                    <Video className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-neutral-300">Vidéo YouTube</span>
                </div>
                <div className="w-full aspect-video rounded-b-xl overflow-hidden bg-black">
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${data.youtubeId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setNodes(nds => nds.filter(n => n.id !== id)); setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id)); }}
                    className="absolute -top-2 -right-2 p-1.5 bg-neutral-800 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100" />
            </div>
        );
    }

    // Vue Link Web
    if (category === 'link') {
        return (
            <div className={`relative group flex items-center gap-3 p-3 min-w-[200px] bg-[#111111] border rounded-xl shadow-lg transition-all ${selected ? 'ring-2 ring-blue-500/50 border-blue-500/50' : 'border-neutral-800'}`}>
                <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100" />
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <LinkIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col overflow-hidden max-w-[200px]">
                    <span className="text-sm font-bold text-neutral-200 truncate">Lien Web</span>
                    <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate">
                        {data.url}
                    </a>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setNodes(nds => nds.filter(n => n.id !== id)); setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id)); }}
                    className="absolute -top-2 -right-2 p-1.5 bg-neutral-800 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100" />
            </div>
        );
    }

    // Vue PDF
    if (category === 'pdf' && data.url) {
        return (
            <div className={`relative group flex flex-col w-[400px] h-[550px] bg-[#111111] border rounded-xl shadow-lg transition-all overflow-hidden ${selected ? 'ring-2 ring-red-500/50 border-red-500/50' : 'border-neutral-800'}`}>
                <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100" />
                <div className="flex items-center gap-2 p-2 border-b border-white/10 shrink-0 bg-neutral-900">
                    <FileIcon className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold text-neutral-300 truncate">{data.label}</span>
                </div>
                <div className="flex-1 w-full bg-white relative">
                    <embed src={`${data.url}#toolbar=0&navpanes=0&scrollbar=0`} type="application/pdf" className="w-full h-full" />
                    {/* Un overlay transparent pour pouvoir drag the node without the iframe eating the click */}
                    {/* Removed: This overlay prevents interaction with the PDF viewer. */}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setNodes(nds => nds.filter(n => n.id !== id)); setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id)); }}
                    className="absolute -top-2 -right-2 p-1.5 bg-neutral-800 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100" />
            </div>
        );
    }

    // Vue Excel (Placeholder Tableau)
    if (category === 'excel') {
        return (
            <div className={`relative group flex flex-col w-[350px] bg-[#111111] border rounded-xl shadow-lg transition-all overflow-hidden ${selected ? 'ring-2 ring-green-500/50 border-green-500/50' : 'border-neutral-800'}`}>
                <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100" />
                <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-neutral-900">
                    <TableIcon className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-semibold text-neutral-300 truncate">{data.label}</span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center gap-3 bg-neutral-900/50">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                        <TableIcon className="w-6 h-6" />
                    </div>
                    <span className="text-sm text-neutral-400">Fichier Excel prêt pour l'analyse.</span>
                    <span className="text-xs text-neutral-600">(L'intégration SheetJS se fait au niveau du code de parsing)</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setNodes(nds => nds.filter(n => n.id !== id)); setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id)); }}
                    className="absolute -top-2 -right-2 p-1.5 bg-neutral-800 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100" />
            </div>
        );
    }

    // Vue Fichier Générique (Word / Fichiers)
    if (category === 'file' || category === 'word') {
        const isWord = category === 'word' || data.label?.toLowerCase().endsWith('.docx') || data.label?.toLowerCase().endsWith('.doc');
        return (
            <div className={`relative group flex items-center gap-3.5 p-3.5 min-w-[220px] bg-[#121214] border rounded-2xl shadow-xl transition-all hover:border-neutral-700 ${selected ? 'ring-2 ring-blue-500/50 border-blue-500/60' : 'border-neutral-800/80'}`}>
                <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isWord ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-neutral-800/80 border-neutral-700/50 text-neutral-300'}`}>
                    <FileIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col overflow-hidden pr-2">
                    <span className="text-xs font-semibold text-neutral-100 truncate tracking-tight">{data.label}</span>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">{isWord ? 'Document Word' : 'Fichier'}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (id) {
                            setNodes(nds => nds.filter(n => n.id !== id));
                            setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id));
                        }
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-neutral-800 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10 border border-neutral-700"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
                <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        );
    }

    // Vue standard (Branche conversationnelle) avec Hover Preview
    return (
        <BranchNode
            id={id || "node_fallback"}
            data={data}
            selected={selected}
            category={category}
            catColor={catColor}
            catBorder={catBorder}
            catBg={catBg}
            CatIcon={CatIcon}
            lastMessage={lastMessage}
            handleSummarize={handleSummarize}
        />
    );
});

CustomNode.displayName = "CustomNode";
