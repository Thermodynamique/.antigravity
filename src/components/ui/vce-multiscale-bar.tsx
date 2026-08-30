"use client";

import React, { useState } from "react";
import { Layers, ZoomIn, ZoomOut, Eye, Minimize2, Maximize2, ShieldCheck, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export function VceMultiscaleBar() {
  const [scaleLevel, setScaleLevel] = useState<'WORLD' | 'COMPANY' | 'PROJECT' | 'ATOM'>('COMPANY');
  const [isCompressed, setIsCompressed] = useState(false);

  return (
    <div className="flex items-center gap-2 p-1.5 bg-neutral-950/80 backdrop-blur-2xl border border-white/10 rounded-full text-xs font-sans shadow-lg">
      <div className="px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
        <Layers className="w-3.5 h-3.5" />
        <span>ÉVOLUTIONS 8 & 9 : MULTI-SCALE</span>
      </div>

      <div className="flex bg-black/50 border border-white/10 rounded-full p-0.5">
        {(['WORLD', 'COMPANY', 'PROJECT', 'ATOM'] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setScaleLevel(lvl)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all",
              scaleLevel === lvl
                ? "bg-cyan-600/40 border border-cyan-400/50 text-cyan-200"
                : "text-neutral-400 hover:text-white"
            )}
          >
            {lvl}
          </button>
        ))}
      </div>

      <button
        onClick={() => setIsCompressed(!isCompressed)}
        className={cn(
          "px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 border",
          isCompressed
            ? "bg-purple-900/50 border-purple-400 text-purple-200"
            : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
        )}
      >
        {isCompressed ? <Minimize2 className="w-3 h-3 text-purple-400" /> : <Maximize2 className="w-3 h-3 text-neutral-400" />}
        <span>{isCompressed ? "Compression 10k:1" : "Vue Détallée"}</span>
      </button>

      {/* BADGES ÉVOLUTION 11 (FEDERATION P2P) & 18 (MULTI-MODEL COLLABORATION) */}
      <div className="hidden md:flex items-center gap-1.5 border-l border-white/10 pl-2">
        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[9px] font-mono text-emerald-300 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Év.11 Fédération P2P
        </span>
        <span className="px-2 py-0.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-[9px] font-mono text-violet-300 flex items-center gap-1">
          <Cpu className="w-3 h-3 text-violet-400" />
          Év.18 Multi-Modèles
        </span>
      </div>
    </div>
  );
}
