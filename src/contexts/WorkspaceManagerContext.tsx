"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useCanvas } from "./CanvasContext";

type ViewType = "explorer" | "task";

interface WorkspaceManagerContextProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  generateTaskView: (query: string) => void;
}

const WorkspaceManagerContext = createContext<WorkspaceManagerContextProps | undefined>(undefined);

export function WorkspaceManagerProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>("explorer");
  const { setNodes, setEdges } = useCanvas();

  // Cette fonction simule l'appel au Moteur d'Attention Spatiale
  const generateTaskView = (query: string) => {
    // 1. On passe en mode Tâche
    setCurrentView("task");

    // 2. On nettoie le canvas
    setNodes([]);
    setEdges([]);

    // 3. On mock la réponse de l'IA (5 blocs pertinents + schéma)
    const mockNodes = [
      {
        id: "node_1",
        type: "custom",
        position: { x: 250, y: 150 },
        data: { label: "stripe_client.py", isDocument: true, category: "document", documentData: [{ type: "paragraph", content: [{ type: "text", text: "def create_payment_intent():\n    # Stripe API call", styles: {} }] }] }
      },
      {
        id: "node_2",
        type: "custom",
        position: { x: 600, y: 150 },
        data: { label: "webhook.py", isDocument: true, category: "document", documentData: [{ type: "paragraph", content: [{ type: "text", text: "def handle_stripe_event():\n    pass", styles: {} }] }] }
      },
      {
        id: "node_3",
        type: "custom",
        position: { x: 425, y: 350 },
        data: { label: "schema.sql", isDocument: true, category: "document", documentData: [{ type: "paragraph", content: [{ type: "text", text: "CREATE TABLE payments;", styles: {} }] }] }
      }
    ];

    const mockEdges = [
      { id: "e1-2", source: "node_1", target: "node_2", type: "custom", animated: true },
      { id: "e1-3", source: "node_1", target: "node_3", type: "custom" },
      { id: "e2-3", source: "node_2", target: "node_3", type: "custom" },
    ];

    setTimeout(() => {
        setNodes(mockNodes as any);
        setEdges(mockEdges);
    }, 500); // Simulate network latency
  };

  return (
    <WorkspaceManagerContext.Provider value={{ currentView, setCurrentView, generateTaskView }}>
      {children}
    </WorkspaceManagerContext.Provider>
  );
}

export function useWorkspaceManager() {
  const context = useContext(WorkspaceManagerContext);
  if (!context) {
    throw new Error("useWorkspaceManager must be used within a WorkspaceManagerProvider");
  }
  return context;
}
