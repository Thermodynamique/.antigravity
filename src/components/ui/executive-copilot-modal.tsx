"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AgentType = "refactor" | "research" | "doc" | "sentinel";
type AgentStatus = "idle" | "thinking" | "working" | "done" | "error";
type MissionStatus = "idle" | "planning" | "executing" | "done";

interface AgentState {
  id: AgentType;
  name: string;
  icon: string;
  color: string;
  glowColor: string;
  borderColor: string;
  textColor: string;
  status: AgentStatus;
  currentAction: string;
  progress: number; // 0-100
  result?: string;
  targetNodeLabel?: string;
}

interface MissionStep {
  id: string;
  agent: AgentType;
  description: string;
  status: "pending" | "active" | "done";
  targetNodeLabel?: string;
}

interface ExecutiveCoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Array<{ id: string; data: { label?: string; category?: string } }>;
  onDispatchAgent: (agentType: AgentType, nodeId: string, description: string) => void;
}

// ---------------------------------------------------------------------------
// Config des agents
// ---------------------------------------------------------------------------
const AGENT_CONFIGS: Record<AgentType, Omit<AgentState, "status" | "currentAction" | "progress" | "result" | "targetNodeLabel">> = {
  refactor: {
    id: "refactor",
    name: "Agent Refactor",
    icon: "🟣",
    color: "bg-purple-950/40",
    glowColor: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
    borderColor: "border-purple-500/40",
    textColor: "text-purple-300",
  },
  research: {
    id: "research",
    name: "Agent Research",
    icon: "🔵",
    color: "bg-blue-950/40",
    glowColor: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    borderColor: "border-blue-500/40",
    textColor: "text-blue-300",
  },
  doc: {
    id: "doc",
    name: "Agent Doc",
    icon: "🟢",
    color: "bg-emerald-950/40",
    glowColor: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    borderColor: "border-emerald-500/40",
    textColor: "text-emerald-300",
  },
  sentinel: {
    id: "sentinel",
    name: "Agent Sentinel",
    icon: "🔴",
    color: "bg-red-950/40",
    glowColor: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
    borderColor: "border-red-500/40",
    textColor: "text-red-300",
  },
};

