"use client";

import React from "react";
import { Layers, GitBranch, ExternalLink, X, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpatialBranchWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  claimText: string;
  sourceDocTitle?: string;
  onDetachAsBranchNode?: () => void;
}

export function SpatialBranchWindow({
  isOpen,
  onClose,
  title,
  claimText,
  sourceDocTitle = "Sanofi Clinical Trial Protocol 2026",
  onDetachAsBranchNode
}: SpatialBranchWindowProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-24 right-16 z-[130] w-[420px] bg-[#0c0d14]/90 backdrop-blur-3xl border border-indigo-500/40 rounded-3xl shadow-[0_20px_60px_rgba(99,102,241,0.25)] p-5 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 font-sans">
      {/* En-tête spatial */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-indigo-300 font-bold uppercase tracking-wider block">
              SPATIAL LIFT & BRANCHING
            </span>
            <h4 className="text-xs font-bold text-white">{title}</h4>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contenu de la claim surélevée */}
      <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span>SOURCE ORIGINE</span>
          <span className="text-indigo-400 font-bold">{sourceDocTitle}</span>
        </div>
        <p className="text-xs text-neutral-100 italic leading-relaxed">
          "{claimText}"
        </p>
      </div>

      {/* Actions Spatiales */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <button
          onClick={onDetachAsBranchNode}
          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Détacher en Sous-Nœud "Branche"</span>
        </button>
      </div>
    </div>
  );
}
