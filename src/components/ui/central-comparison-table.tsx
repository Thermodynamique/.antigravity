"use client";

import { X, Layers, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface ComparisonItem {
  id: string;
  title: string;
  content: string;
  provenance?: string;
  version?: string;
}

interface CentralComparisonTableProps {
  isOpen: boolean;
  onClose: () => void;
  items: ComparisonItem[];
}

export function CentralComparisonTable({ isOpen, onClose, items }: CentralComparisonTableProps) {
  if (!isOpen || items.length < 2) return null;

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 pointer-events-auto">
      <div className="w-full max-w-5xl bg-[#0d0d10] border border-neutral-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Matrice de Comparaison Structurée
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-normal">
                  {items.length} éléments
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">Analyse croisée des structures, provenances et récurrences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="py-3 px-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider w-44">
                  Critères / Dim.
                </th>
                {items.map((item, idx) => (
                  <th key={item.id} className="py-3 px-4 text-sm font-semibold text-neutral-200 min-w-[260px]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 text-xs flex items-center justify-center font-bold text-neutral-300">
                        {idx + 1}
                      </span>
                      <span className="truncate">{item.title}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-xs text-neutral-300 font-sans">

              {/* Row 1: Extrait / Contenu */}
              <tr>
                <td className="py-4 px-4 font-bold text-neutral-400 bg-neutral-900/30">
                  Contenu Analysé
                </td>
                {items.map((item) => (
                  <td key={item.id} className="py-4 px-4 leading-relaxed align-top">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 text-neutral-300">
                      <ReactMarkdown>{item.content}</ReactMarkdown>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 2: Provenance & Références */}
              <tr>
                <td className="py-4 px-4 font-bold text-neutral-400 bg-neutral-900/30">
                  Provenances & Sources
                </td>
                {items.map((item) => (
                  <td key={item.id} className="py-4 px-4 align-top">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
                      <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">{item.provenance || "Session Handy IA VCE"}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 3: Points Forts */}
              <tr>
                <td className="py-4 px-4 font-bold text-neutral-400 bg-neutral-900/30">
                  Orientation Conceptuelle
                </td>
                {items.map((item) => (
                  <td key={item.id} className="py-4 px-4 align-top">
                    <div className="flex items-start gap-2 text-emerald-400/90">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{item.content.length > 150 ? "Approche développée & structurée" : "Synthèse concise"}</span>
                    </div>
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <span>Toutes les références sont interconnectées au graphe VCE</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition-colors"
          >
            Fermer la Matrice
          </button>
        </div>

      </div>
    </div>
  );
}
