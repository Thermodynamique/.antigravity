"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, ExternalLink, X, ArrowRight, Layers, FileCode, FileText } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { cn } from "@/lib/utils";

interface VceGlobalConflictHubProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConflictNodes?: (sourceNodeId: string, targetNodeId: string) => void;
}

export function VceGlobalConflictHub({ isOpen, onClose, onSelectConflictNodes }: VceGlobalConflictHubProps) {
  const { nodes } = useCanvas();

  if (!isOpen) return null;

  // Extraire toutes les contradictions croisées du workspace
  const documentNodes = nodes.filter(n => n.data?.isDocument || n.data?.hasContradictions);

  // Exemple de conflits synthétisés du workspace
  const mockWorkspaceConflicts = [
    {
      id: "conflict-1",
      severity: "CRITICAL",
      title: "Incompatibilité de Posologie Médicamenteuse",
      sourceA: { id: "doc-sanofi-1", name: "Sanofi Clinical Trial Protocol 2026", claim: "Posologie recommandée fixée à 50mg/jour" },
      sourceB: { id: "doc-ema-fda", name: "Directives Réglementaires EMA/FDA 2026", claim: "Seuil maximal de sécurité toléré fixé à 25mg/jour" },
      status: "UNRESOLVED",
      merkleProof: "0x8f3a9d2c...e4b1"
    },
    {
      id: "conflict-2",
      severity: "WARNING",
      title: "Divergence de Limite de Taux d'API Stripe",
      sourceA: { id: "code-stripe-client", name: "stripe_client.py", claim: "MAX_RETRIES = 10 (Rate limit delay 50ms)" },
      sourceB: { id: "doc-stripe-spec", name: "Stripe Enterprise Service SLA", claim: "Maximum 3 retries autorisés sous peine de ban IP" },
      status: "IN_REVIEW",
      merkleProof: "0x3c7b1a4f...99d2"
    }
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-[140] w-[500px] bg-[#090a0f]/95 backdrop-blur-3xl border-l border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.2)] flex flex-col font-sans animate-in slide-in-from-right duration-300">
      {/* En-tête du Hub Global */}
      <div className="flex items-center justify-between p-5 border-b border-red-500/20 bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-950">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 tracking-wide">
              Workspace Global Conflict Hub
            </h3>
            <p className="text-[10px] font-mono text-red-300/80">Toile multi-sources de contradictions VCE</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Corps du Hub */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-200/90 leading-relaxed font-sans">
          ⚠️ Le moteur bi-temporel VCE a identifié <strong className="text-white font-bold">{mockWorkspaceConflicts.length} contradictions majeures</strong> entre vos spécifications, documents d'essai et scripts de code.
        </div>

        <div className="space-y-4">
          {mockWorkspaceConflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="p-4 rounded-2xl bg-neutral-900/80 border border-red-500/30 space-y-3 hover:border-red-500/60 transition-all shadow-xl group"
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border",
                  conflict.severity === "CRITICAL" ? "bg-red-950 text-red-300 border-red-500/50" : "bg-amber-950 text-amber-300 border-amber-500/50"
                )}>
                  {conflict.severity} CONFLICT
                </span>
                <span className="text-[9px] font-mono text-neutral-500">
                  Merkle: {conflict.merkleProof}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                {conflict.title}
              </h4>

              {/* Comparaison des 2 sources */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3 h-3 text-emerald-400" />
                      {conflict.sourceA.name}
                    </span>
                    <span>SOURCE A</span>
                  </div>
                  <p className="text-[11px] text-neutral-200 font-sans italic">"{conflict.sourceA.claim}"</p>
                </div>

                <div className="p-2.5 rounded-xl bg-black/50 border border-red-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-red-400 font-bold">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileCode className="w-3 h-3 text-red-400" />
                      {conflict.sourceB.name}
                    </span>
                    <span>SOURCE B (OPPOSÉE)</span>
                  </div>
                  <p className="text-[11px] text-neutral-200 font-sans italic">"{conflict.sourceB.claim}"</p>
                </div>
              </div>

              <button
                onClick={() => onSelectConflictNodes?.(conflict.sourceA.id, conflict.sourceB.id)}
                className="w-full py-2 px-3 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 font-bold text-[11px] transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-red-600/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Isoler les 2 Nœuds en Conflit sur le Canvas</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
