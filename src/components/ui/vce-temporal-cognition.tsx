"use client";

import React, { useState } from "react";
import { Clock, Play, RotateCcw, ArrowRight, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function VceTemporalCognition() {
  const [activeTemporalPhase, setActiveTemporalPhase] = useState<'PAST' | 'CURRENT' | 'FUTURE'>('CURRENT');

  return (
    <div className="flex items-center gap-1.5 p-1 bg-neutral-950/80 backdrop-blur-2xl border border-white/10 rounded-full text-xs font-sans shadow-lg">
      <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-purple-400 flex items-center gap-1">
        <Clock className="w-3 h-3 text-purple-400" />
        <span>ÉVOLUTION 3 : TEMPS COGNITIF</span>
      </div>

      <button
        onClick={() => setActiveTemporalPhase('PAST')}
        className={cn(
          "px-3 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 font-mono",
          activeTemporalPhase === 'PAST'
            ? "bg-amber-600/40 text-amber-200 border border-amber-500/50"
            : "text-neutral-400 hover:text-white hover:bg-white/5"
        )}
      >
        <span>⏮️ PASSE (Rejeu)</span>
      </button>

      <button
        onClick={() => setActiveTemporalPhase('CURRENT')}
        className={cn(
          "px-3 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 font-mono",
          activeTemporalPhase === 'CURRENT'
            ? "bg-emerald-600/40 text-emerald-200 border border-emerald-500/50"
            : "text-neutral-400 hover:text-white hover:bg-white/5"
        )}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>ACTUEL ($W(t_2)$)</span>
      </button>

      <button
        onClick={() => setActiveTemporalPhase('FUTURE')}
        className={cn(
          "px-3 py-1 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 font-mono",
          activeTemporalPhase === 'FUTURE'
            ? "bg-purple-600/40 text-purple-200 border border-purple-500/50"
            : "text-neutral-400 hover:text-white hover:bg-white/5"
        )}
      >
        <span>🔮 FUTURS PROBABLES</span>
      </button>
    </div>
  );
}
