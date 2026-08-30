"use client";

import { useEffect, useRef, useCallback, useState, Fragment } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    FileUp,
    LayoutTemplate,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    GitBranch,
    Search,
    BookMarked,
    X,
    Sparkles,
    Compass,
    FlaskConical,
    CheckCircle2,
    Zap,
    Copy,
    PanelLeft,
    Settings,
    User,
    FileText,
    Loader2,
    Hand,
    Network,
    Combine,
    MoveUpRight,
    Box,
    Code2,
    FolderOpen,
    ArrowLeft,
    Pin,
    Eye,
    FileStack,
    ArrowUp,
    Layers,
    ChevronDown
} from "lucide-react";

import { useCanvas } from "@/contexts/CanvasContext";
import { useRigorousResearch } from "@/contexts/RigorousResearchContext";
import { SelectionPopover } from "@/components/ui/selection-popover";
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { useAutomator } from "@/hooks/useAutomator";
import { SpatialWindow, type SpatialWindowData } from "./spatial-window";
import { useWorkspaceManager } from "@/contexts/WorkspaceManagerContext";
import { SpatialCanvas } from "./canvas"; // Import SpatialCanvas
const DocumentEditor = dynamic(() => import("./document-editor").then(m => m.DocumentEditor), { ssr: false });
// Sidebar is rendered from page.tsx — not needed here
import { DynamicPreviewBlock } from "./dynamic-preview-block";
import { captureVisualState } from "@/lib/state-mapper";
import { Fragment as CanonicalFragment, FocusSlotState, BranchResponse, InformationItem } from "@/lib/information-primitives";
import { CentralComparisonTable, ComparisonItem } from "./central-comparison-table";
import { HistoryRail, TurnRecord } from "./history-rail";

const InlineDocWrapper = ({ documentId, onRemove }: { documentId: string, onRemove: () => void }) => {
    const { nodes, updateNodeData } = useCanvas();
    const docNode = nodes.find(n => n.id === documentId);
    if (!docNode) return <div className="text-red-500 text-xs">Document introuvable.</div>;

    return (
        <div className="mt-2 mb-2 w-full flex flex-col relative group/inlinedoc animate-in fade-in duration-300 bg-[#0a0a0a] rounded-xl border border-[#333] shadow-lg p-2">
            <button
                onClick={onRemove}
                className="absolute top-2 right-2 z-10 text-[10px] text-neutral-300 hover:text-white px-2 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors border border-neutral-700"
                title="Fermer ce document dans le chat"
            >
                <FileText className="w-3.5 h-3.5 inline-block mr-1" />
                Fermer
            </button>
            <div className="p-0 min-h-[100px] max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <DocumentEditor
                    nodeId={documentId}
                    initialTitle={docNode.data.label as string}
                    initialData={(docNode.data.documentData as any[]) || []}
                    onClose={() => { }}
                    onSave={(title, content) => {
                        updateNodeData(documentId, { label: title, documentData: content });
                    }}
                    mode="inline"
                />
            </div>
        </div>
    );
};

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );
            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

// Side panel pinned card (legacy — replaced by SpatialWindow)

