"use client";

import React, { useState } from "react";
import { Clock, ShieldCheck, ChevronRight, History, Sparkles, Activity, Layers, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorldStateEvent {
  id: string;
  step: string; // e.g., 'W(t0)', 'W(t1)', 'W(t2)'
  timestamp: string;
  title: string;
  domain: string;
  description: string;
  status: 'active' | 'historical' | 'simulated';
}

interface PersistentWorldModelBarProps {
  onSelectEvent?: (event: WorldStateEvent) => void;
}

export function PersistentWorldModelBar({ onSelectEvent }: PersistentWorldModelBarProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(2);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  const events: WorldStateEvent[] = [
    {
      id: "evt_t0",
      step: "W(t0)",
      timestamp: "10:00:00",
      title: "Initialisation du Monde VCE",
      domain: "Société / Produit",
      description: "Ingestion initiale du corpus & scellement cryptographique SHA-256.",
      status: "historical"
    },
    {
      id: "evt_t1",
      step: "W(t1)",
      timestamp: "10:14:30",
      title: "Ingestion AST & Signaux CVI",
      domain: "R&D / Code",
      description: "Détection de 3 dépendances et résolution automatique des incohérences.",
      status: "historical"
    },
    {
      id: "evt_t2",
      step: "W(t2)",
      timestamp: "Maintenant",
      title: "Modèle Vivant Actuel",
      domain: "Vue Multi-Secteurs",
      description: "État persistant courant. 15 sous-systèmes actifs synchronisés P2P.",
      status: "active"
    },
    {
      id: "evt_t3",
      step: "W(t3)",
      timestamp: "+15 min (Proj)",
      title: "Projection Scénario Futurs",
      domain: "Simulation",
      description: "Simulation d'impact tarifaire et prévision des embauches.",
      status: "simulated"
    }
  ];

  const currentEvent = events[activeStepIndex];

  return (
    <div className="absolute top-20 left-6 z-40 pointer-events-auto flex flex-col gap-2 font-sans max-w-lg">
      {/* HEADER DU MODÈLE DE MONDE PERSISTANT */}
      <div className="flex items-center gap-3 px-4 py-2 bg-neutral-950/80 backdrop-blur-2xl border border-purple-500/30 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-white tracking-wide">ÉVOLUTIONS 1 & 2 : Persistent World Model</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 font-mono text-[9px] text-purple-300 font-bold">
            {currentEvent.step}
          </span>
        </div>
      </div>

      {/* TIMELINE INTERACTIVE DU MODÈLE VIVANT */}
      <div className="p-3.5 bg-neutral-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400 font-mono flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-purple-400" />
            Trajectoire Temporelle de l'État :
          </span>
          <button
            onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[10px] font-mono transition-all"
          >
            {isPlayingTimeline ? <RotateCcw className="w-3 h-3 text-purple-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            <span>{isPlayingTimeline ? "Rejeu Actif" : "Rejouer État"}</span>
          </button>
        </div>

        {/* BARRE DES ÉTAPES DE TEMPS */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/50 border border-white/5 rounded-2xl">
          {events.map((evt, idx) => {
            const isActive = idx === activeStepIndex;
            return (
              <button
                key={evt.id}
                onClick={() => {
                  setActiveStepIndex(idx);
                  if (onSelectEvent) onSelectEvent(evt);
                }}
                className={cn(
                  "py-1.5 px-2 rounded-xl text-center transition-all flex flex-col items-center gap-0.5",
                  isActive
                    ? "bg-purple-600/30 border border-purple-400 text-purple-200 shadow-md"
                    : "hover:bg-white/5 border border-transparent text-neutral-500 hover:text-neutral-300"
                )}
              >
                <span className="font-mono text-[10px] font-bold">{evt.step}</span>
                <span className="text-[9px] truncate w-full">{evt.timestamp}</span>
              </button>
            );
          })}
        </div>

        {/* DETAILS DE L'ÉVENT ÉTAPE SÉLECTIONNÉ */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              {currentEvent.title}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">
              {currentEvent.domain}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
            {currentEvent.description}
          </p>
        </div>

        {/* DOMAINES DU MODÈLE VIVANT (COMPANY DECOMPOSITION) */}
        <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span>Domaines vivants :</span>
          <div className="flex gap-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">Clients</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">Produits</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">Finance</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">Opérations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
