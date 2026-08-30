"use client";

import React, { useState } from "react";
import { X, Play, Sparkles, GitBranch, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { VceCausalEngine, SimulationScenario, CounterfactualAnalysis } from "@/lib/vce-causal-engine";
import { cn } from "@/lib/utils";

interface VceSimulationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VceSimulationPanel({ isOpen, onClose }: VceSimulationPanelProps) {
  const [engine] = useState(() => new VceCausalEngine());
  const [priceAdjustment, setPriceAdjustment] = useState(15);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(() => engine.runSimulation(15));
  const [counterfactual, setCounterfactual] = useState<CounterfactualAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'SIMULATION' | 'COUNTERFACTUAL'>('SIMULATION');

  if (!isOpen) return null;

  const handleSimulate = (val: number) => {
    setPriceAdjustment(val);
    setScenarios(engine.runSimulation(val));
  };

  const handleRunCounterfactual = () => {
    const res = engine.runCounterfactual("Refactoring Monolithique", "Micro-Modules VCE Démembrés");
    setCounterfactual(res);
  };

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 pointer-events-auto">
      <div className="w-full max-w-4xl bg-[#0d0d12] border border-purple-500/30 rounded-3xl shadow-[0_25px_70px_rgba(168,85,247,0.2)] flex flex-col overflow-hidden max-h-[85vh] font-sans">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] font-mono text-purple-400 uppercase tracking-widest">ÉVOLUTIONS 4 & 5 — VCE WORLD ENGINE</div>
              <h3 className="text-sm font-bold text-white tracking-wide">Moteur de Simulation & Intelligence Contrefactuelle</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('SIMULATION')}
            className={cn(
              "pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2",
              activeTab === 'SIMULATION' ? "border-purple-400 text-purple-200" : "border-transparent text-neutral-400 hover:text-white"
            )}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Simulation d'Espace de Futurs (Stratégies A/B)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('COUNTERFACTUAL');
              if (!counterfactual) handleRunCounterfactual();
            }}
            className={cn(
              "pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2",
              activeTab === 'COUNTERFACTUAL' ? "border-cyan-400 text-cyan-200" : "border-transparent text-neutral-400 hover:text-white"
            )}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Analyse Contrefactuelle ("Que se serait-il passé si ?")</span>
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === 'SIMULATION' ? (
            <div className="space-y-6">
              {/* SLIDER DE SIMULATION DE VARIABLE CAUSALE */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-neutral-200">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Variable Causale Modifiée : **Prix / Tarif Produit**
                  </span>
                  <span className="font-mono text-purple-300 font-bold">{priceAdjustment > 0 ? `+${priceAdjustment}%` : `${priceAdjustment}%`}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={priceAdjustment}
                  onChange={(e) => handleSimulate(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>-50% Baisse Agressive</span>
                  <span>Statu Quo (0%)</span>
                  <span>+50% Hausse Premium</span>
                </div>
              </div>

              {/* RÉSULTATS DES SCÉNARIOS SIMULÉS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarios.map((scen) => (
                  <div key={scen.id} className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white tracking-wide">{scen.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        Confiance : {Math.round(scen.confidenceScore * 100)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{scen.strategy}</p>

                    <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                      {scen.projectedOutcomes.map((out, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px]">
                          <span className="text-neutral-300">{out.variableName}</span>
                          <span className={cn(out.changePercentage >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {out.projectedValue} ({out.changePercentage >= 0 ? `+${out.changePercentage}%` : `${out.changePercentage}%`})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ANALYSE CONTREFACTUELLE */
            <div className="space-y-4">
              {counterfactual && (
                <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-4 text-xs">
                  <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-red-400 font-bold">Monde Réel (Passé Exécuté) :</span>
                    <p className="text-white font-medium">{counterfactual.actualOutcome}</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-cyan-400 rotate-90" />
                  </div>

                  <div className="p-3 bg-cyan-950/50 border border-cyan-500/40 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold">Hypothèse Contrefactuelle :</span>
                    <p className="text-cyan-100 font-medium">{counterfactual.counterfactualHypothesis}</p>
                    <p className="text-emerald-300 font-mono text-[11px] pt-1">Résultat : {counterfactual.alternativeOutcome}</p>
                  </div>

                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Écart d'Impact Causal Net :
                    </span>
                    <span className="font-mono font-bold">{counterfactual.deltaImpact}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-neutral-400">
          <span className="font-mono text-[10px]">Ancrage cryptographique des futurs probables dans le Merkle DAG</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
          >
            Valider la Simulation
          </button>
        </div>

      </div>
    </div>
  );
}