export function VercelV0Chat({ isCanvasOpen = false, onChatStart, onToggleCanvas, onMinimize }: { isCanvasOpen?: boolean, onChatStart?: () => void, onToggleCanvas?: () => void, onMinimize?: () => void }) {
    const { isRigorousModeEnabled, toggleRigorousMode } = useRigorousResearch();
    const [value, setValue] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [selection, setSelection] = useState<{ text: string, x: number, y: number, rect?: DOMRect } | null>(null);
    const [aiProvider, setAiProvider] = useState<"groq" | "nvidia">("groq");
    const [isSendingAI, setIsSendingAI] = useState(false);
    const [isVceEnabled, setIsVceEnabled] = useState(false);

    // --- SPATIAL WINDOWS ---
    const [spatialWindows, setSpatialWindows] = useState<SpatialWindowData[]>([]);
    const [selectedWindowIds, setSelectedWindowIds] = useState<string[]>([]);
    const [topZId, setTopZId] = useState<string | null>(null);
    const [isMerging, setIsMerging] = useState(false);
    const windowCounterRef = useRef(0);

    // --- CANONICAL FRAGMENTS & FOCUS SLOT (V2 ARCHITECTURE) ---
    const [fragments, setFragments] = useState<CanonicalFragment[]>([]);
    const [focusSlots, setFocusSlots] = useState<Record<string, FocusSlotState>>({});
    const [isComparisonOpen, setIsComparisonOpen] = useState(false);

    // --- DOCUMENT BUILDER ---
    const [isDocBuilderOpen, setIsDocBuilderOpen] = useState(false);
    const [isBuildingDoc, setIsBuildingDoc] = useState(false);

    // --- ANIMATION STATES ---
    const [branchPhase, setBranchPhase] = useState<'idle' | 'split' | 'focus' | 'handoff' | 'reveal'>('idle');
    const [branchingData, setBranchingData] = useState<{ text: string, category: string, rect: DOMRect | null, message: any } | null>(null);
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 52, // Keep minHeight
        maxHeight: 200,
    });

    // --- AUTOMATOR ---
    const { isLoading: isAutomating, automatorStatus, checkStatus, runTask } = useAutomator();
    // Vérifie le statut de l'automator au montage
    useEffect(() => { checkStatus(); }, [checkStatus]);



    const {
        activeNodeId, setActiveNodeId, updateNodeData, nodes, edges, addNode, connectNodes,
        projects, activeProjectId, switchProject, createProject, activeDocumentId, setActiveDocumentId // Add activeDocumentId
    } = useCanvas();
    const { currentView, generateTaskView } = useWorkspaceManager();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const branchCountsRef = useRef<Record<string, number>>({});
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [isTransformMenuOpen, setIsTransformMenuOpen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activePreview, setActivePreview] = useState<{ id: string, title: string, type: '3d-model' | 'physics-sim' | 'molecule' | 'neural-graph', status: 'ready' | 'loading' | 'rendering', data?: any } | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    const handleNavigate = useCallback((targetId: string) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setActiveNodeId(targetId);
            setIsTransitioning(false);
        }, 300);
    }, [setActiveNodeId]);

    const handleSpatialNavigate = useCallback((targetId: string, title: string) => {
        if (targetId === activeNodeId) return;

        // 1. Setup Ghost Overlay
        setBranchingData({ text: title || "Discussion", category: "Navigation Spatiale", rect: null, message: null });

        // 2. Début de la séparation
        setBranchPhase('split');
        setSelection(null);
        setIsTransformMenuOpen(false);

        // 3. Focus sur la branche entrante
        setTimeout(() => {
            setBranchPhase('focus');

            // 4. Handoff invisible
            setTimeout(() => {
                setBranchPhase('handoff');
                setActiveNodeId(targetId);

                // 5. Reveal (Fondu)
                setTimeout(() => {
                    setBranchPhase('reveal');

                    // 6. Fin
                    setTimeout(() => {
                        setBranchPhase('idle');
                        setBranchingData(null);
                    }, 500);
                }, 100);
            }, 1200);
        }, 1000);
    }, [activeNodeId, setActiveNodeId]);

    const activeNode = nodes.find(n => n.id === activeNodeId);
    const messages = (activeNode?.data?.messages as any[]) || [];

    const handleSimulate = useCallback(() => {
        // Toggle la simulation: si visible on la ferme complètement, sinon on la crée
        if (isPreviewVisible) {
            setIsPreviewVisible(false);
            setActivePreview(null);
        } else {
            setActivePreview({
                id: `preview_${Date.now()}`,
                title: "Architecture Moteur Fusée Hybride",
                type: "3d-model",
                status: "ready",
                data: { thrust: "1500 kN", isp: "350s", oxidizer: "LOX", fuel: "HTPB" }
            });
            setIsPreviewVisible(true);
        }
    }, [isPreviewVisible]);

    // Keyboard shortcut: Escape dismisses preview
    useEffect(() => {
        const handlePreviewEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isPreviewVisible) {
                e.stopPropagation();
                setIsPreviewVisible(false);
                setActivePreview(null);
            }
        };
        window.addEventListener('keydown', handlePreviewEsc, true);
        return () => window.removeEventListener('keydown', handlePreviewEsc, true);
    }, [isPreviewVisible]);

    // --- NEW: Breadcrumbs & ESC to go back ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                const incomingEdge = edges.find(ed => ed.target === activeNodeId);
                if (incomingEdge) {
                    handleNavigate(incomingEdge.source);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeNodeId, edges, setActiveNodeId]);

    const getBreadcrumbs = () => {
        let currentId: string | null = activeNodeId;
        const path: any[] = [];
        while (currentId) {
            const node = nodes.find(n => n.id === currentId);
            if (!node) break;
            path.unshift(node);
            const incomingEdge = edges.find(e => e.target === currentId);
            currentId = incomingEdge ? incomingEdge.source : null;
            if (path.length > 20) break; // Infinite loop protection
        }
        return path;
    };
    const breadcrumbs = getBreadcrumbs();
    // -----------------------------------------

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const handleGlobalClick = () => {
            const sel = window.getSelection();
            // Don't hide selection menu if we're clicking inside the transform menu or editing
            if (!sel || sel.toString().trim().length === 0) {
                if (!isTransformMenuOpen) {
                    setSelection(null);
                }
            }
        };
        document.addEventListener("selectionchange", handleGlobalClick);
        return () => document.removeEventListener("selectionchange", handleGlobalClick);
    }, [isTransformMenuOpen]);

    const handleSelection = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.bn-container') || target.closest('.ProseMirror') || target.closest('.group\\/inlinedoc')) {
            return;
        }

        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelection({
                text: sel.toString().trim(),
                x: rect.left + rect.width / 2,
                y: rect.top - 10,
                rect: rect
            });
        } else {
            setSelection(null);
            setIsTransformMenuOpen(false);
        }
    }, []);

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!value.trim() || !activeNodeId || isSendingAI) return;

        const userMsg = { role: "user", content: value };
        const isAutoTask = value.trim().toLowerCase().startsWith("/auto ");
        const isGenTask = value.trim().toLowerCase().startsWith("/task ");
        const taskText = isAutoTask ? value.trim().slice(6) : (isGenTask ? value.trim().slice(6) : value);

        // Snapshot de l'historique pour construire le contexte
        const historyForAPI = messages
            .filter((m: any) => m.role === "user" || m.role === "assistant")
            .filter((m: any) => !m.content.includes("L'agent Automator") && !m.content.includes("⚡"))
            .map((m: any) => ({ role: m.role, content: m.content }));

        // Afficher immédiatement le message utilisateur + un loader
        const loadingMsg = { role: "assistant", content: "_⏳ En train de réfléchir..._", isLoading: true };
        updateNodeData(activeNodeId, {
            messages: [...messages, userMsg, loadingMsg],
            label: messages.length === 0 ? value.slice(0, 25) + "..." : activeNode?.data.label
        });
        setValue("");
        adjustHeight(true);
        if (onChatStart) onChatStart();

        if (isAutoTask) {
            // --- Délégation à l'agent Python Automator ---
            setIsAutomating(true);
            const result = await runTask(taskText);
            setIsAutomating(false);
            const finalContent = result?.status === "success"
                ? `✅ **Tâche accomplie !**\n\n${result.result}`
                : `❌ **Erreur Automator :** ${result?.result ?? "Réponse vide."}`;
            updateNodeData(activeNodeId, { messages: [...messages, userMsg, { role: "assistant", content: finalContent }] });
        } else if (isGenTask) {
            // --- Génération de la Vue Tâche Automatique ---
            generateTaskView(taskText);
            updateNodeData(activeNodeId, { messages: [...messages, userMsg, { role: "assistant", content: `Génération de la Vue Tâche pour : "${taskText}"...` }] });
            setValue("");
            adjustHeight(true);
        } else {
            // --- Appel en STREAMING à l'API IA ---
            setIsSendingAI(true);
            const currentNodeId = activeNodeId;
            const baseMessages = [...messages, userMsg];
            try {
                let visualState = null;
                if (isVceEnabled) {
                    visualState = await captureVisualState();
                }

                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: [...historyForAPI, { role: "user", content: value }],
                        provider: aiProvider,
                        visualState: visualState
                    }),
                });

                if (!res.ok || !res.body) {
                    const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
                    updateNodeData(currentNodeId, {
                        messages: [...baseMessages, { role: "assistant", content: `❌ Erreur : ${err.error}` }]
                    });
                    return;
                }

                // Lecture du flux SSE token par token
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let streamedContent = "";
                let buffer = "";

                // Placer un message vide en attente de streaming
                updateNodeData(currentNodeId, {
                    messages: [...baseMessages, { role: "assistant", content: "▋", isStreaming: true }]
                });

                while (true) {
                    const { done, value: chunk } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(chunk, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() ?? "";

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed === "data: [DONE]") break;
                        if (!trimmed.startsWith("data: ")) continue;

                        try {
                            const parsed = JSON.parse(trimmed.slice(6));
                            if (parsed.content) {
                                streamedContent += parsed.content;
                                // Mise à jour réactive du message (curseur clignotant ▋ à la fin)
                                updateNodeData(currentNodeId, {
                                    messages: [...baseMessages, { role: "assistant", content: streamedContent + "▋", isStreaming: true }]
                                });
                            }
                        } catch { /* ligne SSE malformée */ }
                    }
                }

                // Finaliser sans curseur — incrémenter l'âge de rétention
                // En Mode Recherche Rigoureuse (isRigorousModeEnabled), plafonner la dégradation au Niveau 1 (retentionAge max 2)
                const maxAllowedAge = isRigorousModeEnabled ? 2 : 10;
                const agedMessages = baseMessages.map((m: any) => {
                    if (m.role === 'assistant' && !m.retained && !m.ejected && !m.isStreaming) {
                        const nextAge = (m.retentionAge || 0) + 1;
                        return { ...m, retentionAge: Math.min(nextAge, maxAllowedAge) };
                    }
                    return m;
                });
                updateNodeData(currentNodeId, {
                    messages: [...agedMessages, { role: "assistant", content: streamedContent, retentionAge: 0 }]
                });

                // --- LIVE DOCUMENT STREAMING (A8 Phase 3-4 Style Notion AI) ---
                if (activeDocumentId && nodes) {
                    const docNode = nodes.find(n => n.id === activeDocumentId || n.data.isDocument);
                    if (docNode) {
                        const hasOutline = (docNode.data.documentData as any[])?.some(b => b.type === 'heading');
                        const initialOutline = !hasOutline ? [
                            { type: 'heading', props: { level: 1 }, content: [{ type: 'text', text: '1. Introduction & Contexte', styles: {} }] },
                            { type: 'heading', props: { level: 1 }, content: [{ type: 'text', text: '2. Problématique & État de l\'art', styles: {} }] },
                            { type: 'heading', props: { level: 1 }, content: [{ type: 'text', text: '3. Analyse & Discussion', styles: {} }] },
                        ] : [];

                        updateNodeData(docNode.id, {
                            documentData: [
                                ...(docNode.data.documentData || []),
                                ...initialOutline,
                                { type: 'paragraph', content: [{ type: 'text', text: `\n\n### Contribution Live (${new Date().toLocaleTimeString()})\n${streamedContent}`, styles: {} }] }
                            ]
                        });
                    }
                }

                if (isVceEnabled) setIsVceEnabled(false);
            } catch {
                updateNodeData(currentNodeId, {
                    messages: [...baseMessages, { role: "assistant", content: "❌ Impossible de contacter l'API. Vérifiez votre connexion." }]
                });
            } finally {
                setIsSendingAI(false);
            }

        }
    }, [value, activeNodeId, messages, updateNodeData, adjustHeight, activeNode, onChatStart, runTask, aiProvider, isSendingAI, isVceEnabled]);

    const finalizeBranchOut = useCallback((message: any, category: string) => {
        if (!activeNode) return;

        const isDocument = ['document', 'fiche', 'synthese'].includes(category);
        const newNodeId = `node_${Date.now()}`;

        // Algorithme de placement : éviter les superpositions en trouvant le Y max à cette colonne
        const targetX = activeNode.position.x + 450;
        const nodesAtSameLevel = nodes.filter(n => Math.abs(n.position.x - targetX) < 100);
        let targetY = activeNode.position.y;
        if (nodesAtSameLevel.length > 0) {
            const maxY = Math.max(...nodesAtSameLevel.map(n => n.position.y));
            targetY = maxY + 250; // Espacement vertical
        }

        const newNode = {
            id: newNodeId,
            position: { x: targetX, y: targetY },
            data: {
                label: isDocument ? "Nouveau Document" : `${category.charAt(0).toUpperCase() + category.slice(1)} : ${message.content.substring(0, 15)}...`,
                messages: isDocument ? [] : [
                    message,
                    { role: "assistant", content: `(Réponse IA simulée)\n\nJ'ai bien noté cette idée : "${message.content}". Comment souhaitez-vous qu'on l'explore ?` }
                ],
                category: category,
                isDocument: isDocument,
                documentData: isDocument ? [
                    { type: "paragraph", content: [{ type: "text", text: message.content, styles: {} }] }
                ] : undefined
            },
            type: "custom",
        };

        addNode(newNode as any);
        connectNodes({ id: `e-${activeNodeId}-${newNodeId}`, source: activeNodeId, target: newNodeId });

        if (isDocument) {
            // Modifier le message actuel pour le lier au nœud document créé (Inline mode)
            const newMessages = activeNode.data.messages.map((m: any) => {
                if (m === message) {
                    return { ...m, documentId: newNodeId, hiddenDocumentId: undefined };
                }
                return m;
            });
            updateNodeData(activeNodeId, { messages: newMessages });

            setSelection(null);
            setIsTransformMenuOpen(false);
            return;
        }

        const sysMsg = { role: "system", content: `Objet créé : ${category} (visible sur le Canvas).` };
        updateNodeData(activeNodeId, {
            messages: [...(activeNode.data.messages || []), sysMsg]
        });
        // On switch automatiquement le chat SAUF pour les notes rapides
        if (category !== 'note' && category !== 'decision' && category !== 'hypothesis') {
            setActiveNodeId(newNodeId); // Changement immédiat
            if (onChatStart) onChatStart();
        }

        setSelection(null);
        setIsTransformMenuOpen(false);
        setBranchPhase('idle');
    }, [activeNode, activeNodeId, addNode, connectNodes, updateNodeData, handleNavigate, setActiveNodeId, onChatStart, nodes]);

    const handleBranchOut = useCallback((message: any, category: string = 'exploration') => {
        if (!activeNode) return;

        // Pas d'animation de séparation spatiale pour les documents et les notes rapides
        const skipAnimation = ['document', 'fiche', 'synthese', 'note', 'action', 'decision', 'hypothesis'].includes(category);
        if (skipAnimation) {
            finalizeBranchOut(message, category);
            return;
        }

        const newNodeId = `node_${Date.now()}`;
        const targetX = activeNode.position.x + 450;
        const nodesAtSameLevel = nodes.filter(n => Math.abs(n.position.x - targetX) < 100);
        let targetY = activeNode.position.y;
        if (nodesAtSameLevel.length > 0) {
            const maxY = Math.max(...nodesAtSameLevel.map(n => n.position.y));
            targetY = maxY + 250;
        }

        const newNode = {
            id: newNodeId,
            position: { x: targetX, y: targetY },
            data: {
                label: `${category.charAt(0).toUpperCase() + category.slice(1)} : ${message.content.substring(0, 15)}...`,
                messages: [
                    message,
                    { role: "assistant", content: `(Réponse IA simulée)\n\nJ'ai bien noté cette idée : "${message.content}". Comment souhaitez-vous qu'on l'explore ?` }
                ],
                category: category,
                isDocument: false,
                // Initialisation explicite pour les nœuds de code
                ...(category === 'code' && { codeContent: "// Écrivez votre code ici...\n", language: "typescript" })
            },
            type: "custom",
        };

        addNode(newNode as any);
        connectNodes({ id: `e-${activeNodeId}-${newNodeId}`, source: activeNodeId, target: newNodeId });

        updateNodeData(activeNodeId, {
            messages: [...(activeNode.data.messages || []), { role: "system", content: `Objet créé : ${category} (visible sur le Canvas).` }]
        });

        // 1. Setup Ghost Overlay (it represents the NEW branch flying in)
        setBranchingData({ text: message.content.substring(0, 50), category, rect: null, message });

        // 2. Début de la phase B (Séparation en V - L'ancienne branche recule)
        setBranchPhase('split');
        setSelection(null);
        setIsTransformMenuOpen(false);

        // 3. Phase C (Focus sur la nouvelle branche qui arrive au centre)
        setTimeout(() => {
            setBranchPhase('focus');

            // 4. Phase D (Handoff - On coupe les transitions et on swap le DOM invisiblement)
            setTimeout(() => {
                setBranchPhase('handoff');
                setActiveNodeId(newNodeId); // Le DOM change MAINTENANT, invisiblement
                if (onChatStart) onChatStart();

                // 5. Phase E (Reveal - Fondu enchaîné sur place)
                setTimeout(() => {
                    setBranchPhase('reveal');

                    // 6. Fin propre
                    setTimeout(() => {
                        setBranchPhase('idle');
                        setBranchingData(null);
                    }, 500);
                }, 100); // Laisse React render le nouveau noeud
            }, 1200);
        }, 1000);
    }, [activeNode, activeNodeId, addNode, connectNodes, updateNodeData, setActiveNodeId, onChatStart, nodes]);

    const handleSaveEdit = (index: number) => {
        if (!activeNodeId || !activeNode) return;
        const newMessages = [...messages];
        newMessages[index] = { ...newMessages[index], content: editValue };
        updateNodeData(activeNodeId, { messages: newMessages });
        setEditingIndex(null);
    };

    const handleSplitToCanvas = useCallback((content: string) => {
        if (!activeNode) return;

        let items: string[] = [];
        if (content.includes('- ') || content.includes('* ') || content.match(/\d+\.\s/)) {
            items = content.split(/(?:\n- |\n\* |\n\d+\.\s)/).filter(Boolean);
            if (items.length > 0 && !items[0].startsWith('- ') && !items[0].match(/^\d+\./)) {
                items.shift();
            }
        } else {
            items = content.split('\n\n').filter(Boolean);
        }

        if (items.length === 0) return;

        items.forEach((item, index) => {
            const angle = (index / items.length) * Math.PI * 2;
            const radius = 350 + Math.random() * 50;
            const x = activeNode.position.x + Math.cos(angle) * radius;
            const y = activeNode.position.y + Math.sin(angle) * radius;

            const newNodeId = `node_${Date.now()}_${index}`;
            addNode({
                id: newNodeId,
                position: { x, y },
                data: {
                    label: item.substring(0, 30).replace(/[*#]/g, '').trim() + "...",
                    messages: [{ role: "assistant", content: item }],
                    category: 'note',
                    isDocument: false
                },
                type: 'custom'
            } as any);
            if (activeNodeId) {
                connectNodes({ id: `e-${activeNodeId}-${newNodeId}`, source: activeNodeId, target: newNodeId });
            }
        });

        updateNodeData(activeNodeId, {
            messages: [...(activeNode.data.messages || []), { role: "system", content: `Texte éclaté en ${items.length} nœuds sur le Canvas.` }]
        });
    }, [activeNode, activeNodeId, addNode, connectNodes, updateNodeData]);

    // ──────────────────────────────────────────────
    //  SPATIAL WINDOWS HANDLERS
    // ──────────────────────────────────────────────

    /** Compute spatial window offset for new window placement */
    const getNextWindowOffset = useCallback(() => {
        windowCounterRef.current += 1;
        const count = windowCounterRef.current;
        const side = count % 2 === 0 ? 1 : -1;
        let baseOffset = 450;
        if (typeof window !== 'undefined') {
            const maxSafeOffset = (window.innerWidth / 2) - 150;
            baseOffset = Math.min(baseOffset, Math.max(100, maxSafeOffset));
        }
        const layer = Math.floor((count - 1) / 2);
        return side * (baseOffset + layer * 50);
    }, []);

    /** Eject a FULL message to a spatial window */
    const ejectToSpace = useCallback((content: string, msgIndex: number) => {
        if (!activeNodeId || !activeNode) return;
        const xOffset = getNextWindowOffset();
        const newWin: SpatialWindowData = {
            id: `sw_${Date.now()}`,
            content,
            label: content.substring(0, 40).replace(/[*#\n]/g, '').trim() + "\u2026",
            x: xOffset,
        };
        setSpatialWindows(prev => [...prev, newWin]);
        setTopZId(newWin.id);
        const newMessages = (activeNode.data.messages as any[]).map((m: any, mi: number) =>
            mi === msgIndex ? { ...m, ejected: true } : m
        );
        updateNodeData(activeNodeId, { messages: newMessages });
    }, [activeNode, activeNodeId, updateNodeData, getNextWindowOffset]);

    /** Eject SELECTED TEXT (partial) to a spatial window — core of the new interaction */
    const ejectSelectionToSpace = useCallback((selectedText: string) => {
        if (!selectedText.trim()) return;
        const xOffset = getNextWindowOffset();
        const newWin: SpatialWindowData = {
            id: `sw_sel_${Date.now()}`,
            content: selectedText,
            label: `✂️ ${selectedText.substring(0, 35).replace(/[*#\n]/g, '').trim()}…`,
            x: xOffset,
        };
        setSpatialWindows(prev => [...prev, newWin]);
        setTopZId(newWin.id);
        // Clear browser selection
        window.getSelection()?.removeAllRanges();
        setSelection(null);
        setIsTransformMenuOpen(false);
    }, [getNextWindowOffset]);

    /** Pin/retain a message so it never fades */
    const retainMessage = useCallback((msgIndex: number) => {
        if (!activeNodeId || !activeNode) return;
        const newMessages = (activeNode.data.messages as any[]).map((m: any, mi: number) =>
            mi === msgIndex ? { ...m, retained: true, retentionAge: 0 } : m
        );
        updateNodeData(activeNodeId, { messages: newMessages });
    }, [activeNode, activeNodeId, updateNodeData]);

    /** Raccourci Clavier Ctrl + Shift + R pour la Rétention Éplicite */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'R') {
                e.preventDefault();
                // Si un message assistant est présent, marquer le dernier message assistant comme retenu
                if (messages.length > 0) {
                    const lastAssistantIdx = messages.findLastIndex((m: any) => m.role === 'assistant');
                    if (lastAssistantIdx !== -1) {
                        retainMessage(lastAssistantIdx);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [messages, retainMessage]);

    /** Temporarily reveal a forgotten message */
    const [temporarilyRevealedIdx, setTemporarilyRevealedIdx] = useState<number | null>(null);

    /** Compute retention stats for the history separator */
    const retentionStats = (() => {
        const assistantMsgs = messages.filter((m: any) => m.role === 'assistant' && !m.isStreaming);
        const retained = assistantMsgs.filter((m: any) => m.retained || m.retentionAge === 0 || (m.retentionAge || 0) < 2).length;
        const fading = assistantMsgs.filter((m: any) => !m.retained && (m.retentionAge || 0) >= 2 && (m.retentionAge || 0) < 4).length;
        const forgotten = assistantMsgs.filter((m: any) => !m.retained && (m.retentionAge || 0) >= 4).length;
        return { retained, fading, forgotten, total: assistantMsgs.length };
    })();

    /** Count retainable fragments (spatial windows + retained messages) for document builder */
    const retainedFragmentCount = spatialWindows.length + messages.filter((m: any) => m.retained).length;

    const closeSpatialWindow = useCallback((id: string) => {
        // Find the window to know which message to un-eject
        setSpatialWindows(prev => {
            const closing = prev.find(w => w.id === id);
            if (closing && activeNode && activeNodeId) {
                const newMessages = (activeNode.data.messages as any[]).map((m: any) =>
                    m.ejected && m.content === closing.content ? { ...m, ejected: false } : m
                );
                updateNodeData(activeNodeId, { messages: newMessages });
            }
            return prev.filter(w => w.id !== id);
        });
        setSelectedWindowIds(prev => prev.filter(sid => sid !== id));
    }, [activeNode, activeNodeId, updateNodeData]);

    const bringToFront = useCallback((id: string) => {
        setTopZId(id);
    }, []);

    const moveWindow = useCallback((id: string, x: number) => {
        setSpatialWindows(prev => prev.map(w => w.id === id ? { ...w, x } : w));
    }, []);

    const returnToChat = useCallback((winId: string) => {
        // Find the window content
        const win = spatialWindows.find(w => w.id === winId);
        if (!win || !activeNodeId || !activeNode) return;
        // Un-eject the message: find it by content and restore
        const newMessages = (activeNode.data.messages as any[]).map((m: any) =>
            m.ejected && m.content === win.content ? { ...m, ejected: false } : m
        );
        updateNodeData(activeNodeId, { messages: newMessages });
        // Close the window
        setSpatialWindows(prev => prev.filter(w => w.id !== winId));
        setSelectedWindowIds(prev => prev.filter(sid => sid !== winId));
    }, [spatialWindows, activeNode, activeNodeId, updateNodeData]);

    const toggleWindowSelection = useCallback((id: string) => {
        setSelectedWindowIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    }, []);

    const mergeWindows = useCallback(async () => {
        if (selectedWindowIds.length < 2) return;
        const toMerge = spatialWindows.filter(w => selectedWindowIds.includes(w.id));
        if (toMerge.length < 2) return;

        setIsMerging(true);
        const combined = toMerge.map((w, i) => `### Fenêtre ${i + 1}\n${w.content}`).join('\n\n---\n\n');
        const prompt = `Voici ${toMerge.length} réponses différentes sur un même sujet. Fusionne-les en une seule réponse cohérente et complète, sans répétitions. Garde le meilleur de chaque :\n\n${combined}`;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], provider: aiProvider }),
            });
            const data = await res.json();
            if (res.ok) {
                const mergedContent = data.content;
                const rotation = (Math.random() - 0.5) * 3;
                const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 - 190 : 600;
                const mergedWin: SpatialWindowData = {
                    id: `sw_merged_${Date.now()}`,
                    content: mergedContent,
                    label: `✦ Fusion (${toMerge.length} fenêtres)`,
                    x: centerX,
                    y: 100,
                    rotation,
                };
                // Remove merged windows, add new merged one
                setSpatialWindows(prev => [
                    ...prev.filter(w => !selectedWindowIds.includes(w.id)),
                    mergedWin
                ]);
                setSelectedWindowIds([]);
                setTopZId(mergedWin.id);
            }
        } catch (e) {
            console.error('Merge failed', e);
        } finally {
            setIsMerging(false);
        }
    }, [selectedWindowIds, spatialWindows, aiProvider]);

    return (
        <div className={cn(
            "flex flex-col items-center w-full mx-auto space-y-6 relative transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            isCanvasOpen ? "pointer-events-none max-w-2xl translate-y-4" : "pointer-events-auto bg-transparent min-h-screen h-full max-h-screen"
        )}>


            {/* Popover Menu de Sélection - Hiérarchique */}
            {selection && (
                <div
                    className="fixed z-50 flex flex-col items-stretch p-1 bg-[#1c1c1c]/95 backdrop-blur-xl border border-neutral-700/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 pointer-events-auto min-w-[200px]"
                    style={{
                        top: selection.y,
                        left: selection.x,
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-12px'
                    }}
                    onPointerDown={(e) => e.preventDefault()}
                >
                    {!isTransformMenuOpen ? (
                        <div className="flex items-center w-full">
                            {/* Action 1 : Explorer */}
                            <button
                                onClick={() => {
                                    const fakeMsg = { role: "user", content: selection.text };
                                    handleBranchOut(fakeMsg, 'exploration');
                                }}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 hover:bg-neutral-800 rounded-lg text-neutral-300 transition-colors"
                            >
                                <Compass className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Explorer</span>
                            </button>

                            <div className="w-px h-8 bg-neutral-700 mx-1" />

                            {/* Action 2 : Noter */}
                            <button
                                onClick={() => {
                                    const fakeMsg = { role: "user", content: selection.text };
                                    handleBranchOut(fakeMsg, 'note');
                                }}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 hover:bg-neutral-800 rounded-lg text-neutral-300 transition-colors"
                            >
                                <BookMarked className="w-4 h-4 text-yellow-500" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Noter</span>
                            </button>

                            <div className="w-px h-8 bg-neutral-700 mx-1" />

                            {/* Action : Glisser (Drag) */}
                            <div
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', selection.text);
                                    e.dataTransfer.effectAllowed = 'copy';
                                    setTimeout(() => setSelection(null), 100);
                                }}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 hover:bg-neutral-800 rounded-lg text-neutral-300 transition-colors cursor-grab active:cursor-grabbing"
                            >
                                <Hand className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Glisser</span>
                            </div>

                            <div className="w-px h-8 bg-neutral-700 mx-1" />

                            {/* Action : Éjecter en fenêtre spatiale (sélection partielle) */}
                            <button
                                onClick={() => ejectSelectionToSpace(selection.text)}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 hover:bg-blue-900/40 rounded-lg text-neutral-300 transition-colors"
                            >
                                <MoveUpRight className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Espace</span>
                            </button>

                            <div className="w-px h-8 bg-neutral-700 mx-1" />

                            {/* Action 3 : Transformer */}
                            <button
                                onClick={() => setIsTransformMenuOpen(true)}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 hover:bg-neutral-800 rounded-lg text-neutral-300 transition-colors"
                            >
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">Transformer <span className="text-[8px]">▼</span></span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col w-full py-1">
                            <div className="px-3 py-2 border-b border-neutral-800 mb-1 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Transformer en...</span>
                                <button onClick={() => setIsTransformMenuOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-3 h-3" /></button>
                            </div>
                            <button onClick={() => handleBranchOut({ role: "user", content: selection.text }, 'document')} className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 rounded-md text-sm text-neutral-300 text-left w-full transition-colors">
                                <LayoutTemplate className="w-4 h-4 text-neutral-400" /> 📄 Créer un document
                            </button>
                            <button onClick={() => handleBranchOut({ role: "user", content: selection.text }, 'action')} className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 rounded-md text-sm text-neutral-300 text-left w-full transition-colors">
                                <Zap className="w-4 h-4 text-orange-400" /> ⚡ Créer une action
                            </button>
                            <button onClick={() => handleBranchOut({ role: "user", content: selection.text }, 'decision')} className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 rounded-md text-sm text-neutral-300 text-left w-full transition-colors">
                                <CheckCircle2 className="w-4 h-4 text-green-400" /> 🎯 Marquer comme décision
                            </button>
                            <button onClick={() => handleBranchOut({ role: "user", content: selection.text }, 'hypothesis')} className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 rounded-md text-sm text-neutral-300 text-left w-full transition-colors">
                                <FlaskConical className="w-4 h-4 text-purple-400" /> 🧪 Marquer comme hypothèse
                            </button>
                            <button onClick={() => handleBranchOut({ role: "user", content: selection.text }, 'code')} className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 rounded-md text-sm text-neutral-300 text-left w-full transition-colors">
                                <Code2 className="w-4 h-4 text-blue-400" /> 💻 Éditeur de Code (Monaco)
                            </button>
                            <button onClick={() => handleBranchOut({ role: "user", content: selection.text }, 'fiche')} className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 rounded-md text-sm text-neutral-300 text-left w-full transition-colors">
                                <BookMarked className="w-4 h-4 text-blue-400" /> 📋 Créer une fiche / synthèse
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Area — Restauration du défilement normal & Bloc Central dynamique */}
            {messages.length > 0 && !isCanvasOpen ? (
                <div
                    ref={chatContainerRef}
                    onMouseUp={handleSelection}
                    onContextMenu={(e) => {
                        if (window.getSelection()?.toString().trim().length) {
                            e.preventDefault();
                        }
                    }}
                    className={cn(
                        "w-full max-w-[850px] overflow-y-auto px-4 md:px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-12 pb-44 max-h-[calc(100vh-140px)] scroll-smooth origin-center z-10 relative flex flex-col min-h-0",
                        (branchPhase === 'split' || branchPhase === 'focus' || isPreviewVisible) ? "bg-[#1c1c1e]/80 backdrop-blur-2xl rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/10 transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)]" :
                            branchPhase === 'reveal' ? "transition-opacity duration-500" : "bg-transparent transition-none duration-0",
                        isPreviewVisible ? "cursor-pointer hover:bg-[#252528]/80" : ""
                    )}
                    onClick={() => {
                        // Click on chat brings it back to focus (closes preview)
                        if (isPreviewVisible) setIsPreviewVisible(false);
                    }}
                    style={{
                        transform: branchPhase === 'split' ? 'perspective(1200px) translateX(-25vw) translateZ(-400px) rotateY(20deg) scale(0.85)' :
                            branchPhase === 'focus' ? 'perspective(1200px) translateX(-50vw) translateZ(-600px) rotateY(30deg) scale(0.7)' :
                                isPreviewVisible ? 'perspective(1200px) translateX(-30vw) translateZ(-200px) rotateY(15deg) scale(0.85)' :
                                    'perspective(1200px) translateX(0) translateZ(0) rotateY(0deg) scale(1)',
                        opacity: (branchPhase === 'focus' || branchPhase === 'handoff') ? 0 : 1,
                        filter: (branchPhase === 'split' || branchPhase === 'focus' || isPreviewVisible) ? 'blur(4px)' : 'blur(0px)',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <div className={cn("flex flex-col gap-6 md:gap-8 min-h-full transition-all duration-700", branchPhase !== 'idle' && "p-8 blur-[1px]")}>
                        {messages.map((msg: any, i: number) => {
                            if (msg.role === "system") {
                                return (
                                    <div key={i} className="flex justify-center my-6">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/40 rounded-full text-xs text-neutral-500">
                                            <GitBranch className="w-3 h-3" />
                                            <span>{msg.content}</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (msg.role === "user") {
                                return (
                                    <div key={i} className="flex justify-end w-full my-6 animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-[#1c1c1e] text-white px-5 py-3.5 rounded-3xl max-w-[85%] text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.2)] leading-relaxed font-sans border border-white/5">
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            }

                            // === EJECTED MESSAGE — shows a lightweight placeholder card ===
                            if (msg.role === "assistant" && msg.ejected) {
                                return (
                                    <div key={i} className="flex w-full px-2 py-3 animate-in fade-in duration-300">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] group/ejected">
                                                {/* Floating window icon */}
                                                <div className="w-5 h-5 rounded-md flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shrink-0">
                                                    <MoveUpRight className="w-3 h-3 text-blue-400/70" />
                                                </div>
                                                {/* Content preview */}
                                                <span className="flex-1 text-[12px] text-neutral-600 italic truncate">
                                                    {msg.content.substring(0, 60).replace(/[*#\n]/g, ' ')}…
                                                </span>
                                                {/* Return button */}
                                                <button
                                                    className="text-[10px] font-semibold text-neutral-600 hover:text-blue-400 transition-colors opacity-0 group-hover/ejected:opacity-100 shrink-0"
                                                    onClick={() => {
                                                        if (!activeNodeId || !activeNode) return;
                                                        const newMessages = (activeNode.data.messages as any[]).map((m: any, mi: number) =>
                                                            mi === i ? { ...m, ejected: false } : m
                                                        );
                                                        updateNodeData(activeNodeId, { messages: newMessages });
                                                        // Also close the spatial window
                                                        setSpatialWindows(prev => prev.filter(w => w.content !== msg.content));
                                                    }}
                                                    title="Ramener dans le chat"
                                                >
                                                    ↩ Ramener
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // === Determine retention state ===
                            const age = msg.retentionAge || 0;
                            const isRetained = msg.retained === true;
                            const isLastAssistant = (() => {
                                for (let j = messages.length - 1; j >= 0; j--) {
                                    if (messages[j].role === 'assistant' && !messages[j].isStreaming && !messages[j].ejected) return j === i;
                                }
                                return false;
                            })();
                            const isFading = !isRetained && !isLastAssistant && age >= 2 && age < 4;
                            const isForgotten = !isRetained && !isLastAssistant && age >= 4;
                            const isTemporarilyRevealed = temporarilyRevealedIdx === i;

                            // === FORGOTTEN MESSAGE — collapsed 1-line bar ===
                            if (isForgotten && !isTemporarilyRevealed) {
                                return (
                                    <div key={i} className="flex w-full px-2 py-1 animate-in fade-in duration-300">
                                        <button
                                            onClick={() => setTemporarilyRevealedIdx(i)}
                                            className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer group/forgotten"
                                        >
                                            <span className="text-neutral-700 text-[11px]">💤</span>
                                            <span className="flex-1 text-[11px] text-neutral-600 italic truncate font-sans">
                                                {msg.content.substring(0, 80).replace(/[*#\n]/g, ' ')}…
                                            </span>
                                            <span className="text-[10px] text-neutral-700 opacity-0 group-hover/forgotten:opacity-100 transition-opacity font-medium">
                                                Cliquer pour relire
                                            </span>
                                        </button>
                                    </div>
                                );
                            }

                            // === HISTORY SEPARATOR — shown before the last assistant message ===
                            const showSeparator = isLastAssistant && retentionStats.total > 1;

                            // Assistant Message
                            return (
                                <Fragment key={i}>
                                    {showSeparator && (
                                        <div className="flex items-center gap-3 my-4 px-4">
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/60 border border-neutral-800/50">
                                                <ArrowUp className="w-3 h-3 text-neutral-600" />
                                                <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
                                                    Historique
                                                    {retentionStats.retained > 0 && <span className="text-emerald-500/70 ml-1">{retentionStats.retained} retenus</span>}
                                                    {retentionStats.fading > 0 && <span className="text-yellow-600/60 ml-1">· {retentionStats.fading} estompés</span>}
                                                    {retentionStats.forgotten > 0 && <span className="text-neutral-700 ml-1">· {retentionStats.forgotten} oubliés</span>}
                                                </span>
                                            </div>
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "flex w-full gap-4 px-2 py-6 group rounded-3xl transition-all relative animate-in fade-in duration-500",
                                            isLastAssistant && "bg-white/[0.015] border border-white/[0.06] shadow-[0_0_30px_rgba(255,255,255,0.02)]",
                                            isFading && "opacity-30 hover:opacity-80 max-h-[120px] overflow-hidden",
                                            isTemporarilyRevealed && "opacity-100 max-h-none ring-1 ring-blue-500/20 bg-blue-950/10",
                                            !isFading && !isLastAssistant && "hover:bg-white/[0.02]",
                                            isRetained && "border-l-2 border-l-emerald-500/40 pl-4"
                                        )}
                                    >
                                        {/* Retained badge */}
                                        {isRetained && (
                                            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-emerald-950/50 border border-emerald-500/20 rounded-md">
                                                <Pin className="w-2.5 h-2.5 text-emerald-400" />
                                                <span className="text-[9px] text-emerald-400 font-bold uppercase">Retenu</span>
                                            </div>
                                        )}

                                        {/* Retrieval Router Intent Badge & Token Weight Indicator */}
                                        {msg.retrievalIntent && (
                                            <div className="absolute top-2 right-4 flex items-center gap-2 font-mono text-[9px]">
                                                <span className="px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                                    <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                                    Voie : {msg.retrievalIntent}
                                                </span>
                                                {msg.tokenLossWeight && (
                                                    <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800" title="Pondération des pertes par catégorie de token (Chiffres x10, Noms x8)">
                                                        Poids Token : ×{msg.tokenLossWeight}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Focus zone glow indicator */}
                                        {isLastAssistant && (
                                            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-16 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                                        )}

                                        {/* Fading overlay gradient */}
                                        {isFading && (
                                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none rounded-b-3xl z-10" />
                                        )}

                                        {/* Temporarily revealed: close button */}
                                        {isTemporarilyRevealed && (
                                            <button
                                                onClick={() => setTemporarilyRevealedIdx(null)}
                                                className="absolute top-2 right-14 text-[10px] text-blue-400 hover:text-white bg-blue-950/60 px-2 py-1 rounded-md z-20 font-medium"
                                            >
                                                Replier
                                            </button>
                                        )}

                                        {/* Message Content */}
                                        <div className="flex-1 min-w-0">
                                            {msg.documentId ? (
                                                <InlineDocWrapper
                                                    documentId={msg.documentId}
                                                    onRemove={() => {
                                                        if (!activeNodeId || !activeNode) return;
                                                        const newMessages = activeNode.data.messages.map((m: any) =>
                                                            m === msg ? { ...m, hiddenDocumentId: m.documentId, documentId: undefined } : m
                                                        );
                                                        updateNodeData(activeNodeId, { messages: newMessages });
                                                    }}
                                                />
                                            ) : editingIndex === i ? (
                                                <div className="flex flex-col gap-3 bg-[#0a0a0a] p-4 rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                                                    <textarea
                                                        className="w-full bg-transparent text-white text-[15px] focus:ring-0 outline-none resize-none min-h-[120px] font-sans leading-relaxed custom-scrollbar placeholder:text-neutral-600"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <div className="flex items-center gap-2 justify-end pt-2 border-t border-white/5">
                                                        <button onClick={() => setEditingIndex(null)} className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">Annuler</button>
                                                        <button onClick={() => handleSaveEdit(i)} className="px-4 py-2 text-xs font-semibold bg-white text-black rounded-full hover:bg-neutral-200 transition-colors shadow-md">Sauvegarder</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[15px] leading-relaxed text-neutral-200 font-sans tracking-wide space-y-4">
                                                    <ReactMarkdown
                                                        components={{
                                                            code(props) {
                                                                const { children, className, node, ...rest } = props
                                                                const match = /language-(\w+)/.exec(className || '')
                                                                return match ? (
                                                                    <div className="bg-[#121214] p-4 rounded-2xl font-mono text-sm overflow-x-auto text-emerald-300 border border-white/10 my-4 whitespace-pre shadow-xl">
                                                                        <code className={className} {...rest}>
                                                                            {children}
                                                                        </code>
                                                                    </div>
                                                                ) : (
                                                                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-xs" {...rest}>
                                                                        {children}
                                                                    </code>
                                                                )
                                                            },
                                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-white border-b border-white/10 pb-2 tracking-tight" {...props} />,
                                                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-5 mb-2 text-indigo-200 tracking-tight" {...props} />,
                                                            h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-4 mb-1 text-purple-200" {...props} />,
                                                            p: ({ node, ...props }) => <p className="text-[#e2e8f0] text-[15px] leading-relaxed mb-3" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1.5 my-3 text-neutral-200" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1.5 my-3 text-neutral-200" {...props} />,
                                                            li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-500/50 pl-4 py-1 my-3 bg-purple-950/20 rounded-r-xl italic text-purple-200 text-sm" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}

                                            {/* Action Buttons under message */}
                                            <div className="flex items-center gap-2 mt-4 transition-opacity">
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(msg.content)}
                                                    className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
                                                    title="Copier le texte"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => { setEditValue(msg.content); setEditingIndex(i); }}
                                                    className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
                                                    title="Éditer le message"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                </button>

                                                {/* ◆ EJECT TO SPACE — Opens a floating spatial window */}
                                                {!msg.ejected && (
                                                    <button
                                                        onClick={() => ejectToSpace(msg.content, i)}
                                                        className="p-1.5 text-neutral-500 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide hover:scale-105"
                                                        title="Éjecter dans l'espace (fenêtre flottante)"
                                                    >
                                                        <MoveUpRight className="w-3.5 h-3.5" />
                                                        <span>Espace</span>
                                                    </button>
                                                )}
                                                {msg.ejected && (
                                                    <span className="text-[10px] text-blue-500/50 font-medium italic flex items-center gap-1">
                                                        <MoveUpRight className="w-3 h-3" /> En espace
                                                    </span>
                                                )}

                                                {/* ◆ PIN/RETAIN — Prevents message from fading */}
                                                {!isRetained && !isLastAssistant && (
                                                    <button
                                                        onClick={() => retainMessage(i)}
                                                        className="p-1.5 text-neutral-500 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide"
                                                        title="📌 Retenir ce message (ne s'estompera jamais)"
                                                    >
                                                        <Pin className="w-3.5 h-3.5" />
                                                        <span>Retenir</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Branching Toolbar - always visible now */}
                                            <div className="absolute top-2 right-2 transition-opacity flex bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden pointer-events-auto z-10">
                                                {!msg.documentId && !msg.hiddenDocumentId && (
                                                    <button
                                                        onClick={() => handleBranchOut(msg, 'document')}
                                                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 px-3 rounded-lg"
                                                        title="Créer un Document"
                                                    >
                                                        <LayoutTemplate className="w-3.5 h-3.5" /> <span className="text-[10px] uppercase font-bold tracking-wider">Créer Document</span>
                                                    </button>
                                                )}
                                                {!msg.documentId && msg.hiddenDocumentId && (
                                                    <button
                                                        onClick={() => {
                                                            if (!activeNodeId || !activeNode) return;
                                                            const newMessages = activeNode.data.messages.map((m: any) =>
                                                                m === msg ? { ...m, documentId: m.hiddenDocumentId, hiddenDocumentId: undefined } : m
                                                            );
                                                            updateNodeData(activeNodeId, { messages: newMessages });
                                                        }}
                                                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-colors flex items-center gap-1.5 px-3 rounded-lg"
                                                        title="Rouvrir le Document"
                                                    >
                                                        <LayoutTemplate className="w-3.5 h-3.5" /> <span className="text-[10px] uppercase font-bold tracking-wider">Rouvrir Document</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Fragment>
                            );
                        })}
                    </div>
                </div>
            ) : !isCanvasOpen ? (
                <div className="flex-1 flex flex-col justify-end w-full pb-8">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white/90 text-center font-sans">
                        Que souhaitez-vous créer ou explorer ?
                    </h1>
                </div>
            ) : null}


            {/* Canvas is rendered in page.tsx — no duplicate here */}


            {/* ===== SPATIAL VISION PREVIEW LAYER ===== */}
            {activePreview && isPreviewVisible && (
                <div
                    className={cn(
                        "fixed top-4 right-4 bottom-28 left-[60px] z-40 flex items-center justify-center pointer-events-none",
                        "transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] animate-in fade-in slide-in-from-right-8 duration-500"
                    )}
                >
                    <div className="w-full max-w-4xl h-full max-h-[70vh] pointer-events-auto">
                        <DynamicPreviewBlock
                            id={activePreview.id}
                            title={activePreview.title}
                            type={activePreview.type}
                            status={activePreview.status}
                            onClose={() => { setIsPreviewVisible(false); setActivePreview(null); }}
                        />
                    </div>
                </div>
            )}

            {/* Simulation recall supprimé — fermer = détruire. Re-déclencher via le bouton Simulation du chatbar. */}

            {/* ===== SPATIAL WINDOWS LAYER ===== */}
            {spatialWindows.map((spatialWin, wi) => (
                <SpatialWindow
                    key={spatialWin.id}
                    win={spatialWin}
                    isSelected={selectedWindowIds.includes(spatialWin.id)}
                    zIndex={spatialWin.id === topZId ? 9999 : 9000 + wi}
                    onSelect={toggleWindowSelection}
                    onClose={closeSpatialWindow}
                    onReturnToChat={returnToChat}
                    onBringToFront={bringToFront}
                    onMove={moveWindow}
                />
            ))}

            {/* ===== MERGE + COMPARE + BUILD FLOATING TOOLBAR ===== */}
            {selectedWindowIds.length >= 1 && !isCanvasOpen && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[10000] pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-neutral-700/60 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
                        style={{ background: "rgba(18,18,22,0.97)", backdropFilter: "blur(30px)" }}>
                        <span className="text-[11px] text-neutral-400 font-semibold mr-1">
                            {selectedWindowIds.length} fenêtre{selectedWindowIds.length > 1 ? 's' : ''}
                        </span>

                        {/* Fusionner avec l'IA */}
                        {selectedWindowIds.length >= 2 && (
                            <button
                                onClick={mergeWindows}
                                disabled={isMerging}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 font-bold text-[11px] rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                            >
                                {isMerging ? (
                                    <><Loader2 className="w-3 h-3 animate-spin" /> Fusion…</>
                                ) : (
                                    <><Combine className="w-3 h-3" /> Fusionner IA</>
                                )}
                            </button>
                        )}

                        {/* Comparer côte-à-côte (2 sélectionnées) */}
                        {selectedWindowIds.length >= 2 && (
                            <button
                                onClick={() => {
                                    setIsComparisonOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 font-bold text-[11px] rounded-xl transition-all hover:scale-105"
                            >
                                <Layers className="w-3 h-3" /> Comparer
                            </button>
                        )}

                        {/* Construire Document depuis les fenêtres sélectionnées */}
                        <button
                            onClick={() => setIsDocBuilderOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-bold text-[11px] rounded-xl transition-all hover:scale-105"
                        >
                            <FileStack className="w-3 h-3" /> Construire Doc
                        </button>

                        <button
                            onClick={() => setSelectedWindowIds([])}
                            className="p-1.5 text-neutral-600 hover:text-white transition-colors ml-1"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ===== DOCUMENT BUILDER MODAL ===== */}
            {isDocBuilderOpen && (
                <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-[#0f0f12] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                    <FileStack className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Construire un Document</h3>
                                    <p className="text-[11px] text-neutral-500">Assemblez vos fragments retenus en un document structuré</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDocBuilderOpen(false)} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Fragment list */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-bold mb-3">Fragments disponibles</p>

                            {/* Spatial windows */}
                            {spatialWindows.length === 0 && messages.filter((m: any) => m.retained).length === 0 && (
                                <div className="text-center py-8 text-neutral-600 text-sm">
                                    <p>Aucun fragment retenu.</p>
                                    <p className="text-xs mt-1">Utilisez <strong className="text-neutral-400">Espace</strong> ou <strong className="text-neutral-400">📌 Retenir</strong> pour capturer des réponses.</p>
                                </div>
                            )}

                            {spatialWindows.map((w, idx) => (
                                <div key={w.id} className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl group/frag">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <MoveUpRight className="w-3 h-3 text-blue-400 shrink-0" />
                                        <span className="text-[11px] font-bold text-blue-300 truncate flex-1">{w.label}</span>
                                        <span className="text-[10px] text-neutral-600">Fenêtre spatiale</span>
                                    </div>
                                    <p className="text-[12px] text-neutral-400 line-clamp-2 font-sans">{w.content.replace(/[*#]/g, '').substring(0, 120)}…</p>
                                </div>
                            ))}

                            {messages.filter((m: any) => m.retained).map((msg: any, idx: number) => (
                                <div key={idx} className="p-3 bg-neutral-900/80 border border-emerald-500/20 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Pin className="w-3 h-3 text-emerald-400 shrink-0" />
                                        <span className="text-[11px] font-bold text-emerald-300 flex-1">Message retenu</span>
                                        <span className="text-[10px] text-neutral-600">Épinglé</span>
                                    </div>
                                    <p className="text-[12px] text-neutral-400 line-clamp-2 font-sans">{msg.content.replace(/[*#]/g, '').substring(0, 120)}…</p>
                                </div>
                            ))}
                        </div>

                        {/* Type selector + Generate button */}
                        <div className="px-5 pb-5 pt-3 border-t border-neutral-800 space-y-3">
                            <div className="flex items-center gap-2">
                                <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider">Type de document :</p>
                                {['Mémoire', 'Rapport de stage', 'Article', 'Analyse', 'Synthèse'].map(docType => (
                                    <button
                                        key={docType}
                                        className="px-2.5 py-1 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] rounded-lg border border-neutral-700 transition-all font-medium"
                                        onClick={async () => {
                                            setIsBuildingDoc(true);
                                            const allFragments = [
                                                ...spatialWindows.map(w => `### Fragment (Fenêtre Spatiale)\n${w.content}`),
                                                ...messages.filter((m: any) => m.retained).map((m: any, i: number) => `### Fragment (Épinglé ${i + 1})\n${m.content}`)
                                            ];
                                            const systemPrompt = `Tu es un expert en rédaction académique et professionnelle. Tu vas recevoir plusieurs fragments de recherche et de réflexion, et tu dois les structurer en un ${docType} cohérent, clair et de haute qualité. Conserve la traçabilité des idées, assure la cohérence argumentative, et rédige dans un style académique rigoureux.`;
                                            const userPrompt = `Voici ${allFragments.length} fragments à assembler en un ${docType} :\n\n${allFragments.join('\n\n---\n\n')}\n\nRédige un ${docType} complet et structuré à partir de ces éléments.`;
                                            try {
                                                const res = await fetch('/api/chat', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], provider: aiProvider }),
                                                });
                                                const data = await res.json();
                                                if (res.ok && activeNodeId && activeNode) {
                                                    const docNodeId = `node_${Date.now()}_doc`;
                                                    addNode({
                                                        id: docNodeId,
                                                        position: { x: (activeNode.position.x || 0) + 500, y: (activeNode.position.y || 0) },
                                                        data: {
                                                            label: `📄 ${docType}`,
                                                            messages: [],
                                                            category: 'document',
                                                            isDocument: true,
                                                            documentData: [{ type: 'paragraph', content: [{ type: 'text', text: data.content || '', styles: {} }] }]
                                                        },
                                                        type: 'custom'
                                                    } as any);
                                                    if (activeNodeId) connectNodes({ id: `e-doc-${Date.now()}`, source: activeNodeId, target: docNodeId });
                                                }
                                            } catch (e) { console.error(e); } finally {
                                                setIsBuildingDoc(false);
                                                setIsDocBuilderOpen(false);
                                            }
                                        }}
                                    >
                                        {docType}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={isBuildingDoc || (spatialWindows.length === 0 && messages.filter((m: any) => m.retained).length === 0)}
                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
                                onClick={async () => {
                                    setIsBuildingDoc(true);
                                    const allFragments = [
                                        ...spatialWindows.map(w => `### Fragment (Fenêtre Spatiale)\n${w.content}`),
                                        ...messages.filter((m: any) => m.retained).map((m: any, i: number) => `### Fragment (Épinglé ${i + 1})\n${m.content}`)
                                    ];
                                    const prompt = `Structure ces fragments en un document cohérent et de qualité :\n\n${allFragments.join('\n\n---\n\n')}`;
                                    try {
                                        const res = await fetch('/api/chat', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], provider: aiProvider }),
                                        });
                                        const data = await res.json();
                                        if (res.ok && activeNodeId && activeNode) {
                                            const docNodeId = `node_${Date.now()}_doc`;
                                            addNode({
                                                id: docNodeId,
                                                position: { x: (activeNode.position.x || 0) + 500, y: (activeNode.position.y || 0) },
                                                data: {
                                                    label: '📄 Document Assemblé',
                                                    messages: [],
                                                    category: 'document',
                                                    isDocument: true,
                                                    documentData: [{ type: 'paragraph', content: [{ type: 'text', text: data.content || '', styles: {} }] }]
                                                },
                                                type: 'custom'
                                            } as any);
                                            if (activeNodeId) connectNodes({ id: `e-doc-${Date.now()}`, source: activeNodeId, target: docNodeId });
                                        }
                                    } catch (e) { console.error(e); } finally {
                                        setIsBuildingDoc(false);
                                        setIsDocBuilderOpen(false);
                                    }
                                }}
                            >
                                {isBuildingDoc ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours…</> : <><FileStack className="w-4 h-4" /> Générer le Document sur le Canvas</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Chat Minimap (Right side) - ALL BRANCHES */}
            {!isCanvasOpen && nodes.filter(n => !n.data.isDocument).length > 1 && (
                <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 items-end py-10 pointer-events-auto z-50">
                    <button
                        onClick={() => {
                            const newId = `node_${Date.now()}`;
                            let targetX = 0;
                            let targetY = 0;
                            if (activeNode) {
                                targetX = activeNode.position.x + 450;
                                const nodesAtSameLevel = nodes.filter(n => Math.abs(n.position.x - targetX) < 100);
                                targetY = activeNode.position.y;
                                if (nodesAtSameLevel.length > 0) {
                                    const maxY = Math.max(...nodesAtSameLevel.map(n => n.position.y));
                                    targetY = maxY + 250;
                                }
                            }
                            addNode({ id: newId, position: { x: targetX, y: targetY }, data: { label: "Nouvelle discussion", messages: [] }, type: "custom" } as any);
                            if (activeNodeId) {
                                connectNodes({ id: `e-${activeNodeId}-${newId}`, source: activeNodeId, target: newId });
                            }
                            handleNavigate(newId);
                        }}
                        className="mb-4 mr-2 p-2 bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 rounded-full transition-all flex items-center justify-center hover:scale-110 shadow-lg"
                        title="Créer une nouvelle branche de discussion"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>

                    {nodes.filter(n => !n.data.isDocument).map((node) => (
                        <div
                            key={node.id}
                            onClick={() => handleSpatialNavigate(node.id, node.data.label || "")}
                            className="relative group/chatmap cursor-pointer flex justify-end w-12 py-1.5"
                        >
                            <div
                                className={cn("h-[3px] rounded-l-full transition-all duration-300",
                                    node.id === activeNodeId ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "w-3 bg-neutral-700 group-hover/chatmap:bg-neutral-400 group-hover/chatmap:w-6"
                                )}
                            />
                            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#111111]/95 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-lg opacity-0 group-hover/chatmap:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl border border-white/10 font-medium">
                                {node.data.label || "Nouvelle discussion"}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Area (Masquée automatiquement lors de l'édition de document) */}
            {!activeDocumentId && (
                <div className={cn(
                    "fixed bottom-6 left-1/2 -translate-x-1/2 w-full z-50 pointer-events-auto transition-all px-4 max-w-3xl animate-in fade-in duration-300"
                )}>
                    <form onSubmit={handleSubmit} className="relative flex flex-col bg-[#1c1c1e]/90 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all focus-within:border-white/30 focus-within:shadow-[0_10px_60px_rgba(255,255,255,0.1)]">
                    {onToggleCanvas && ( // Use onToggleCanvas for the minimize/maximize button
                        <button type="button" onClick={onToggleCanvas} className="absolute top-2 right-2 p-1.5 text-neutral-500 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10" title="Basculer la vue Canvas">
                            {isCanvasOpen ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>}
                        </button>
                    )}


                    <div className="overflow-y-auto custom-scrollbar">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder="Que voulez-vous créer aujourd'hui ?"
                            className={cn(
                                "w-full px-5 py-5",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-white text-[16px] leading-relaxed",
                                "focus:outline-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-neutral-500",
                                "min-h-[60px]"
                            )}
                            style={{ overflow: "hidden" }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="group p-2 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Paperclip className="w-4 h-4 text-neutral-400" />
                            </button>
                            {/* Sélecteur de modèle IA */}
                            <button
                                type="button"
                                onClick={() => setAiProvider(p => p === "groq" ? "nvidia" : "groq")}
                                title={aiProvider === "groq" ? "Groq (Llama 3.3 70B) - Rapide. Cliquer pour NVIDIA" : "NVIDIA (Llama 3.1 70B) - Puissant. Cliquer pour Groq"}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white"
                            >
                                <Sparkles className="w-3 h-3" />
                                {aiProvider === "groq" ? "Groq" : "NVIDIA"}
                            </button>

                            {/* ◆ CONSTRUIRE DOCUMENT — visible si fenêtres spatiales ou messages retenus */}
                            {retainedFragmentCount >= 1 && (
                                <button
                                    type="button"
                                    onClick={() => setIsDocBuilderOpen(true)}
                                    title={`Assembler ${retainedFragmentCount} fragment${retainedFragmentCount > 1 ? 's' : ''} retenus en un document structuré`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.15)] animate-in fade-in duration-300"
                                >
                                    <FileStack className="w-3 h-3" />
                                    Doc ({retainedFragmentCount})
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 relative">
                            {onMinimize && (
                                <button
                                    type="button"
                                    onClick={onMinimize}
                                    title="Réduire le Chatbar"
                                    className="p-1.5 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={!value.trim() || isSendingAI || isAutomating}
                                className={cn(
                                    "p-1.5 rounded-full flex items-center justify-center transition-colors",
                                    value.trim() && !isSendingAI && !isAutomating
                                        ? "bg-white text-black hover:bg-neutral-200"
                                        : "bg-neutral-800 text-neutral-500"
                                )}
                            >
                                {(isSendingAI || isAutomating) ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            )}


            {/* L'Animation "Window Split" de la Nouvelle Branche */}
            {branchPhase !== 'idle' && branchingData && (
                <div className="fixed inset-0 z-0 pointer-events-none flex justify-center items-center" style={{ perspective: '1200px' }}>
                    {/* Background Canvas Revelation */}
                    <div
                        className="absolute inset-0 bg-black transition-opacity duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                        style={{ opacity: (branchPhase === 'focus' || branchPhase === 'handoff' || branchPhase === 'reveal') ? 1 : 0.6 }}
                    />

                    {/* Ghost Panel (Represents the NEW branch flying in) */}
                    <div
                        className={cn(
                            "absolute flex flex-col items-center justify-center text-white overflow-hidden origin-center",
                            (branchPhase === 'handoff' || branchPhase === 'reveal') ? "transition-opacity duration-500" : "transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
                            "bg-[#1c1c1e]/90 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_40px_100px_rgba(255,255,255,0.06)]",
                            "w-[800px] h-[75vh] max-h-full"
                        )}
                        style={{
                            transform: branchPhase === 'split' ? 'translateX(25vw) translateZ(-400px) rotateY(-20deg) scale(0.85)' :
                                (branchPhase === 'focus' || branchPhase === 'handoff' || branchPhase === 'reveal') ? 'translateX(0) translateZ(0) rotateY(0deg) scale(1)' :
                                    'translateX(50vw) translateZ(-600px) rotateY(-30deg) scale(0.7)',
                            opacity: branchPhase === 'reveal' ? 0 : 1,
                            filter: branchPhase === 'split' ? 'blur(4px)' : 'blur(0px)',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        <div className="flex flex-col items-center gap-6 p-8 opacity-100 animate-in fade-in zoom-in-95 duration-500 delay-100">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-medium text-white tracking-tight">
                                    {['document', 'fiche', 'synthese'].includes(branchingData.category) ? "Création du Document..." :
                                        branchingData.category === "Navigation Spatiale" ? "Ouverture de la Branche..." : "Nouvelle Branche..."}
                                </h3>
                                <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
                                    {branchingData.category !== "Navigation Spatiale" ? `${branchingData.category.toUpperCase()} • ` : ""}
                                    {branchingData.text}
                                </p>
                            </div>
                            {/* Extremely polished loader/button */}
                            <div className="mt-4 px-6 py-3 rounded-full bg-white text-black font-medium text-sm flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {branchingData.category === "Navigation Spatiale" ? "Chargement de l'espace..." : "Initialisation de l'espace..."}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* D1 — Selection Popover pour extraction sélective de fragment */}
            <SelectionPopover
                onEjectToSpace={ejectSelectionToSpace}
                onMarkImportant={(text) => addExtractedFragment(text, 2)}
                onAddToCompare={(text) => {
                    const newWin: SpatialWindowData = {
                        id: `sw_cmp_${Date.now()}`,
                        content: text,
                        label: `⚖️ ${text.substring(0, 30)}…`,
                        x: 0,
                    };
                    setSpatialWindows(prev => [...prev, newWin]);
                    setSelectedWindowIds(prev => [...prev, newWin.id]);
                    setIsComparisonOpen(true);
                }}
            />

            {/* Piste d'Historique (History Rail Vertical) */}
            {!isCanvasOpen && messages.length > 0 && (
                <HistoryRail
                    turns={messages.filter((m: any) => m.role === 'assistant').map((m: any, idx: number) => ({
                        index: idx,
                        id: `turn_${idx}`,
                        timestamp: Date.now() - (messages.length - idx) * 60000,
                        previewText: m.content.substring(0, 80).replace(/[*#\n]/g, ' '),
                        retentionState: (m.retentionAge || 0) >= 4 ? 'collapsed' : (m.retentionAge || 0) >= 2 ? 'fading' : 'visible',
                        fullContent: m.content
                    }))}
                    onScrollToTurn={(idx) => {
                        // Scroll au tour sélectionné
                        const container = chatContainerRef.current;
                        if (container) {
                            container.scrollTo({ top: idx * 250, behavior: 'smooth' });
                        }
                    }}
                    onEjectTurn={(turn) => {
                        ejectToSpace(turn.fullContent, turn.index);
                    }}
                />
            )}

            {/* Matrix Comparison Table Central */}
            <CentralComparisonTable
                isOpen={isComparisonOpen}
                onClose={() => setIsComparisonOpen(false)}
                items={spatialWindows.filter(w => selectedWindowIds.includes(w.id)).map(w => ({
                    id: w.id,
                    title: w.label || "Fenêtre Spatiale",
                    content: w.content,
                    provenance: "Session Handy VCE",
                }))}
            />
        </div>
    );
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
    return (
        <button className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 text-[13px] text-neutral-300 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:-translate-y-0.5">
            {icon}
            {label}
        </button>
    );
}
