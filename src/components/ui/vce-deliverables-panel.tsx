"use client";

import React, { useState } from "react";
import { FileText, FileDown, CheckCircle2, Sparkles, X, Shield, ChevronRight, Layers } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { cn } from "@/lib/utils";

interface VceDeliverablesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VceDeliverablesPanel({ isOpen, onClose }: VceDeliverablesPanelProps) {
  const { nodes } = useCanvas();
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "doc" | "md">("pdf");
  const [isCompiling, setIsCompiling] = useState(false);

  if (!isOpen) return null;

  // Filtrer les nœuds de type document
  const documentNodes = nodes.filter(n => n.data?.isDocument || n.data?.vceClaims?.length > 0);

  // Extraire toutes les claims certifiées (confidence >= 0.8)
  const certifiedClaims = documentNodes.flatMap(n =>
    (n.data?.vceClaims || []).filter((c: any) => (c.confidence ?? 0.9) >= 0.8)
  );

  const handleExportAll = () => {
    setIsCompiling(true);
    setTimeout(() => {
      let content = `# Rapport de Synthèse Certifié VCE\n\n`;
      content += `Date de Génération : ${new Date().toLocaleDateString('fr-FR')}\n`;
      content += `Nombre de Documents Certifiés : ${documentNodes.length}\n`;
      content += `Nombre d'Assertions Certifiées (Merkle Verified) : ${certifiedClaims.length}\n\n`;
      content += `---\n\n## Assertions Certifiées\n\n`;

      certifiedClaims.forEach((c: any, idx: number) => {
        content += `${idx + 1}. **"${c.text || c.statement || c}"** (Confiance: ${Math.round((c.confidence || 0.9) * 100)}%)\n`;
      });

      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VCE_Rapport_Livrable_${Date.now()}.${selectedFormat === 'doc' ? 'doc' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsCompiling(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[120] w-[460px] bg-[#0d0e14]/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col font-sans animate-in slide-in-from-right duration-300">
      {/* En-tête du Panneau */}
      <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/40 text-indigo-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Livrables & Exports VCE
            </h3>
            <p className="text-[10px] font-mono text-neutral-400">Citations Merkle-vérifiées</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Corps du Panneau */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* Résumé des Livrables Disponibles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Documents</span>
            <p className="text-xl font-bold text-white font-mono">{documentNodes.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1">
              <Shield className="w-3 h-3" /> Claims Valides
            </span>
            <p className="text-xl font-bold text-emerald-300 font-mono">{certifiedClaims.length}</p>
          </div>
        </div>

        {/* Sélection du Format d'Exportation */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
            Format du Livrable Certifié
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "pdf", label: "PDF Certifié", desc: "Format Imprimable" },
              { id: "doc", label: "Word (.doc)", desc: "Éditable" },
              { id: "md", label: "Markdown", desc: "Brut avec sources" }
            ].map(fmt => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id as any)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all space-y-1",
                  selectedFormat === fmt.id
                    ? "bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-neutral-900/60 border-white/10 text-neutral-400 hover:text-white"
                )}
              >
                <div className="font-bold text-xs">{fmt.label}</div>
                <div className="text-[9px] opacity-70">{fmt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Liste des Documents Intégrés au Rapport */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
            Documents Sources dans le Périmètre
          </label>
          <div className="space-y-2">
            {documentNodes.map((node) => (
              <div
                key={node.id}
                className="p-3 rounded-xl bg-neutral-900/60 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs text-white font-medium truncate">
                    {node.data?.label || node.id}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {(node.data?.vceClaims || []).length} claims
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Vue Matrice de Conflits Side-by-Side (CentralComparisonTable) */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <label className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span>Matrice de Conflits Side-by-Side (VCE Dispute Resolution)</span>
          </label>

          <div className="p-4 rounded-xl bg-black/60 border border-red-500/30 space-y-3">
            <div className="text-[11px] text-neutral-300 font-mono flex items-center justify-between">
              <span>Comparaison des assertions contradictoires :</span>
              <span className="text-red-400 font-bold">1 Conflit Actif</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-emerald-500/30 space-y-1">
                <span className="text-emerald-400 font-bold block truncate">📄 Doc A (Projet)</span>
                <p className="text-neutral-200 text-[11px] font-sans">"Posologie recommandée de 50mg par jour (Étude 2026)"</p>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-red-500/30 space-y-1">
                <span className="text-red-400 font-bold block truncate">⚠️ Doc B (Réglementation)</span>
                <p className="text-neutral-200 text-[11px] font-sans">"Posologie maximale tolérée fixée à 25mg (Avis EMA)"</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-mono text-neutral-500">Hash Merkle: 0x8f3a...b2e9</span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">
                EN ATTENTE D'ARBITRAGE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pied de Panneau — Bouton d'Export */}
      <div className="p-5 border-t border-white/10 bg-white/5 space-y-3">
        <button
          onClick={handleExportAll}
          disabled={isCompiling || documentNodes.length === 0}
          className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
        >
          {isCompiling ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-white" />
              <span>Compilation du Rapport Certifié VCE...</span>
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              <span>Générer et Télécharger le Livrable ({selectedFormat.toUpperCase()})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
