"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Node, Edge, addEdge, Connection } from "@xyflow/react";
import dagre from 'dagre';
import localforage from "localforage";

// ---------------------------------------------------------------------------
// Storage keys — centralisés pour éviter toute désynchronisation lors du reset
// ---------------------------------------------------------------------------
export const STORAGE_KEY_PROJECTS = 'nightcode_projects';
export const STORAGE_KEY_ACTIVE_PROJECT = 'nightcode_active_project';

// ---------------------------------------------------------------------------
// Module 6 — NodeQuality & Attention Score
// ---------------------------------------------------------------------------

/**
 * Structure NodeQuality unifiée (sans task_relevance — score purement spatial).
 * Calculée à la volée, jamais stockée en DB.
 */
export interface NodeQuality {
  nodeId: string;
  relevance: number;   // [0..1] — pertinence sémantique par rapport au contexte actif
  trust: number;       // [0..1] — score de confiance issu du Claims Graph (default: 0.5)
  attentionScore: number; // 0.6 * relevance + 0.4 * trust
}

/**
 * Calcule l'Attention Score MVP à la volée.
 * Formule : 0.6 * relevance + 0.4 * trust
 */
export function computeAttentionScore(relevance: number, trust: number): number {
  const score = 0.6 * relevance + 0.4 * trust;
  return Math.round(score * 10000) / 10000; // 4 décimales
}

export interface Project {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  actions?: any[];
  activeNodeId: string | null;
  activeDocumentId: string | null;
}

interface CanvasContextType {
  projects: Record<string, Project>;
  activeProjectId: string;
  nodes: Node[];
  edges: Edge[];
  activeNodeId: string | null;
  activeDocumentId: string | null;
  actions: any[];
  nodeQualities: Record<string, NodeQuality>;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setActions: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveNodeId: (id: string | null) => void;
  setActiveDocumentId: (id: string | null) => void;
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: any) => void;
  connectNodes: (params: Edge | Connection) => void;
  connectSemantic: (sourceId: string, targetId: string, label?: string) => void;
  updateNodeQuality: (nodeId: string, relevance: number, trust?: number) => void;
  createProject: (name: string) => void;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => void;
  autoLayout: (direction?: 'LR' | 'TB' | 'GRID' | 'ATTENTION') => void;
  isLightMode: boolean;
  setIsLightMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