// ---------------------------------------------------------------------------
// Générateur de plan de mission selon l'objectif
// ---------------------------------------------------------------------------
function generateMissionPlan(objective: string, nodeCount: number): MissionStep[] {
  const steps: MissionStep[] = [];
  const lower = objective.toLowerCase();

  // L'IA Executive décompose l'objectif en tâches agentiques
  if (lower.includes("refactor") || lower.includes("optimis") || lower.includes("code") || lower.includes("<16ms") || lower.includes("composant")) {
    steps.push({ id: "s1", agent: "refactor", description: "Analyser l'AST et identifier les fonctions critiques (>16ms)", status: "pending" });
    steps.push({ id: "s2", agent: "sentinel", description: "Vérifier la bi-temporalité des claims de code après refactor", status: "pending" });
    steps.push({ id: "s3", agent: "doc", description: "Générer la documentation de synthèse post-optimisation", status: "pending" });
  } else if (lower.includes("brevet") || lower.includes("patent") || lower.includes("recherche") || lower.includes("concurren")) {
    steps.push({ id: "s1", agent: "research", description: "Scanner les brevets USPTO / EPO sur le domaine cible", status: "pending" });
    steps.push({ id: "s2", agent: "sentinel", description: "Détecter les conflits d'obligations entre revendications", status: "pending" });
    steps.push({ id: "s3", agent: "doc", description: "Rédiger le rapport de propriété intellectuelle certifié", status: "pending" });
  } else if (lower.includes("synthèse") || lower.includes("rapport") || lower.includes("résumé") || lower.includes("doc")) {
    steps.push({ id: "s1", agent: "sentinel", description: "Auditer la cohérence et la validité temporelle des atomes", status: "pending" });
    steps.push({ id: "s2", agent: "research", description: "Enrichir les claims avec les sources corroborantes", status: "pending" });
    steps.push({ id: "s3", agent: "doc", description: "Produire la synthèse certifiée SHA-256 sur les atomes sélectionnés", status: "pending" });
  } else {
    // Plan générique intelligent
    steps.push({ id: "s1", agent: "sentinel", description: "Analyser la cohérence globale du canvas", status: "pending" });
    steps.push({ id: "s2", agent: "research", description: "Vérifier les faits et corroborer les sources", status: "pending" });
    steps.push({ id: "s3", agent: "refactor", description: "Optimiser la structure des nœuds de code détectés", status: "pending" });
    steps.push({ id: "s4", agent: "doc", description: "Consolider et certifier le livrable final", status: "pending" });
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Sous-composant : Carte d'Agent
// ---------------------------------------------------------------------------
function AgentCard({ agent }: { agent: AgentState }) {
  const cfg = AGENT_CONFIGS[agent.id];
  const isActive = agent.status === "working" || agent.status === "thinking";
  const isDone = agent.status === "done";

  return (
    <div
      className={cn(
        "relative p-3 rounded-2xl border transition-all duration-500",
        cfg.color,
        cfg.borderColor,
        isActive && cfg.glowColor,
        isDone && "opacity-80"
      )}
    >
      {/* Pulsation active */}
      {isActive && (
        <div className={cn("absolute inset-0 rounded-2xl animate-pulse opacity-20", cfg.color)} />
      )}

      <div className="flex items-start gap-2.5 relative">
        {/* Indicateur d'état */}
        <div className="relative flex-shrink-0 mt-0.5">
          <span className="text-base">{cfg.icon}</span>
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white animate-ping" />
          )}
          {isDone && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-[11px] font-bold font-mono", cfg.textColor)}>
              {cfg.name}
            </span>
            <span className={cn(
              "text-[9px] font-mono px-1.5 py-0.5 rounded-full",
              agent.status === "idle" && "bg-neutral-800 text-neutral-500",
              agent.status === "thinking" && "bg-purple-950 text-purple-300",
              agent.status === "working" && "bg-blue-950 text-blue-300",
              agent.status === "done" && "bg-emerald-950 text-emerald-300",
              agent.status === "error" && "bg-red-950 text-red-300",
            )}>
              {agent.status === "idle" ? "En attente" :
               agent.status === "thinking" ? "Analyse..." :
               agent.status === "working" ? "Exécution" :
               agent.status === "done" ? "✓ Terminé" : "Erreur"}
            </span>
          </div>

          <p className="text-[10px] text-neutral-400 leading-snug font-sans truncate">
            {agent.currentAction}
          </p>

          {/* Barre de progression */}
          {(isActive || isDone) && (
            <div className="mt-2 h-0.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  agent.id === "refactor" && "bg-purple-400",
                  agent.id === "research" && "bg-blue-400",
                  agent.id === "doc" && "bg-emerald-400",
                  agent.id === "sentinel" && "bg-red-400",
                )}
                style={{ width: `${agent.progress}%` }}
              />
            </div>
          )}

          {/* Résultat */}
          {agent.result && isDone && (
            <p className="mt-1.5 text-[10px] text-neutral-300 leading-snug font-sans">
              {agent.result}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------
export function ExecutiveCoPilotModal({ isOpen, onClose, nodes, onDispatchAgent }: ExecutiveCoPilotModalProps) {
  const [objective, setObjective] = useState("");
  const [missionStatus, setMissionStatus] = useState<MissionStatus>("idle");
  const [missionSteps, setMissionSteps] = useState<MissionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [executiveThought, setExecutiveThought] = useState("");
  const [agentStates, setAgentStates] = useState<Record<AgentType, AgentState>>({
    refactor: { ...AGENT_CONFIGS.refactor, status: "idle", currentAction: "En veille — Prêt à optimiser", progress: 0 },
    research: { ...AGENT_CONFIGS.research, status: "idle", currentAction: "En veille — Scan de sources", progress: 0 },
    doc: { ...AGENT_CONFIGS.doc, status: "idle", currentAction: "En veille — Synthèse en attente", progress: 0 },
    sentinel: { ...AGENT_CONFIGS.sentinel, status: "idle", currentAction: "Surveillance permanente active", progress: 0 },
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Focus auto à l'ouverture
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, []);

  // Réinitialiser les états agents
  const resetAgents = useCallback(() => {
    setAgentStates({
      refactor: { ...AGENT_CONFIGS.refactor, status: "idle", currentAction: "En veille — Prêt à optimiser", progress: 0 },
      research: { ...AGENT_CONFIGS.research, status: "idle", currentAction: "En veille — Scan de sources", progress: 0 },
      doc: { ...AGENT_CONFIGS.doc, status: "idle", currentAction: "En veille — Synthèse en attente", progress: 0 },
      sentinel: { ...AGENT_CONFIGS.sentinel, status: "idle", currentAction: "Surveillance permanente active", progress: 0 },
    });
  }, []);

  // Mettre à jour l'état d'un agent
  const updateAgent = useCallback((agentId: AgentType, updates: Partial<AgentState>) => {
    setAgentStates(prev => ({
      ...prev,
      [agentId]: { ...prev[agentId], ...updates },
    }));
  }, []);

  // Simuler la progression d'un agent (progrès 0→100 en ~3s)
  const simulateAgentProgress = useCallback((agentId: AgentType, action: string, result: string, onComplete: () => void) => {
    updateAgent(agentId, { status: "thinking", currentAction: "Analyse de la requête...", progress: 0 });

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        updateAgent(agentId, {
          status: "done",
          currentAction: action,
          progress: 100,
          result,
        });
        setTimeout(onComplete, 600);
      } else {
        updateAgent(agentId, {
          status: "working",
          currentAction: action,
          progress: Math.min(progress, 95),
        });
      }
    }, 250);

    return interval;
  }, [updateAgent]);

  // Exécuter une mission pas-à-pas
  const executeMission = useCallback((steps: MissionStep[]) => {
    let stepIdx = 0;

    const executeNextStep = () => {
      if (stepIdx >= steps.length) {
        // Mission terminée
        setMissionStatus("done");
        setCurrentStepIndex(-1);
        setExecutiveThought("✅ Mission accomplie. Tous les agents ont terminé leurs tâches. Rapport certifié SHA-256 disponible.");
        return;
      }

      const step = steps[stepIdx];
      setCurrentStepIndex(stepIdx);
      setMissionSteps(prev => prev.map((s, i) => i === stepIdx ? { ...s, status: "active" } : s));

      // Trouver le nœud cible (premier nœud code ou doc disponible)
      const targetNode = nodes.find(n => n.data.category === "code") || nodes.find(n => n.data.category === "document") || nodes[0];
      const targetNodeId = targetNode?.id || "";
      const targetNodeLabel = targetNode?.data?.label || "Canvas";

      setExecutiveThought(`Agent ${AGENT_CONFIGS[step.agent].name} déployé sur "${targetNodeLabel}" — ${step.description}`);

      // Notifier le canvas
      if (targetNodeId) {
        onDispatchAgent(step.agent, targetNodeId, step.description);
      }

      // Résultats simulés réalistes par type d'agent
      const results: Record<AgentType, string> = {
        refactor: "3 fonctions restructurées. Temps d'exécution réduit de 34ms → 9ms ✓",
        research: "12 brevets analysés. 2 conflits d'obligations isolés. Sources corroborées ✓",
        doc: "Synthèse certifiée (SHA-256 : e3b0c4...) — 4 atomes consolidés ✓",
        sentinel: "Aucune contradiction bi-temporelle détectée. Cohérence : 100% ✓",
      };

      simulateAgentProgress(
        step.agent,
        step.description,
        results[step.agent],
        () => {
          setMissionSteps(prev => prev.map((s, i) => i === stepIdx ? { ...s, status: "done" } : s));
          stepIdx++;
          setTimeout(executeNextStep, 800);
        }
      );
    };

    executeNextStep();
  }, [nodes, onDispatchAgent, simulateAgentProgress]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim() || missionStatus === "executing") return;

    resetAgents();
    const steps = generateMissionPlan(objective, nodes.length);
    setMissionSteps(steps);
    setMissionStatus("planning");
    setExecutiveThought("Décomposition de l'objectif en tâches agentiques...");

    setTimeout(() => {
      setMissionStatus("executing");
      executeMission(steps);
    }, 1200);
  }, [objective, missionStatus, nodes.length, resetAgents, executeMission]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    setObjective("");
    setMissionStatus("idle");
    setMissionSteps([]);
    setCurrentStepIndex(-1);
    setExecutiveThought("");
    resetAgents();
  }, [resetAgents]);

  if (!isOpen) return null;

  const allDone = missionStatus === "done";
  const isExecuting = missionStatus === "executing" || missionStatus === "planning";

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-end pr-6 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto w-[380px] bg-neutral-950/95 backdrop-blur-3xl border border-purple-500/25 rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(139,92,246,0.1)] flex flex-col",
          "animate-in slide-in-from-right-8 fade-in duration-400"
        )}
        style={{ maxHeight: "calc(100vh - 48px)", marginTop: "24px", marginBottom: "24px" }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            {/* Orbe Executive pulsant */}
            <div className="relative w-9 h-9 flex-shrink-0">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                <span className="text-base">🤖</span>
              </div>
              {isExecuting && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-neutral-950 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight font-sans">Executive Co-Pilot</h2>
              <p className="text-[10px] text-neutral-500 font-mono">
                {isExecuting ? "Orchestration en cours..." : allDone ? "Mission accomplie ✓" : "Supervision · Orchestration · Certification"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* ── Corps ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">

          {/* Zone de saisie de l'objectif */}
          {missionStatus === "idle" && (
            <div className="space-y-3">
              <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                Donnez un objectif à l'Executive. Il décompose la mission et coordonne les agents spécialisés sur votre Canvas.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    placeholder="Ex : Refactore ce composant React sous 16ms…"
                    className="w-full px-4 py-3 bg-neutral-900/70 border border-white/10 rounded-2xl text-sm text-white placeholder:text-neutral-600 outline-none focus:border-purple-500/50 focus:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all font-sans"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500/60 text-xs">↵</span>
                </div>

                {/* Suggestions rapides */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600">Objectifs types :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Refactore le code sous 16ms",
                      "Recherche 5 brevets concurrents",
                      "Synthèse sur les 4 atomes",
                      "Audite la cohérence complète",
                    ].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setObjective(s)}
                        className="px-2.5 py-1 bg-neutral-900/60 hover:bg-neutral-800 border border-white/8 hover:border-purple-500/30 text-[10px] text-neutral-400 hover:text-neutral-200 rounded-full transition-all font-sans"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!objective.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-violet-700 hover:from-purple-600 hover:to-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl transition-all shadow-[0_4px_20px_rgba(139,92,246,0.4)] font-sans"
                >
                  Lancer la Mission →
                </button>
              </form>
            </div>
          )}

          {/* Phase de planification */}
          {missionStatus === "planning" && (
            <div className="text-center py-6 space-y-3">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm text-purple-300 font-sans font-medium">Planification de la mission...</p>
              <p className="text-[11px] text-neutral-500 font-sans">L'Executive décompose votre objectif</p>
            </div>
          )}

          {/* Mission en cours ou terminée */}
          {(missionStatus === "executing" || missionStatus === "done") && (
            <div className="space-y-4">
              {/* Pensée de l'Executive */}
              {executiveThought && (
                <div className="px-3.5 py-2.5 bg-purple-950/30 border border-purple-500/20 rounded-2xl">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400 text-xs flex-shrink-0 mt-0.5">🤖</span>
                    <p className="text-[11px] text-purple-200 font-sans leading-relaxed">{executiveThought}</p>
                  </div>
                </div>
              )}

              {/* Plan de mission (timeline) */}
              <div className="space-y-1">
                <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 px-1">Plan de mission</p>
                <div className="space-y-1.5">
                  {missionSteps.map((step, idx) => {
                    const cfg = AGENT_CONFIGS[step.agent];
                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-start gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300",
                          step.status === "pending" && "bg-neutral-900/40 border-white/5 opacity-50",
                          step.status === "active" && `${cfg.color} ${cfg.borderColor} ${cfg.glowColor}`,
                          step.status === "done" && "bg-emerald-950/20 border-emerald-500/20",
                        )}
                      >
                        <span className="text-xs flex-shrink-0 mt-0.5">
                          {step.status === "done" ? "✓" : step.status === "active" ? cfg.icon : "○"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-[10px] font-semibold font-mono",
                            step.status === "done" ? "text-emerald-400" : step.status === "active" ? cfg.textColor : "text-neutral-600"
                          )}>
                            {cfg.name}
                          </span>
                          <p className={cn(
                            "text-[10px] font-sans leading-snug",
                            step.status === "done" ? "text-neutral-400" : step.status === "active" ? "text-neutral-300" : "text-neutral-700"
                          )}>
                            {step.description}
                          </p>
                        </div>
                        {step.status === "active" && (
                          <div className="flex-shrink-0 w-1 h-1 rounded-full bg-white animate-ping mt-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* États des agents */}
              <div className="space-y-1">
                <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 px-1">Agents</p>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.values(agentStates) as AgentState[]).map(agent => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 pb-4 pt-3 border-t border-white/8 flex items-center justify-between gap-2">
          {missionStatus !== "idle" && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-neutral-900/60 hover:bg-neutral-800 border border-white/8 text-xs text-neutral-400 hover:text-white rounded-xl transition-all font-sans"
            >
              Nouvelle mission
            </button>
          )}

          {allDone && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Certifié SHA-256</span>
            </div>
          )}

          {!allDone && missionStatus === "idle" && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[10px] text-neutral-500 font-mono">{nodes.length} nœuds disponibles</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
