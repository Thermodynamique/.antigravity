"use client";


import { useState } from "react";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanvasProvider, useCanvas } from "@/contexts/CanvasContext";
import nextDynamic from "next/dynamic";
export const dynamic = 'force-dynamic';
const SpatialCanvas = nextDynamic(() => import("@/components/ui/canvas").then(m => m.SpatialCanvas), { ssr: false });
const DocumentEditor = nextDynamic(() => import("@/components/ui/document-editor").then(m => m.DocumentEditor), { ssr: false });

import { Sidebar } from "@/components/ui/sidebar";
import { ActivityBar } from "@/components/ui/activity-bar";
import { WorkspaceManagerProvider, useWorkspaceManager } from "@/contexts/WorkspaceManagerContext";
import { RigorousResearchProvider } from "@/contexts/RigorousResearchContext";

function MainApp() {
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(true); // Vue Canvas active par défaut (interactif)
  const { activeDocumentId, setActiveDocumentId, updateNodeData, nodes } = useCanvas();
  const { currentView } = useWorkspaceManager();

  // La sidebar IDE ne s'affiche que si un nœud code est actif en mode canvas
  const activeNode = nodes.find(n => n.id === activeDocumentId);
  const isCodeMode = isCanvasOpen && activeNode?.data?.category === 'code';

  return (
      <main className="flex h-screen w-full overflow-hidden bg-[#1e1e1e] text-white font-sans">

      {/* COUCHE 1 : COQUILLE IDE — Activity Bar + Sidebar (uniquement en mode code) */}
      {isCodeMode && (
        <>
          <ActivityBar isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        </>
      )}

      {/* COUCHE 2 : LE CANVAS SPATIAL & VUE FENÊTRES */}
      <div className="relative flex-1 h-full overflow-hidden">
          <div className="animated-bg" />

          {/* BACKGROUND CANVAS (Visible uniquement en mode Canvas) */}
          <div className={cn(
            "absolute inset-0 z-10 transition-opacity duration-500",
            isCanvasOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}>
            <SpatialCanvas onEnterNode={() => {}} />
          </div>

          {/* BOUTON PILULE SPATIALE VISION OS : Bascule Vue Canvas Topologique / Focus Fenêtre */}
          <div className="absolute top-6 right-6 z-50 pointer-events-auto flex items-center gap-3">
              <button
                  type="button"
                  onClick={() => {
                    setIsCanvasOpen(prev => !prev);
                    if (isCanvasOpen) setActiveDocumentId(null);
                  }}
                  title={isCanvasOpen ? "Basculer en Mode Focus Fenêtre Spatiale" : "Basculer en Vue Canvas Topologique"}
                  className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all border shadow-2xl backdrop-blur-2xl font-sans",
                      isCanvasOpen
                          ? "bg-neutral-950/70 text-cyan-300 hover:text-white border-cyan-500/30 hover:border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                          : "bg-neutral-950/70 text-purple-300 hover:text-white border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                  )}
              >
                  <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isCanvasOpen ? "bg-cyan-400" : "bg-purple-400")} />
                  <span>{isCanvasOpen ? "🌌 Canvas Topologique" : "🪟 Focus Fenêtre Spatiale"}</span>
              </button>
          </div>

          {/* OVERLAY PLEIN ÉCRAN NOEUD / IMAGE ACTIF (Style Lightbox Fullscreen & Notion / Claude AI) */}
          {activeDocumentId && (() => {
            const activeNode = nodes.find(n => n.id === activeDocumentId);
            if (!activeNode) return null;

            const isImg = activeNode.data?.category === 'image' || !!activeNode.data?.imageUrl;
            const imgSrc = activeNode.data?.imageUrl || (Array.isArray(activeNode.data?.documentData) && activeNode.data.documentData.find((b: any) => b.type === 'image')?.props?.url);

            if (isImg && imgSrc) {
              return (
                <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 pointer-events-auto animate-in zoom-in-95 duration-300">
                  {/* Header d'actions et fermeture */}
                  <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-mono text-xs font-semibold text-neutral-300 tracking-wider">
                        {activeNode.data?.label || "Image VCE HD"}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveDocumentId(null)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/10 backdrop-blur-md flex items-center gap-2 shadow-2xl hover:scale-105"
                      title="Fermer le plein écran"
                    >
                      <span>✕</span>
                      <span>Fermer le Plein Écran</span>
                    </button>
                  </div>

                  {/* Visualiseur d'image en plein écran HD */}
                  <div className="relative w-full h-full flex items-center justify-center p-8">
                    <img
                      src={imgSrc}
                      alt={(activeNode.data?.label as string) || "Image plein écran"}
                      className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] transition-all"
                    />
                  </div>
                </div>
              );
            }

            if (activeNode.data?.isDocument || activeNode.data?.documentData) {
              return (
                <div className="fixed inset-0 z-[100] bg-[#1e1e1e] flex flex-col pointer-events-auto animate-in fade-in duration-300">
                    <DocumentEditor
                        nodeId={activeDocumentId}
                        initialTitle={(activeNode.data?.label as string) || "Sans titre"}
                        initialData={(activeNode.data?.documentData as any[]) || []}
                        onClose={() => setActiveDocumentId(null)}
                        onSave={(title, content) => {
                            updateNodeData(activeDocumentId, { label: title, documentData: content });
                        }}
                        mode="canvas-focus"
                    />
                </div>
              );
            }

            return null;
          })()}

      </div>
      </main>
  );
}

export default function Home() {
  return (
    <CanvasProvider>
      <WorkspaceManagerProvider>
        <RigorousResearchProvider>
          <MainApp />
        </RigorousResearchProvider>
      </WorkspaceManagerProvider>
    </CanvasProvider>
  );
}
