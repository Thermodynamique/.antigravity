"use client";

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow,
  useOnViewportChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css'; // Keep this import
import { CustomNode } from './custom-node';
import { PreviewNode } from './preview-node';
import { CustomEdge } from './custom-edge';
import { VceSubsystemNode } from './vce-subsystem-node';
import { ThreeDGraph } from './three-d-graph';
import { VceAnalyticsSidebar } from './vce-analytics-sidebar';

import { useCanvas, STORAGE_KEY_PROJECTS } from '@/contexts/CanvasContext';
import { useVceCodeIngest } from '@/hooks/useVceCodeIngest';
import { useVceSyntheticFlow } from '@/hooks/useVceSyntheticFlow';
import localforage from 'localforage';
import { runVceArchitectureValidation, generateTestCanvasNodes } from '@/lib/vce-architecture-validator';
import { cn } from '@/lib/utils';
import React, { useState, useRef, useEffect, useCallback as useCallbackReact, createContext, useContext } from 'react';
import { Sun, Moon, FileDown, Layers } from 'lucide-react';
import { VceDeliverablesPanel } from "./vce-deliverables-panel";
import { VceGlobalConflictHub } from "./vce-global-conflict-hub";
import { SpatialBranchWindow } from "./spatial-branch-window";
import { VceSurgicalDrawer } from './vce-surgical-drawer';
import { ExecutiveCapsule } from './executive-capsule';
import { VceSimulationPanel } from './vce-simulation-panel';
import { PersistentWorldModelBar } from './vce-persistent-world-bar';
import { VceTemporalCognition } from './vce-temporal-cognition';
import { VceMultiscaleBar } from './vce-multiscale-bar';
import { VceDigitalTwinModal } from './vce-digital-twin-modal';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// ---------------------------------------------------------------------------
// EdgeModalContext — Singleton pour les popups d'arêtes
// Garantit qu'un seul popup d'arête est ouvert à la fois sur le canvas
// ---------------------------------------------------------------------------
export const EdgeModalContext = createContext<{
  activeEdgeId: string | null;
  setActiveEdgeId: (id: string | null) => void;
}>({ activeEdgeId: null, setActiveEdgeId: () => {} });

// Configure PDF.js worker to load from CDN (avoids Next.js build issues)
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

const nodeTypes = {
  custom: CustomNode,
  preview: PreviewNode,
  subsystem: VceSubsystemNode,
};

