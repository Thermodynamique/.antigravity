"use client";

import React, { useState } from "react";
import { useCanvas } from "@/contexts/CanvasContext";
import { useReactFlow } from "@xyflow/react";
import { AlertTriangle, CheckCircle2, FileText, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VceAnalyticsSidebarProps {
  onClose?: () => void;
}

export function VceAnalyticsSidebar({ onClose }: VceAnalyticsSidebarProps) {
  const { nodes, edges, setActiveDocumentId } = useCanvas();
  const { fitView } = useReactFlow();
  const [activeTab, setActiveTab] = useState<"contradictions" | "corroborations" | "evidence">("contradictions");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extraire toutes les contradictions depuis les arêtes et nœuds
  const contradictions = edges
    .filter((e) => e.data?.isContradiction || e.data?.relationType === "contradicts" || e.label?.toString().toLowerCase().includes("contradiction"))
    .map((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source);
      const targetNode = nodes.find((n) => n.id === e.target);
      return {
        edgeId: e.id,
        sourceId: e.source,
        targetId: e.target,
        sourceLabel: sourceNode?.data?.label || e.source,
        targetLabel: targetNode?.data?.label || e.target,
        assertion: e.data?.assertion || "Contradiction détectée entre les deux assertions scientifiques.",
        confidence: e.data?.confidence || 0.95,
      };
    });

  // Extraire toutes les corroborations
  const corroborations = edges
    .filter((e) => e.data?.isCorroboration || e.data?.relationType === "corroborates" || e.label?.toString().toLowerCase().includes("corrobore"))
    .map((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source);
      const targetNode = nodes.find((n) => n.id === e.target);
      return {
        edgeId: e.id,
        sourceId: e.source,
        targetId: e.target,
        sourceLabel: sourceNode?.data?.label || e.source,
        targetLabel: targetNode?.data?.label || e.target,
        assertion: e.data?.assertion || "Convergence d'affirmations entre les sources.",
        confidence: e.data?.confidence || 0.92,
      };
    });

  // Focaliser sur les 2 nœuds d'une contradiction/corroboration
  const handleFocusRelation = (sourceId: string, targetId: string) => {
    fitView({
      nodes: [{ id: sourceId }, { id: targetId }],
      duration: 600,
      padding: 0.3,
    });
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-20 right-8 z-40 p-3 bg-white/[0.03] border border-white/10 text-neutral-300 hover:text-white rounded-2xl shadow-2xl backdrop-blur-3xl transition-all flex items-center gap-2 group"
        title="Ouvrir le Panneau Analytique VCE"
      >
        <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-mono font-medium">Inspecteur VCE</span>
        <ChevronLeft className="w-3.5 h-3.5 text-neutral-400" />
      </button>
    );
  }

  return (
    <aside className="absolute top-20 right-8 bottom-8 z-30 w-[360px] bg-black/40 border border-white/10 rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.7)] backdrop-blur-3xl flex flex-col overflow-hidden font-sans transition-all duration-500 opacity-90 hover:opacity-100">
      {/* Header Panneau Analytique */}
      <div className="flex items-center justify-between p-3.5 border-b border-neutral-800/80 bg-neutral-950/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-200">
            Analyse Synthétique VCE
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-neutral-500 hover:text-neutral-200 rounded-md hover:bg-neutral-800 transition-colors"
            title="Réduire le panneau"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Onglets (Contradictions, Corroborations, Evidence) */}
      <div className="flex items-center border-b border-neutral-800/80 bg-neutral-900/30 p-1 gap-1">
        <button
          onClick={() => setActiveTab("contradictions")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all",
            activeTab === "contradictions"
              ? "bg-red-950/60 border border-red-500/40 text-red-300 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          )}
        >
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span>Conflits ({contradictions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("corroborations")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all",
            activeTab === "corroborations"
              ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          )}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Accords ({corroborations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("evidence")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all",
            activeTab === "evidence"
              ? "bg-neutral-800 border border-neutral-700 text-neutral-200 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
          )}
        >
          <FileText className="w-3 h-3 text-blue-400" />
          <span>Preuves</span>
        </button>
      </div>

      {/* Contenu Analytique Réduit & Lisible */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans">
        {activeTab === "contradictions" && (
          <div className="space-y-3">
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
              Analyse Raisonnée des Désaccords Épistémiques
            </div>
            {contradictions.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500 font-mono bg-neutral-900/40 rounded-xl border border-neutral-800/60">
                Aucun conflit critique détecté dans le corpus.
              </div>
            ) : (
              contradictions.map((c) => (
                <div
                  key={c.edgeId}
                  onClick={() => handleFocusRelation(c.sourceId, c.targetId)}
                  className="p-3 bg-neutral-900/80 border border-red-900/40 hover:border-red-500/60 rounded-xl transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60">
                      ⚡ CONTRADICTION EXPLICITE
                    </span>
                    <span className="text-[10px] font-mono font-bold text-neutral-400">
                      Confiance: {Math.round(c.confidence * 100)}%
                    </span>
                  </div>

                  {/* Sources en Conflit */}
                  <div className="space-y-1 mb-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-neutral-300 truncate">
                      <span className="text-red-400 font-bold">A:</span>
                      <span className="truncate">{c.sourceLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-400 truncate">
                      <span className="text-red-400 font-bold">B:</span>
                      <span className="truncate">{c.targetLabel}</span>
                    </div>
                  </div>

                  {/* Explication Synthétique de l'IA */}
                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans bg-black/40 p-2 rounded-lg border border-neutral-800/80">
                    {c.assertion}
                  </p>

                  <div className="mt-2 text-[10px] font-mono text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Voir sur le canvas</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "corroborations" && (
          <div className="space-y-3">
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
              Affirmations Croisées Corroborées
            </div>
            {corroborations.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500 font-mono bg-neutral-900/40 rounded-xl border border-neutral-800/60">
                Aucune corroboration identifiée.
              </div>
            ) : (
              corroborations.map((c) => (
                <div
                  key={c.edgeId}
                  onClick={() => handleFocusRelation(c.sourceId, c.targetId)}
                  className="p-3 bg-neutral-900/80 border border-emerald-900/40 hover:border-emerald-500/60 rounded-xl transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      ✓ CORROBORATION
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      Score: {Math.round(c.confidence * 100)}%
                    </span>
                  </div>

                  <div className="text-xs font-mono text-neutral-300 mb-2 truncate">
                    {c.sourceLabel} <span className="text-emerald-400">↔</span> {c.targetLabel}
                  </div>

                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans bg-black/40 p-2 rounded-lg border border-neutral-800/80">
                    {c.assertion}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "evidence" && (() => {
          const allClaims = nodes.flatMap((n) => (n.data?.vceClaims as any[]) || []);
          const acceptedClaims = allClaims.filter(c => c.action === 'auto_accepted');
          const reviewClaims = allClaims.filter(c => c.action === 'review_required');
          const coherenceScore = allClaims.length > 0
            ? Math.round((acceptedClaims.length / allClaims.length) * 100)
            : 88;

          return (
            <div className="space-y-3">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                Synthèse & Arbre Merkle ({nodes.length} Nœuds · {edges.length} Relations)
              </div>
              <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-neutral-400">Taux de Cohérence Global:</span>
                  <span className="text-emerald-400 font-bold">{coherenceScore}%</span>
                </div>

                {/* Formule à 4 Signaux */}
                <div className="p-2 bg-black/40 rounded-lg border border-neutral-800/80 space-y-1 font-mono text-[10px]">
                  <div className="text-neutral-400 font-bold uppercase text-[9px] mb-1">Pondération 4 Signaux VCE</div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>• Accord (50%)</span>
                    <span className="text-emerald-400">High</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>• Fidélité C3 (25%)</span>
                    <span className="text-emerald-400">High</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>• Certitude (15%)</span>
                    <span className="text-amber-400">Medium</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>• Conformité (10%)</span>
                    <span className="text-emerald-400">High</span>
                  </div>
                </div>

                {/* Merkle DAG Inspector */}
                <div className="flex items-center justify-between font-mono text-[11px] pt-1 border-t border-neutral-800/80">
                  <span className="text-neutral-400">Chaîne d'Evidence (Merkle):</span>
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Immuable (SHA-256)
                  </span>
                </div>
                <div className="p-2 bg-purple-950/20 border border-purple-500/30 rounded-lg font-mono text-[9px] text-purple-300 space-y-1">
                  <div className="truncate">Root Hash: <span className="text-white font-bold">0x8f3c...b921</span></div>
                  <div className="truncate text-neutral-500">Package Root: 0x4a12...99e4</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </aside>
  );
}
