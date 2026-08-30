"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type AgentType = "refactor" | "research" | "doc" | "sentinel";

interface ExecutiveCapsuleProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Array<{ id: string; data: { label?: string; category?: string } }>;
  onDispatchAgent: (agentType: AgentType, nodeId: string, description: string) => void;
}

export function ExecutiveCapsule({ isOpen, onClose, nodes, onDispatchAgent }: ExecutiveCapsuleProps) {
  const [prompt, setPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStepText, setActiveStepText] = useState("");
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);
    setActiveStepText("Analyse de l'intention et ciblage des atomes...");

    // Séquence organique élégante sans barres d'ingénieur
    const targetNode = nodes[0]?.id || "";

    // 1. Refactor / AST
    setTimeout(() => {
      setActiveAgent("refactor");
      setActiveStepText("🟣 Refactor AST — Harmonisation syntaxique en cours...");
      onDispatchAgent("refactor", targetNode, "Optimisation syntaxique");
    }, 1000);

    // 2. Research / Sources
    setTimeout(() => {
      setActiveAgent("research");
      setActiveStepText("🔵 Research — Corroboration des sources & antériorités...");
      onDispatchAgent("research", targetNode, "Vérification des faits");
    }, 2800);

    // 3. Sentinel / Cohérence
    setTimeout(() => {
      setActiveAgent("sentinel");
      setActiveStepText("🔴 Sentinel — Validation de l'intégrité bi-temporelle...");
      onDispatchAgent("sentinel", targetNode, "Contrôle bi-temporel");
    }, 4500);

    // 4. Clôture
    setTimeout(() => {
      setActiveAgent("doc");
      setActiveStepText("🟢 Synthèse Certifiée SHA-256 — Mission accomplie");
      onDispatchAgent("doc", targetNode, "Livrable certifié");
    }, 6000);

    setTimeout(() => {
      setIsExecuting(false);
      setActiveAgent(null);
    }, 7500);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col gap-2 p-2.5 bg-neutral-950/85 backdrop-blur-3xl border border-white/15 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(139,92,246,0.15)] w-[520px] transition-all">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-3 py-1">
          {/* Micro Orbe Pulsant */}
          <div className="relative flex items-center justify-center shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400/90 shadow-[0_0_10px_#a855f7]" />
            {isExecuting && (
              <span className="absolute w-4 h-4 rounded-full bg-purple-500/40 animate-ping" />
            )}
          </div>

          {/* Saisie Typographique Pure */}
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isExecuting}
            placeholder={isExecuting ? "Orchestration en cours..." : "Fixer un objectif à l'Executive Co-Pilot..."}
            className="bg-transparent text-xs text-white placeholder:text-neutral-500 outline-none w-full font-sans tracking-wide"
          />

          {/* Fermer / Action */}
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-neutral-500 hover:text-white px-2 py-1 transition-colors shrink-0 font-mono"
          >
            ✕
          </button>
        </form>

        {/* Ligne d'Énergie Épistémique (si en execution) */}
        {isExecuting && (
          <div className="px-3 pb-1 pt-0.5 border-t border-white/10 flex items-center justify-between animate-in fade-in duration-200">
            <span className="text-[10px] text-neutral-300 font-sans tracking-wide truncate">
              {activeStepText}
            </span>
            <span className="text-[9px] font-mono text-purple-300 shrink-0 uppercase tracking-widest pl-2">
              ✦ CVI Active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