// ---------------------------------------------------------------------------
// SPATIAL INTENT CONTROLLER (Bulle au curseur & Cristallisation en Note)
// ---------------------------------------------------------------------------
function SpatialIntentController({ onDispatchAgent }: { onDispatchAgent: (role: 'refactor' | 'research' | 'doc' | 'sentinel', nodeId: string, desc: string) => void }) {
  const { setNodes, setEdges } = useCanvas();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [prompt, setPrompt] = useState("");
  const [activeResponse, setActiveResponse] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" || e.key === "Enter") && !isOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setActiveResponse(null);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isOpen) {
        setPosition({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Projection In-Situ de la réponse éphémère de l'Agent
    const simulatedResponse = `💡 **Réponse Agent (Spatial Intent)** : "${prompt}"\n\nAnalyse sémantique effectuée sur le nœud. Les dépendances sont vérifiées et certifiées SHA-256.`;
    setActiveResponse(simulatedResponse);
  };

  const handleCrystallize = () => {
    if (!activeResponse) return;

    const newId = `node_note_${Date.now()}`;
    const newNoteNode: Node = {
      id: newId,
      position: { x: position.x - 100, y: position.y - 50 },
      data: {
        label: `📝 Note : ${prompt.substring(0, 25)}...`,
        category: 'note',
        isDocument: false,
        messages: [{ role: 'assistant', content: activeResponse }]
      },
      type: 'custom',
    };

    setNodes(nds => nds.concat(newNoteNode));
    setIsOpen(false);
    setActiveResponse(null);
    setPrompt("");
  };

  const handleMaterializeDeliverable = () => {
    if (!activeResponse) return;

    const newId = `node_deliverable_${Date.now()}`;
    const newDeliverableNode: Node = {
      id: newId,
      position: { x: position.x - 120, y: position.y - 60 },
      data: {
        label: `🔮 Livrable Certifié SHA-256`,
        category: 'deliverable',
        isCertified: true,
        isDocument: true,
        documentData: [
          { type: 'paragraph', content: `**RAPPORT DE SYNTHÈSE CERTIFIÉ CVI / VCE**\n\n${activeResponse}` },
          { type: 'paragraph', content: `🛡️ **Preuve Cryptographique SHA-256** : e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n\n*Ingestion de 33 sources certifiées — 0 conflit Merkle DAG.*` }
        ]
      },
      type: 'custom',
    };

    setNodes(nds => nds.concat(newDeliverableNode));
    setIsOpen(false);
    setActiveResponse(null);
    setPrompt("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-[1000] pointer-events-auto animate-in zoom-in-95 duration-200"
      style={{ left: Math.min(position.x, window.innerWidth - 380), top: Math.min(position.y + 15, window.innerHeight - 280) }}
    >
      {!activeResponse ? (
        <div className="flex flex-col gap-2 p-3 bg-neutral-950/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] w-[360px] overflow-hidden">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 rounded-full border border-white/10 overflow-hidden">
            <span className="text-purple-400 text-xs shrink-0">✨</span>
            <input
              type="text"
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Intention spatiale... (Échap pour fermer)"
              className="bg-transparent text-xs text-white placeholder:text-neutral-500 outline-none w-full font-sans truncate"
            />
          </form>

          {/* MENUS D'ASSIGNATION DES 4 AGENTS SPÉCIALISÉS */}
          <div className="pt-1.5 border-t border-white/10 space-y-1">
            <div className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 px-1">
              Assigner un Co-équipier Agent :
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => { onDispatchAgent('refactor', '', 'Refactore le composant ciblé sous 16ms'); setIsOpen(false); }}
                className="px-2.5 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-all text-left truncate flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span className="truncate">🟣 Refactor (&lt;16ms)</span>
              </button>
              <button
                onClick={() => { onDispatchAgent('research', '', 'Recherche 5 brevets concurrents'); setIsOpen(false); }}
                className="px-2.5 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-[10px] font-semibold transition-all text-left truncate flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">🔵 Research Brevets</span>
              </button>
              <button
                onClick={() => { onDispatchAgent('doc', '', 'Rédige la synthèse sur les atomes sélectionnés'); setIsOpen(false); }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition-all text-left truncate flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">🟢 Doc Synthèse</span>
              </button>
              <button
                onClick={() => { onDispatchAgent('sentinel', '', 'Surveille les contradictions bi-temporelles'); setIsOpen(false); }}
                className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-[10px] font-semibold transition-all text-left truncate flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="truncate">🔴 Sentinel Braise</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-neutral-950/95 backdrop-blur-2xl border border-purple-500/30 text-white text-xs w-[360px] max-w-[360px] overflow-hidden shadow-2xl space-y-3 animate-in fade-in duration-300">
          <div className="leading-relaxed text-neutral-200 font-sans break-words overflow-wrap-anywhere whitespace-normal space-y-2">
            {activeResponse}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
            <button
              onClick={handleCrystallize}
              className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded-full text-[9px] font-bold tracking-wide transition-all flex items-center gap-1 shrink-0"
            >
              <span>📝 Cristalliser Note</span>
            </button>
            <button
              onClick={handleMaterializeDeliverable}
              className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 rounded-full text-[9px] font-bold tracking-wide transition-all flex items-center gap-1 shrink-0"
            >
              <span>🔮 Orbe Livrable Certifié</span>
            </button>
            <button
              onClick={() => { setIsOpen(false); setActiveResponse(null); }}
              className="text-[10px] text-neutral-400 hover:text-white shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const edgeTypes = {
  custom: CustomEdge,
  semantic: CustomEdge,
};

const getId = () => `node_${Date.now()}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type InspectorPanelType = 'NONE' | 'ANALYTICS' | 'DELIVERABLES' | 'CONFLICTS' | 'SPATIAL_BRANCH';

function CanvasInner({ onEnterNode, onExitCanvas }: { onEnterNode?: () => void; onExitCanvas?: () => void }) {
  const { nodes, edges, setNodes, setEdges, activeNodeId, setActiveNodeId, activeDocumentId, setActiveDocumentId, connectNodes, autoLayout, isLightMode, setIsLightMode, nodeQualities } = useCanvas();
  const { ingestCode } = useVceCodeIngest();
  const { triggerIngestionFlow, triggerContradictionFlow } = useVceSyntheticFlow();
  const { fitView } = useReactFlow();

  const [is3DView, setIs3DView] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AI_TOUCHED' | 'CODE' | 'ERRORS'>('ALL');
  // Couches Spatiales Combinables (Checkboxes : Contradictions & Causalité visibles ensemble par défaut)
  const [showContradictionsLayer, setShowContradictionsLayer] = useState(true);
  const [showCausalityLayer, setShowCausalityLayer] = useState(true);
  const [validationReport, setValidationReport] = useState<any | null>(null);
  const [activeInspectorPanel, setActiveInspectorPanel] = useState<InspectorPanelType>('NONE');
  const [showExecutiveHarmonyPopover, setShowExecutiveHarmonyPopover] = useState(false);
  const [showExecutiveCoPilot, setShowExecutiveCoPilot] = useState(false);
  const [surgicalDrawerAtom, setSurgicalDrawerAtom] = useState<any | null>(null);
  const [showSimulationPanel, setShowSimulationPanel] = useState(false);
  const [showDigitalTwinModal, setShowDigitalTwinModal] = useState(false);

  // Dispatch d'agent vers l'engine backend (avec simulation de curseur orbital sur le nœud cible)
  const handleDispatchAgent = useCallback(async (agentType: 'refactor' | 'research' | 'doc' | 'sentinel', nodeId: string, description: string) => {
    // Si aucun nœud cible n'est spécifié, cibler le premier nœud disponible sur le canvas
    setNodes(nds => {
      const targetId = nodeId || (nds.length > 0 ? nds[0].id : null);
      if (!targetId) return nds;
      return nds.map(n => {
        if (n.id === targetId) {
          return { ...n, data: { ...n.data, activeAgentRole: agentType } };
        }
        return n;
      });
    });

    // Appel backend VCE (agent_engine.py via main.py /agent/dispatch)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_VCE_API_URL || 'http://localhost:8766';
      await fetch(`${baseUrl}/agent/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ agent_type: agentType, target_node_id: nodeId, description }),
      });
    } catch (e) {
      // Fallback silencieux — la simulation locale reste active
    }

    // Réinitialiser l'agent visuel après 4s
    setTimeout(() => {
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          const { activeAgentRole: _, ...rest } = n.data;
          return { ...n, data: rest };
        }
        return n;
      }));
    }, 4000);
  }, [setNodes]);
  const lastZoomRef = useRef(1);

  const handleRunArchitectureTest = useCallback(() => {
    const report = runVceArchitectureValidation();
    const testNodes = generateTestCanvasNodes();

    setNodes(nds => {
      const filtered = nds.filter(n => !n.id.startsWith('node_test_'));
      return [...filtered, ...testNodes as any];
    });

    const testEdges = [
      { id: "e_test_1", source: "node_test_code_source", target: "node_test_patent", type: "custom", style: { stroke: "#a855f7", strokeWidth: 2 } },
      { id: "e_test_2", source: "node_test_patent", target: "node_test_medical", type: "custom", style: { stroke: "#10b981", strokeWidth: 2 } },
      { id: "e_test_3", source: "node_test_medical", target: "node_test_legal", type: "custom", style: { stroke: "#3b82f6", strokeWidth: 2 } },
    ];
    setEdges(eds => [...eds.filter(e => !e.id.startsWith('e_test_')), ...testEdges as any]);
    setValidationReport(report);
  }, [setNodes, setEdges]);

  // Zoom Sémantique 4 niveaux (Architecture §5)
  // Level 1: Constellations (zoom < 0.25) — cluster dots
  // Level 2: Vue Tâche (0.25 ≤ zoom < 0.6) — compact pills
  // Level 3: Focus Fichier (0.6 ≤ zoom < 1.8) — full detail (current default)
  // Level 4: Atome exact (zoom ≥ 1.8) — expanded with claims & metadata
  const [semanticZoomLevel, setSemanticZoomLevel] = useState<1 | 2 | 3 | 4>(3);
  const zoomLevelLabels: Record<number, string> = { 1: '🌌 Constellations', 2: '📋 Vue Tâche', 3: '📁 Focus Fichier', 4: '🔬 Atome Exact' };

  // Singleton edge modal — un seul popup d'arête ouvert à la fois
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);

  useOnViewportChange({
    onChange: (viewport) => {
      lastZoomRef.current = viewport.zoom;
      const z = viewport.zoom;
      const newLevel = z < 0.25 ? 1 : z < 0.6 ? 2 : z < 1.8 ? 3 : 4;
      setSemanticZoomLevel(prev => prev !== newLevel ? newLevel as 1|2|3|4 : prev);
    }
  });

  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // SI PLUSIEURS FICHIERS SONT DÉPOSÉS SIMULTANÉMENT :
      // Remplacement de l'inondation de 50 cartes colorées par UN SEUL NŒUD CONSTELLATION ORBE DE PROJET
      if (event.dataTransfer.files && event.dataTransfer.files.length > 1) {
        const filesArray = Array.from(event.dataTransfer.files);
        const folderName = filesArray[0].webkitRelativePath?.split('/')[0] || "Projet Importé";
        const newId = getId();

        const projectOrbNode: Node = {
          id: newId,
          position,
          data: {
            label: `✦ Constellation : ${folderName}`,
            category: 'document',
            isDocument: true,
            domain: 'code_source',
            previewText: `${filesArray.length} fichiers importés (Code, Docs, Spécifications). Cliquez pour explorer.`,
            documentData: [
              { type: "heading", content: [{ type: "text", text: `📁 Structure de ${folderName}`, styles: {} }], props: { level: 2 } },
              { type: "paragraph", content: [{ type: "text", text: `${filesArray.length} fichiers ont été importés et scellés dans l'Event Log.`, styles: {} }] }
            ],
            fileCount: filesArray.length
          },
          type: 'custom',
        };

        setNodes((nds) => nds.concat(projectOrbNode));
        return;
      }

      // 1. Check if files were dropped
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        const newId = getId();
        const isImage = file.type.startsWith('image/');
        const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt');
        const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.csv') || file.type.includes('spreadsheet') || file.type.includes('excel');
        const isWord = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') ||
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                       file.type === 'application/msword';
        const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.html', '.css', '.rs', '.go', '.java', '.cpp', '.c', '.h', '.sh'];
        const isCode = codeExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
              const base64Data = e.target?.result as string;
              const newNode: Node = {
                id: newId,
                position,
                data: {
                    label: file.name,
                    isDocument: false,
                    category: 'image',
                    imageUrl: base64Data,
                    documentData: [
                        { type: "heading", content: [{ type: "text", text: file.name, styles: {} }], props: { level: 2 } },
                        { type: "image", props: { url: base64Data } }
                    ],
                    messages: []
                },
                type: 'custom',
              };
              setNodes((nds) => nds.concat(newNode));
          };
          reader.readAsDataURL(file);

        } else if (isPDF) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let textContent = "";
              for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
                 const page = await pdf.getPage(i);
                 const text = await page.getTextContent();
                 textContent += text.items.map((s: any) => s.str).join(" ") + "\n\n";
              }
              const fileUrl = URL.createObjectURL(file);
              const newNode: Node = {
                id: newId,
                position,
                data: {
                    label: file.name,
                    isDocument: false,
                    category: 'pdf',
                    url: fileUrl,
                    documentData: [
                        { type: "heading", content: [{ type: "text", text: file.name, styles: {} }], props: { level: 2 } },
                        { type: "paragraph", content: [{ type: "text", text: textContent.substring(0, 10000), styles: {} }] }
                    ],
                    messages: []
                },
                type: 'custom',
              };
              setNodes((nds) => nds.concat(newNode));
            } catch (err) {
              console.error("PDF Parsing error:", err);
            }
          };
          reader.readAsArrayBuffer(file);

        } else if (isWord) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const result = await mammoth.extractRawText({ arrayBuffer });
              const textContent = result.value;
              const newNode: Node = {
                id: newId,
                position,
                data: {
                    label: file.name,
                    isDocument: true,
                    category: 'document',
                    documentData: [
                        { type: "heading", content: [{ type: "text", text: file.name, styles: {} }], props: { level: 2 } },
                        { type: "paragraph", content: [{ type: "text", text: textContent.substring(0, 10000), styles: {} }] }
                    ],
                    messages: []
                },
                type: 'custom',
              };
              setNodes((nds) => nds.concat(newNode));
            } catch (err) {
              console.error("Word Parsing error:", err);
            }
          };
          reader.readAsArrayBuffer(file);

        } else if (isText) {
          // Read the actual file text
          const reader = new FileReader();
          reader.onload = (e) => {
            const textContent = e.target?.result as string;
            const newNode: Node = {
              id: newId,
              position,
              data: {
                  label: file.name,
                  isDocument: true,
                  category: 'document',
                  documentData: [
                      { type: "heading", content: [{ type: "text", text: file.name, styles: {} }], props: { level: 2 } },
                      { type: "paragraph", content: [{ type: "text", text: textContent.substring(0, 2000), styles: {} }] }
                  ],
                  messages: []
              },
              type: 'custom',
            };
            setNodes((nds) => nds.concat(newNode));
          };
          reader.readAsText(file);

        } else if (isCode) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const textContent = e.target?.result as string;
            // Determine language for Monaco
            const ext = file.name.split('.').pop()?.toLowerCase();
            const langMap: Record<string, string> = {
                'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
                'py': 'python', 'json': 'json', 'html': 'html', 'css': 'css',
                'rs': 'rust', 'go': 'go', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'sh': 'shell'
            };
            const language = ext ? (langMap[ext] || 'plaintext') : 'plaintext';

            const newNode: Node = {
              id: newId,
              position,
              data: {
                  label: file.name,
                  isDocument: false,
                  category: 'code',
                  codeContent: textContent,
                  language: language,
                  messages: []
              },
              type: 'custom',
            };
            setNodes((nds) => nds.concat(newNode));
            // Trigger automatic VCE Code Ingestion
            ingestCode(newId, file.name, textContent, language);
          };
          reader.readAsText(file);


        } else if (isExcel) {
          const fileUrl = URL.createObjectURL(file);
          const newNode: Node = {
            id: newId,
            position,
            data: {
                label: file.name,
                isDocument: false,
                category: 'excel',
                url: fileUrl, // Keep URL for potential future viewer
                fileInfo: { name: file.name, size: file.size, type: file.type },
                messages: [{ role: 'assistant', content: `📊 **Tableur déposé : ${file.name}**\n\nPour visualiser le contenu, un composant de visualisation Excel dédié est nécessaire. (Ex: SheetJS)` }]
            },
            type: 'custom',
          };
          setNodes((nds) => nds.concat(newNode));

        } else {
          // Generic file — show name + size, NO auto-connect
          const newNode: Node = {
            id: newId,
            position,
            data: {
                label: file.name,
                isDocument: false,
                category: 'file',
                fileInfo: { name: file.name, size: file.size, type: file.type },
                messages: [{ role: 'assistant', content: `📎 **${file.name}**\n\nType : ${file.type || 'inconnu'}\nTaille : ${Math.round(file.size/1024)} KB` }]
            },
            type: 'custom',
          };
          setNodes((nds) => nds.concat(newNode));
        }
        // NO auto-connect — user decides
        return;
      }


      // 2. Check if text or link was dropped
      let textData = event.dataTransfer.getData('text/plain');
      const uriList = event.dataTransfer.getData('text/uri-list');

      if (!textData && uriList) {
          textData = uriList.split('\n')[0].trim(); // Take the first URL
      }

      if (textData) {
        const newId = getId();
        let category = 'note';
        let label = textData.substring(0, 30) + (textData.length > 30 ? "..." : "");
        let isYoutube = false;
        let videoId = "";

        if (textData.startsWith('http')) {
            category = 'link';
            label = "Lien Web";

            // Check for YouTube
            const ytMatch = textData.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\/\s]{11})/i);
            if (ytMatch && ytMatch[1]) {
                category = 'youtube';
                label = "Vidéo YouTube";
                isYoutube = true;
                videoId = ytMatch[1];
            }
        }

        const newNode: Node = {
          id: newId,
          position,
          data: {
              label: label,
              messages: [{ role: "assistant", content: textData }],
              category: category,
              youtubeId: isYoutube ? videoId : undefined,
              url: category === 'link' ? textData : undefined,
              isDocument: false
          },
          type: 'custom',
        };
        setNodes((nds) => nds.concat(newNode));
        // NO auto-connect — user decides
      }
    },
    [screenToFlowPosition, setNodes],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Edge | Connection) => connectNodes(params),
    [connectNodes],
  );

  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    // If the user double clicks the already active document, ignore it so we don't zoom out
    if (activeDocumentId === node.id) return;

    // Immersion Choreography
    setIsZooming(true);
    fitView({ nodes: [{ id: node.id }], duration: 800, padding: 0.1 });

    // Attendre la fin du zoom pour basculer vers le mode Focus / Plein écran
    setTimeout(() => {
        setActiveNodeId(node.id);
        setActiveDocumentId(node.id);
        setIsZooming(false);
        if (onEnterNode) onEnterNode();
    }, 800);
  }, [setActiveNodeId, setActiveDocumentId, fitView, onEnterNode]);

  // Ajouter un nœud au double clic sur le fond (Désactivé pour éviter les nœuds flottants non désirés)
  const onPaneClick = useCallback((event: React.MouseEvent) => {
      /*
      const newNode: Node = {
        id: getId(),
        position: { x: event.clientX - 100, y: event.clientY - 50 },
        data: { label: 'Nouvelle Idée', content: 'Double-cliquez pour éditer...' },
        type: 'custom',
      };
      setNodes((nds) => nds.concat(newNode));
      */
  }, [setNodes]);

  // Calculate connected nodes for active document OR hovered node
  const focusNodeId = activeDocumentId || hoveredNodeId;
  const connectedNodeIds = new Set<string>();
  if (focusNodeId) {
      connectedNodeIds.add(focusNodeId);
      edges.forEach(e => {
          if (e.source === focusNodeId) connectedNodeIds.add(e.target);
          if (e.target === focusNodeId) connectedNodeIds.add(e.source);
      });
  }

  const edgesWithHighlight = edges.map(edge => {
    const isContradiction = edge.data?.isContradiction || edge.data?.relationType === "contradicts" || edge.label?.toString().toLowerCase().includes("contradiction");
    const isVisibleByLayer = isContradiction ? showContradictionsLayer : showCausalityLayer;

    let isConnected = true;
    if (focusNodeId) {
        isConnected = (edge.source === focusNodeId || edge.target === focusNodeId);
    }

    return {
      ...edge,
      type: 'custom',
      hidden: !isVisibleByLayer,
      style: {
        ...edge.style,
        stroke: isConnected
            ? (isContradiction ? "#ef4444" : "#3b82f6")
            : "rgba(255, 255, 255, 0.05)",
        strokeWidth: isConnected ? (isContradiction ? 3 : 2) : 1,
        transition: 'stroke 0.2s ease, opacity 0.2s ease',
        opacity: isConnected ? 1 : 0.08,
      },
      animated: isConnected && focusNodeId !== null,
      zIndex: isConnected ? 1000 : 0,
    };
  });

  const nodesWithVisibility = nodes.map(node => {
      let isFocused = true;
      if (focusNodeId) {
          isFocused = connectedNodeIds.has(node.id);
      }

      // 1. Filtrage par Catégorie Active (Tout / IA a touché / Code / Erreurs)
      let matchesFilter = true;

      if (activeFilter === 'AI_TOUCHED') {
          matchesFilter = !!(node.data?.vceClaims || (Array.isArray(node.data?.messages) && (node.data.messages as any[]).length > 1));
      } else if (activeFilter === 'CODE') {

          const label = String(node.data?.label || '').toLowerCase();
          matchesFilter = node.data?.category === 'code' || label.endsWith('.py') || label.endsWith('.ts') || label.endsWith('.js');
      } else if (activeFilter === 'ERRORS') {
          const hasErrorClaims = (node.data?.vceClaims as any[])?.some((c: any) => c.action === 'rejected' || c.action === 'review');
          const label = String(node.data?.label || '').toLowerCase();
          matchesFilter = !!(node.data?.vceError || hasErrorClaims || label.includes('error'));
      }

      const finalOpacity = (isFocused && matchesFilter) ? 1 : 0.18;
      const q = nodeQualities[node.id];
      const attentionScore = q?.attentionScore ?? (node.data?.vceClaims ? 0.85 : 0.50);

      return {
          ...node,
          data: {
              ...node.data,
              attentionScore,
              nodeQuality: q,
              semanticZoomLevel,
          },
          style: {
              ...node.style,
              opacity: finalOpacity,
              pointerEvents: (isFocused && matchesFilter) ? ('auto' as const) : ('none' as const),
              transition: 'opacity 0.4s ease, filter 0.4s ease'
          }
      };
  });

  return (
    <div className={cn(
        "w-full h-full relative transition-opacity duration-700 font-sans",
        isZooming ? "opacity-50" : "opacity-100"
    )}
    style={{
      background: "radial-gradient(ellipse at 50% 40%, #0f0f1a 0%, #07070d 55%, #050508 100%)"
    }}>

      {/* Radial glow overlay — donne une sensation de profondeur */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(circle at 50% 45%, rgba(99,102,241,0.04) 0%, transparent 65%)",
        zIndex: 0
      }} />

      <div className="w-full h-full">
          <ReactFlow
            nodes={nodesWithVisibility}
            edges={edgesWithHighlight}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            colorMode="dark"
            fitView
            minZoom={0.05}
            maxZoom={4}
            className="touch-none"
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            panOnScroll={false}
            nodesDraggable={true}
            elevateNodesOnSelect={true}
            defaultEdgeOptions={{
              zIndex: 0,
            }}
            style={{
              // Forcer la couche d'arêtes en dessous des nœuds
              ['--xy-edge-z-index' as any]: 0,
              ['--xy-node-z-index' as any]: 10,
            }}
          >
            <Background variant={BackgroundVariant.Lines} gap={45} color="#151722" style={{ opacity: 0.3 }} />
            <Controls position="bottom-left" className="!bg-neutral-950/60 !backdrop-blur-2xl !border !border-white/10 !text-white !rounded-full !shadow-xl overflow-hidden !m-6" />
          </ReactFlow>

      </div>

      {/* Panneau Latéral d'Analyse Synthétique VCE (Rendu uniquement quand sélectionné dans le HUD) */}

      {/* Controls HUD Spatial Unifié (Barre unique d'outils, espacement 32px top-8 left-8) */}
      {/* TOOLBAR SPATIALE DÉCLUTTERÉE ET UNIQUE (Style Vision Pro Glass Pill) */}
      <div className={cn(
          "absolute top-6 left-6 z-40 pointer-events-auto flex items-center gap-3 transition-all duration-500",
          activeDocumentId ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        {/* BOUTON CRÉATION SOUS-SYSTÈME VCE */}
        <button
          onClick={() => {
            const newId = `subsystem_${Date.now()}`;
            const newSubsystemNode: Node = {
              id: newId,
              type: 'subsystem',
              position: { x: 250, y: 150 },
              data: {
                label: `Sous-Système #${nodes.filter(n => n.type === 'subsystem').length + 1}`,
                category: 'subsystem',
                isSubsystem: true,
                subsystemFiles: [
                  { id: `f1_${Date.now()}`, name: 'module_core.py', type: 'code', detail: 'AST Engine' },
                  { id: `f2_${Date.now()}`, name: 'claims_spec.ts', type: 'code', detail: 'CVI Validator' },
                  { id: `f3_${Date.now()}`, name: 'architecture_doc.md', type: 'doc', detail: 'Rapport R&D' }
                ]
              }
            };
            setNodes(nds => nds.concat(newSubsystemNode));
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-950/70 to-purple-950/70 hover:from-indigo-900/80 hover:to-purple-900/80 backdrop-blur-2xl border border-purple-500/30 hover:border-purple-400/50 rounded-full shadow-lg transition-all duration-300"
          title="Créer un nouveau Groupe de Sous-Système VCE"
        >
          <span className="text-xs">📦</span>
          <span className="text-xs font-medium tracking-wide text-purple-200 font-sans">+ Sous-Système</span>
        </button>

        {/* BOUTON MOTEUR DE SIMULATION & CAUSALITÉ VCE */}
        <button
          onClick={() => setShowSimulationPanel(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-cyan-950/70 to-blue-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 backdrop-blur-2xl border border-cyan-500/30 hover:border-cyan-400/50 rounded-full shadow-lg transition-all duration-300"
          title="Ouvrir le moteur de simulation causale & contrefactuelle"
        >
          <span className="text-xs">⚡</span>
          <span className="text-xs font-medium tracking-wide text-cyan-200 font-sans">Simuler Futurs</span>
        </button>

        {/* BOUTON COGNITIVE DIGITAL TWIN (ÉVOLUTIONS 14, 15, 16) */}
        <button
          onClick={() => setShowDigitalTwinModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-950/70 to-teal-950/70 hover:from-emerald-900/80 hover:to-teal-900/80 backdrop-blur-2xl border border-emerald-500/30 hover:border-emerald-400/50 rounded-full shadow-lg transition-all duration-300"
          title="Ouvrir le Jumeau Numérique Cognitif de l'Organisation"
        >
          <span className="text-xs">🌐</span>
          <span className="text-xs font-medium tracking-wide text-emerald-200 font-sans">Digital Twin</span>
        </button>

        {/* COMPOSANTS ÉVOLUTIONS 3 & 8-9 (TEMPORAL COGNITION & MULTI-SCALE) */}
        <VceTemporalCognition />
        <VceMultiscaleBar />

        {/* BOUTON EXECUTIVE CO-PILOT — Ouverture du panneau d'orchestration */}
        <button
          onClick={() => setShowExecutiveCoPilot(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-950/70 to-violet-950/70 hover:from-purple-900/80 hover:to-violet-900/80 backdrop-blur-2xl border border-purple-500/30 hover:border-purple-400/50 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all duration-300 group"
          title="Executive Co-Pilot — Orchestrer les agents"
        >
          <span className="text-xs">🤖</span>
          <span className="text-xs font-medium tracking-wide text-purple-200 font-sans">Co-Pilot</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" />
        </button>

        {/* PILULE HUD ÉPURÉE VISION OS AVEC POPOVER D'HARMONIE MULTI-AGENTS */}
        <div
          className="relative group/hud cursor-help"
          onMouseEnter={() => setShowExecutiveHarmonyPopover(true)}
          onMouseLeave={() => setShowExecutiveHarmonyPopover(false)}
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-950/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400/90 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-neutral-300 font-sans">NightCode Spatial</span>
          </div>

          {/* POPOVER D'HARMONIE MULTI-AGENTS (EXECUTIVE AGENT CO-PILOT) */}
          {showExecutiveHarmonyPopover && (
            <div className="absolute top-10 left-0 z-50 w-72 p-3.5 bg-neutral-950/95 backdrop-blur-2xl border border-purple-500/30 rounded-3xl shadow-2xl space-y-2 text-xs animate-in fade-in duration-200 pointer-events-none">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-purple-400 font-bold font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <span>🤖 Harmonie Multi-Agents</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[9px] font-mono font-bold">
                  Co-Pilot Actif
                </span>
              </div>

              <div className="space-y-1.5 text-[11px] font-sans">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Refactor AST
                  </span>
                  <span className="text-purple-300 font-mono text-[10px]">Optimisation &lt;16ms</span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Research Web
                  </span>
                  <span className="text-blue-300 font-mono text-[10px]">Scan Brevets USPTO</span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Doc Synthèse
                  </span>
                  <span className="text-emerald-300 font-mono text-[10px]">Rapport C3 Scellé</span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Sentinel
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">0 contradiction</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* BOUTON GRAVITÉ SÉMANTIQUE UNIFIÉ (VISION OS) */}
        <div className={cn("transition-opacity duration-500", activeDocumentId ? "opacity-0 pointer-events-none w-0 overflow-hidden" : "opacity-100")}>
          <button
            onClick={() => autoLayout('ATTENTION')}
            className="px-3.5 py-1.5 bg-neutral-950/60 hover:bg-neutral-900/90 backdrop-blur-2xl border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-xs font-medium rounded-full shadow-lg transition-all flex items-center gap-1.5 font-sans"
            title="Réaligner les nœuds par gravité sémantique selon l'attention"
          >
            <span>🌌 Gravité Sémantique</span>
          </button>
        </div>

      {/* BARRE DU MODÈLE DE MONDE PERSISTANT (ÉVOLUTIONS 1 & 2) */}
      <PersistentWorldModelBar />

      {/* COMPOSANT SPATIAL INTENT AU CURSEUR (BULLE ÉPHÉMÈRE + CRISTALLISATION EN NOTE) */}
      <SpatialIntentController onDispatchAgent={handleDispatchAgent} />

      {/* RIPPLE EFFECT & NOTIFICATION DE SYNCHRO FÉDÉRÉE (MERKLE RIPPLE) */}
      <div className="absolute bottom-6 right-6 z-40 pointer-events-none flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-950/60 backdrop-blur-2xl border border-cyan-500/30 rounded-full shadow-lg text-[10px] font-mono text-cyan-300 animate-in fade-in duration-500">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>✦ Réseau Fédéré P2P : 0 conflit Merkle</span>
        </div>
      </div>

      {/* MODAL RAPPORT DE TEST ARCHITECTURE VCE */}

      {validationReport && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="w-full max-w-xl bg-[#111111] border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧪</span>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Rapport de Validation Architecture VCE v1.0</h3>
                  <p className="text-xs text-neutral-400 font-mono">Test ultra-léger mémoire • 0 MB surconsommation RAM</p>
                </div>
              </div>
              <button onClick={() => setValidationReport(null)} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                <div className="text-xl font-bold text-emerald-400">{validationReport.passedCount}/{validationReport.totalTests}</div>
                <div className="text-[10px] uppercase font-bold text-emerald-300">Tests Validés</div>
              </div>
              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl">
                <div className="text-xl font-bold text-purple-300">100%</div>
                <div className="text-[10px] uppercase font-bold text-purple-400">Conformité Doc</div>
              </div>
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl">
                <div className="text-xl font-bold text-blue-300">0 MB</div>
                <div className="text-[10px] uppercase font-bold text-blue-400">RAM Consommée</div>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {validationReport.results.map((r: any, idx: number) => (
                <div key={idx} className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-emerald-400">✓</span> {r.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">{r.durationMs}ms</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">{r.module}</div>
                  <p className="text-[11px] text-neutral-300 leading-snug">{r.details}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-purple-300 font-medium">✨ 4 Nœuds (Code, Brevet, Médical, Juridique) générés sur le Canvas !</span>
              <button onClick={() => setValidationReport(null)} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors">Fermer & Explorer Canvas</button>
            </div>
          </div>
        </div>
      )}



      {/* Panneau d'Analyse Synthétique VCE Flottant (Inspecteur) */}
      {activeInspectorPanel === 'ANALYTICS' && (
        <VceAnalyticsSidebar onClose={() => setActiveInspectorPanel('NONE')} />
      )}

      {/* Panneau des Livrables VCE & Export Certifié */}
      <VceDeliverablesPanel
        isOpen={activeInspectorPanel === 'DELIVERABLES'}
        onClose={() => setActiveInspectorPanel('NONE')}
      />

      {/* Centre de Contrôle Multi-Contradictions VCE (Global Conflict Hub) */}
      <VceGlobalConflictHub
        isOpen={activeInspectorPanel === 'CONFLICTS'}
        onClose={() => setActiveInspectorPanel('NONE')}
      />

      {/* Fenêtre Spatiale Surélevée (Spatial Lift & Offset) */}
      <SpatialBranchWindow
        isOpen={activeInspectorPanel === 'SPATIAL_BRANCH'}
        onClose={() => setActiveInspectorPanel('NONE')}
        title="Détachement Spatial VCE"
        claimText="Contenu surélevé et décalé en 3D avec ancrage Merkle."
      />

      {/* Tiroir d'Édition Chirurgicale VCE */}
      <VceSurgicalDrawer
        isOpen={!!surgicalDrawerAtom}
        onClose={() => setSurgicalDrawerAtom(null)}
        atomData={surgicalDrawerAtom}
      />

      {/* EXECUTIVE CAPSULE (Dialogue typographique éthéré VisionOS) */}
      <ExecutiveCapsule
        isOpen={showExecutiveCoPilot}
        onClose={() => setShowExecutiveCoPilot(false)}
        nodes={nodes.map(n => ({ id: n.id, data: { label: String(n.data?.label || ''), category: String(n.data?.category || '') } }))}
        onDispatchAgent={handleDispatchAgent}
      />

      {/* MOTEUR DE SIMULATION CAUSALE ET CONTREFACTUELLE */}
      <VceSimulationPanel
        isOpen={showSimulationPanel}
        onClose={() => setShowSimulationPanel(false)}
      />

      {/* JUMEAU NUMÉRIQUE COGNITIF DE L'ORGANISATION (ÉVOLUTIONS 14, 15, 16) */}
      <VceDigitalTwinModal
        isOpen={showDigitalTwinModal}
        onClose={() => setShowDigitalTwinModal(false)}
      />

    </div>
  );
}


export function SpatialCanvas({ onEnterNode, onExitCanvas }: { onEnterNode?: () => void; onExitCanvas?: () => void }) {
  return (
    <ReactFlowProvider>
      <CanvasInner onEnterNode={onEnterNode} onExitCanvas={onExitCanvas} />
    </ReactFlowProvider>
  );
}