const createInitialWorkspace = (): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [
    {
      id: "node_jbc_2019",
      type: "custom",
      position: { x: 80, y: 120 },
      data: {
        label: "article_JBC_2019_SOD2_ROS.pdf",
        isDocument: true,
        category: "document",
        attentionScore: 0.95,
        documentData: [
          { type: "heading", content: [{ type: "text", text: "Résultats Expérimentaux SOD2 (2019)", styles: {} }], props: { level: 2 } },
          { type: "paragraph", content: [{ type: "text", text: "L'surexpression du gène SOD2 entraîne une diminution drastique des espèces réactives de l'oxygène (ROS) intracellulaires et protège les cardiomyocytes contre l'apoptose induite par l'ischémie.", styles: {} }] }
        ],
        vceClaims: [
          { text: "SOD2 réduit le stress oxydatif et inhibe l'apoptose cardiaque (Confidence: 0.95)", action: "auto_accepted", confidence: 0.95 }
        ]
      }
    },
    {
      id: "node_cell_2022",
      type: "custom",
      position: { x: 580, y: 120 },
      data: {
        label: "article_Cell_2022_SOD2_controversy.pdf",
        isDocument: true,
        category: "document",
        attentionScore: 0.93,
        documentData: [
          { type: "heading", content: [{ type: "text", text: "Controverse Mitochondriale (2022)", styles: {} }], props: { level: 2 } },
          { type: "paragraph", content: [{ type: "text", text: "À fortes doses, l'accumulation de H2O2 générée par SOD2 dépasse la capacité de la catalase et induit une toxicité mitochondriale paradoxale.", styles: {} }] }
        ],
        vceClaims: [
          { text: "Toxicité paradoxale de SOD2 à forte concentration via accumulation H2O2", action: "review_required", confidence: 0.91 }
        ]
      }
    },
    {
      id: "node_code_main",
      type: "custom",
      position: { x: 80, y: 520 },
      data: {
        label: "payment_gateway.py",
        messages: [{ role: "assistant", content: "def process_stripe_charge(amount):\n    # Core API call without automatic retry policy\n    return stripe.Charge.create(amount=amount)" }],
        category: "code",
        codeContent: "def process_stripe_charge(amount, currency='EUR'):\n    # Ingestion directe sans politique de re-tentative exponentielle (HTTP 429)\n    return stripe.Charge.create(amount=amount, currency=currency)\n",
        language: "python",
        attentionScore: 0.94,
        vceClaims: [
          { text: "L'appel API process_stripe_charge effectue des transactions sans gestionnaire d'exception 429", action: "auto_accepted", confidence: 0.94 }
        ]
      }
    },
    {
      id: "node_doc_spec",
      type: "custom",
      position: { x: 580, y: 520 },
      data: {
        label: "Spécification API Paiements (v1.4)",
        isDocument: true,
        category: "document",
        attentionScore: 0.88,
        documentData: [
          { type: "heading", content: [{ type: "text", text: "Directive d'Architecture - Section 4.2", styles: {} }], props: { level: 2 } },
          { type: "paragraph", content: [{ type: "text", text: "Chaque service d'ingestion bancaire doit obligatoirement implémenter un retry exponentiel avec backoff aléatoire en cas d'erreur HTTP 429.", styles: {} }] }
        ],
        vceClaims: [
          { text: "Exigence formelle : Retry exponentiel obligatoire pour toutes requêtes de paiement", action: "review_required", confidence: 0.96 }
        ]
      }
    }
  ];

  const edges: Edge[] = [
    {
      id: "edge_contradiction_sod2",
      source: "node_jbc_2019",
      target: "node_cell_2022",
      type: "custom",
      label: "CONTRADICTION : Effet Protecteur vs Effet Toxique SOD2",
      data: {
        isContradiction: true,
        assertion: "Contradiction directe : JBC 2019 conclut à un effet protecteur de SOD2 tandis que Cell 2022 démontre une toxicité mitochondriale paradoxale.",
        confidence: 0.96
      }
    },
    {
      id: "edge_contradiction_code",
      source: "node_code_main",
      target: "node_doc_spec",
      type: "custom",
      label: "CONTRADICTION : Absence de Retry vs Spec",
      data: {
        isContradiction: true,
        assertion: "Le code source payment_gateway.py contourne l'exigence de retry imposée par la spec v1.4.",
        confidence: 0.94
      }
    }
  ];

  return { nodes, edges };
};


