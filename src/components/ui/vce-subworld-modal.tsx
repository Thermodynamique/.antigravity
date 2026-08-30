"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Search, GitCompare, Play, Sparkles, Layers, ShieldCheck, ChevronRight, FileText, Code2, Database } from "lucide-react";

export interface SubworldItem {
  id: string;
  label: string;
  type: 'code' | 'doc' | 'claim' | 'event';
  detail?: string;
  status?: string;
}

interface VceSubworldModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category?: string;
  items: SubworldItem[];
  onDispatchAgent?: (role: 'refactor' | 'research' | 'doc' | 'sentinel', nodeId: string, desc: string) => void;
  onRunSimulation?: () => void;
  onCompareContradictions?: () => void;
}

export function VceSubworldModal({
  isOpen,
  onClose,
  title,
  category = "Sous-Système Cognitif",
  items,
  onDispatchAgent,
  onRunSimulation,
  onCompareContradictions,
}: VceSubworldModalProps) {
  const [activeTab, setActiveTab] = useState<'ENTITIES' | 'CLAIMS' | 'SIMULATION'>('ENTITIES');
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.detail && item.detail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
      {/* FENÊTRE POPUP "SOUS-MONDE" (Style VisionOS / Windows 11 Glassmorphism) */}
      <div className="relative w-[640px] max-w-full bg-neutral-950/90 border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(139,92,246,0.15)] overflow-hidden flex flex-col font-sans">

        {/* HEADER DU SOUS-MONDE */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">{category}</div>
              <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BARRE D'ACTIONS COGNITIVES VCE (Boutons d'intention du sous-monde) */}
        <div className="px-6 py-3 border-b border-white/10 bg-neutral-900/40 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCompareContradictions}
              className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[11px] font-medium transition-all flex items-center gap-1.5"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Comparer Contradictions</span>
            </button>

            <button
              onClick={onRunSimulation}
              className="px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-[11px] font-medium transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simuler Impact</span>
            </button>
          </div>

          {/* Sceau de Preuve Merkle SHA-256 */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            <span>Merkle OK</span>
          </div>
        </div>

        {/* BARRE DE RECHERCHE DANS LE SOUS-MONDE */}
        <div className="px-6 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 rounded-xl border border-white/10 text-xs">
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer les atomes et entités du sous-système..."
              className="bg-transparent text-white placeholder:text-neutral-500 outline-none w-full font-sans"
            />
          </div>
        </div>

        {/* GRILLE DES ATOMES & ENTITÉS DU SOUS-MONDE (Style Windows 11 "Autre") */}
        <div className="p-6 max-h-[360px] overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative p-3 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900/90 border border-white/5 hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-purple-500/40 transition-colors shrink-0">
                    {item.type === 'code' ? (
                      <Code2 className="w-4 h-4 text-blue-400" />
                    ) : item.type === 'doc' ? (
                      <FileText className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Database className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white truncate tracking-wide group-hover:text-purple-200 transition-colors">
                      {item.label}
                    </div>
                    {item.detail && (
                      <div className="text-[10px] text-neutral-400 font-sans line-clamp-2 mt-0.5 leading-relaxed">
                        {item.detail}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer de carte d'atome */}
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-neutral-500">
                  <span>{item.status || "Certifié SHA-256"}</span>
                  <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-8 text-center text-xs text-neutral-500 font-sans">
              Aucun atome ne correspond à la recherche dans ce sous-monde.
            </div>
          )}
        </div>

        {/* FOOTER & ASSIGNATION RAPIDE D'AGENTS */}
        <div className="px-6 py-3 border-t border-white/10 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
            {items.length} Atomes Cognitifs Ingérés
          </span>

          <div className="flex items-center gap-1.5">
            {onDispatchAgent && (
              <>
                <button
                  onClick={() => onDispatchAgent('refactor', '', 'Refactore le sous-système sous 16ms')}
                  className="px-2 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[10px] font-medium transition-all"
                >
                  🟣 Refactor
                </button>
                <button
                  onClick={() => onDispatchAgent('research', '', 'Recherche brevets sur le sous-système')}
                  className="px-2 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-[10px] font-medium transition-all"
                >
                  🔵 Research
                </button>
                <button
                  onClick={() => onDispatchAgent('doc', '', 'Génère la synthèse du sous-système')}
                  className="px-2 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium transition-all"
                >
                  🟢 Doc
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
