"use client";

import React from "react";
import { X, Network, RefreshCw, Cpu, Database, Activity, ShieldCheck, Zap } from "lucide-react";

interface VceDigitalTwinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VceDigitalTwinModal({ isOpen, onClose }: VceDigitalTwinModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[13000] flex items-center justify-center p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 pointer-events-auto font-sans">
      <div className="w-full max-w-5xl bg-[#090a10] border border-cyan-500/40 rounded-3xl shadow-[0_25px_80px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden max-h-[85vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-cyan-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Network className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">ÉVOLUTIONS 14, 15 & 16 — VCE WORLD ENGINE</div>
              <h2 className="text-base font-bold text-white tracking-wide">Cognitive Digital Twin de l'Organisation</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">

          {/* CARTOGRAPHIE DES DÉPARTEMENTS ET DES IMPACTS CROISÉS */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-cyan-300 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Cartographie des Départements et Flux Causaux :
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-cyan-400" />
                    Département Finance
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">100% Synchro</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Flux de trésorerie réel scellé Merkle. Impact direct sur le budget de recrutement R&D.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    Ingénierie R&D
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">AST Engine</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  15 atomes de code en production synchronisés avec le graphe causal VCE.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-400" />
                    Stratégie & IP
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">Research Loop</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Analyse d'antériorités de brevets et vérification automatique CVI en continu.
                </p>
              </div>
            </div>
          </div>

          {/* BOUCLE D'INVESTIGATION AUTONOME (ÉVOLUTION 15) */}
          <div className="p-5 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                Évol. 15 : Boucle d'Investigation Autonome Active
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Seuil CVI Atteint : 98.4%</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <div className="text-[9px] text-neutral-400">1. QUESTION</div>
                <div className="text-cyan-200 font-semibold truncate">Impact Hausse Prix</div>
              </div>
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <div className="text-[9px] text-neutral-400">2. HYPOTHÈSE</div>
                <div className="text-purple-200 font-semibold truncate">Demande -15%</div>
              </div>
              <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/30">
                <div className="text-[9px] text-neutral-400">3. RECHERCHE</div>
                <div className="text-blue-200 font-semibold truncate">Scan Web/Data</div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="text-[9px] text-neutral-400">4. PREUVE</div>
                <div className="text-emerald-200 font-semibold truncate">Scellé SHA-256</div>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-cyan-500/20 bg-black/80 flex items-center justify-between text-xs text-neutral-400">
          <span className="font-mono text-[10px]">Digital Twin Cognitif continuellement synchronisé avec la réalité</span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
          >
            Fermer le Jumeau Numérique
          </button>
        </div>

      </div>
    </div>
  );
}