export function CanvasProvider({ children }: { children: ReactNode }) {
  const initialWs = createInitialWorkspace();
  const [projects, setProjects] = useState<Record<string, Project>>({
    default: {
      id: "default",
      name: "Handy IA Workspace",
      nodes: initialWs.nodes,
      edges: initialWs.edges,
      actions: [],
      activeNodeId: "node_code_main",
      activeDocumentId: null
    }
  });

  const [activeProjectId, setActiveProjectId] = useState("default");
  const [isLightMode, setIsLightMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // NodeQuality map — calculé à la volée, jamais persisté
  const [nodeQualities, setNodeQualities] = useState<Record<string, NodeQuality>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const saved = await localforage.getItem<string>(STORAGE_KEY_PROJECTS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Object.keys(parsed).length > 0) {
            setProjects(parsed);
          }
        }
        const savedActive = await localforage.getItem<string>(STORAGE_KEY_ACTIVE_PROJECT);
        if (savedActive) {
          setActiveProjectId(savedActive);
        }
      } catch (e) {
        console.error("Failed to load projects from localforage", e);
      }
      setIsInitialized(true);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    async function saveData() {
      try {
        await localforage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
        await localforage.setItem(STORAGE_KEY_ACTIVE_PROJECT, activeProjectId);
      } catch (e) {
        console.error("Failed to save projects to localforage", e);
      }
    }
    saveData();
  }, [projects, activeProjectId, isInitialized]);

  const activeProject = projects[activeProjectId] || projects.default;
  const nodes = activeProject.nodes;
  const edges = activeProject.edges;
  const actions = activeProject.actions || [];
  const activeNodeId = activeProject.activeNodeId;
  const activeDocumentId = activeProject.activeDocumentId || null;

  const setNodes = useCallback((updater: React.SetStateAction<Node[]>) => {
    setProjects(prev => {
      const p = prev[activeProjectId];
      const newNodes = typeof updater === 'function' ? updater(p.nodes) : updater;
      return { ...prev, [activeProjectId]: { ...p, nodes: newNodes } };
    });
  }, [activeProjectId]);

  const setEdges = useCallback((updater: React.SetStateAction<Edge[]>) => {
    setProjects(prev => {
      const p = prev[activeProjectId];
      const newEdges = typeof updater === 'function' ? updater(p.edges) : updater;
      return { ...prev, [activeProjectId]: { ...p, edges: newEdges } };
    });
  }, [activeProjectId]);

  const setActions = useCallback((updater: React.SetStateAction<any[]>) => {
    setProjects(prev => {
      const p = prev[activeProjectId];
      const newActions = typeof updater === 'function' ? updater(p.actions || []) : updater;
      return { ...prev, [activeProjectId]: { ...p, actions: newActions } };
    });
  }, [activeProjectId]);

  const setActiveNodeId = useCallback((id: string | null) => {
    setProjects(prev => ({ ...prev, [activeProjectId]: { ...prev[activeProjectId], activeNodeId: id } }));
  }, [activeProjectId]);

  const setActiveDocumentId = useCallback((id: string | null) => {
    setProjects(prev => ({ ...prev, [activeProjectId]: { ...prev[activeProjectId], activeDocumentId: id } }));
  }, [activeProjectId]);

  const addNode = useCallback((node: Node) => {
    setNodes((nds) => [...nds, node]);
  }, [setNodes]);

  const updateNodeData = useCallback((id: string, data: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          // Résoudre les callbacks fonctionnels champ par champ
          // (nécessaire pour triggerSurgicalEditFlow et autres mutations incrementales)
          const resolvedData: Record<string, any> = {};
          for (const [key, value] of Object.entries(data)) {
            resolvedData[key] = typeof value === 'function' ? value(node.data[key]) : value;
          }
          return { ...node, data: { ...node.data, ...resolvedData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const connectNodes = useCallback((params: Edge | Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#525252", strokeWidth: 2 } }, eds));
  }, [setEdges]);

  /**
   * Liaison sémantique dans React Flow.
   * Crée un edge type='semantic' avec un style distinct (violet pointillé).
   */
  const connectSemantic = useCallback((sourceId: string, targetId: string, label?: string) => {
    setEdges((eds) => {
      const exists = eds.some(
        (e) => e.source === sourceId && e.target === targetId && e.type === 'semantic'
      );
      if (exists) return eds;
      const newEdge: Edge = {
        id: `sem_${sourceId}_${targetId}_${Date.now()}`,
        source: sourceId,
        target: targetId,
        type: 'semantic',
        animated: false,
        label: label ?? 'semantique',
        style: { stroke: '#7c3aed', strokeWidth: 1.5, strokeDasharray: '5 3' },
        labelStyle: { fill: '#7c3aed', fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: '#1a1a2e', fillOpacity: 0.85 },
      };
      return [...eds, newEdge];
    });
  }, [setEdges]);

  /**
   * Met à jour la qualité d'un noeud et recalcule l'Attention Score à la volée.
   * trust par défaut = 0.5 (prior neutre sans Claims Graph actif)
   */
  const updateNodeQuality = useCallback((nodeId: string, relevance: number, trust: number = 0.5) => {
    const attentionScore = computeAttentionScore(relevance, trust);
    setNodeQualities(prev => ({
      ...prev,
      [nodeId]: { nodeId, relevance, trust, attentionScore }
    }));
  }, []);

  const createProject = useCallback((name: string) => {
    const newId = `project_${Date.now()}`;
    setProjects(prev => ({
      ...prev,
      [newId]: {
        id: newId,
        name,
        nodes: [createDefaultRootNode(name)],
        edges: [],
        actions: [],
        activeNodeId: "root",
        activeDocumentId: null
      }
    }));
    setActiveProjectId(newId);
  }, []);

  const switchProject = useCallback((id: string) => {
    if (projects[id]) {
      setActiveProjectId(id);
    }
  }, [projects]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const newProjects = { ...prev };
      delete newProjects[id];
      // Si on supprime le dernier projet, on recrée le 'default'
      if (Object.keys(newProjects).length === 0) {
        newProjects.default = {
          id: "default",
          name: "Espace de Recherche",
          nodes: [createDefaultRootNode("Espace de Recherche")],
          edges: [],
          actions: [],
          activeNodeId: "root",
          activeDocumentId: null
        };
        setActiveProjectId("default");
      } else if (activeProjectId === id) {
        // Basculer sur un autre projet existant
        setActiveProjectId(Object.keys(newProjects)[0]);
      }
      return newProjects;
    });
  }, [activeProjectId]);

  const autoLayout = useCallback((direction: 'LR' | 'TB' | 'GRID' | 'ATTENTION' = 'LR') => {
    setNodes(nds => {
      if (nds.length === 0) return nds;

      const newNodes = [...nds];

      if (direction === 'ATTENTION') {
        // Gravité Sémantique : les nœuds avec le plus haut Attention Score sont placés au centre,
        // les autres orbitent autour en cercles concentriques.
        const centerX = 500;
        const centerY = 300;

        const scoredNodes = newNodes.map(n => {
          const q = nodeQualities[n.id];
          const score = q?.attentionScore ?? (n.data?.vceClaims ? 0.8 : 0.5);
          return { node: n, score };
        }).sort((a, b) => b.score - a.score);

        return scoredNodes.map((item, idx) => {
          if (idx === 0) {
            return { ...item.node, position: { x: centerX, y: centerY } };
          }
          const ring = Math.floor(Math.sqrt(idx));
          const countInRing = ring * 6;
          const indexInRing = idx - Math.pow(ring, 2);
          const angle = (indexInRing / countInRing) * 2 * Math.PI;
          const radius = ring * 320;

          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return { ...item.node, position: { x, y } };
        });
      }

      if (direction === 'GRID') {
        let x = 0, y = 0;
        return newNodes.map((n) => {
          const pos = { x, y };
          x += 350;
          if (x > 1400) { x = 0; y += 250; }
          return { ...n, position: pos };
        });
      }

      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));

      const rankdir = direction === 'LR' ? 'LR' : 'TB';

      dagreGraph.setGraph({
        rankdir,
        nodesep: 80,
        ranksep: 120,
        edgesep: 40,
      });

      newNodes.forEach((node) => {
        let width = 300, height = 150;
        if (node.data?.isDocument) { width = 400; height = 550; }
        else if (node.type === 'custom' && node.data?.category === 'note') { width = 180; height = 180; }
        else if (node.type === 'custom') { width = 360; height = 120; }

        dagreGraph.setNode(node.id, { width, height });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      return newNodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - nodeWithPosition.width / 2,
            y: nodeWithPosition.y - nodeWithPosition.height / 2,
          },
        };
      });
    });
  }, [setNodes, edges, nodeQualities]);

  return (
    <CanvasContext.Provider value={{
      projects,
      activeProjectId,
      nodes,
      edges,
      actions,
      activeNodeId,
      activeDocumentId,
      nodeQualities,
      setNodes,
      setEdges,
      setActions,
      setActiveNodeId,
      setActiveDocumentId,
      addNode,
      updateNodeData,
      connectNodes,
      connectSemantic,
      updateNodeQuality,
      createProject,
      switchProject,
      deleteProject,
      autoLayout,
      isLightMode,
      setIsLightMode
    }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
}
