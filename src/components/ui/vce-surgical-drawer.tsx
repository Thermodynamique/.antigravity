"use client";

import React, { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, Copy, ArrowRight, X, Sparkles, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface VceSurgicalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  atomData: {
    atomId: string;
    title: string;
    content: string;
    confidence: number;
    domain: string;
    claims: any[];
  } | null;
  onInjectClaim?: (claimText: string) => void;
}

export function VceSurgicalDrawer({ isOpen, onClose, atomData, onInjectClaim }: VceSurgicalDrawerProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen || !atomData) return null;

  const isHighConfidence = atomData.confidence >= 0.8;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[120] w-[420px] bg-[#0d0e14]/90 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col font-sans animate-in slide-in-from-right duration-300">
      {/* En-tête du Tiroir */}
      <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Édition Chirurgicale VCE
            </h3>
            <p className="text-[10px] font-mono text-neutral-400">Atome ID: {atomData.atomId}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Corps avec défilement */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Banner Confiance / Statut Épistémique */}
        <div className={cn(
          "p-4 rounded-xl border flex items-start gap-3 text-xs font-sans",
          isHighConfidence
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
            : "bg-amber-950/40 border-amber-500/40 text-amber-200"
        )}>
          {isHighConfidence ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block mb-0.5">
              {isHighConfidence ? "Atome Validé (Confiance Élevée)" : "Révision Bi-temporelle Requise"}
            </span>
            <p className="text-[11px] opacity-80 leading-relaxed">
              {isHighConfidence
                ? `Score de confiance de ${Math.round(atomData.confidence * 100)}% calculé par le Claims Graph VCE.`
                : "Cet atome contient des assertions modifiées. Une révision humaine est conseillée avant export."}
            </p>
          </div>
        </div>

        {/* Aperçu du Contenu Source Extrait */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            Extrait Source Brute
          </label>
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-neutral-300 leading-relaxed max-h-[160px] overflow-y-auto">
            {atomData.content}
          </div>
        </div>

        {/* Liste des Assertions / Claims Extraites */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Assertions Structurées ({atomData.claims?.length || 0})
          </label>

          <div className="space-y-2.5">
            {atomData.claims?.map((claim, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 hover:border-indigo-500/40 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-indigo-400 font-bold">Claim #{idx + 1}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                    {Math.round((claim.confidence || atomData.confidence) * 100)}% Confiance
                  </span>
                </div>
                <p className="text-xs text-white font-medium leading-relaxed">
                  "{claim.text || claim.statement || claim}"
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleCopy(claim.text || claim.statement || claim, idx)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-neutral-300 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedIndex === idx ? "Copié !" : "Copier"}
                  </button>
                  {onInjectClaim && (
                    <button
                      onClick={() => onInjectClaim(claim.text || claim.statement || claim)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-mono font-bold text-white transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/30"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Injecter dans le Doc
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
