/**
 * Hook React pour communiquer avec le serveur NightCode Automator (Python/FastAPI).
 * Permet à l'interface NightCode de déléguer des tâches bureautiques à l'agent autonome.
 */

import { useState, useCallback } from "react";

const AUTOMATOR_API_URL = "http://localhost:8765";

interface AutomatorStatus {
  isOnline: boolean;
  agentReady: boolean;
}

interface AutomatorResult {
  status: "success" | "error";
  result: string;
}

export function useAutomator() {
  const [isLoading, setIsLoading] = useState(false);
  const [automatorStatus, setAutomatorStatus] = useState<AutomatorStatus>({
    isOnline: false,
    agentReady: false,
  });

  /**
   * Vérifie si le serveur Automator est en ligne.
   * À appeler au montage du composant ou sur demande.
   */
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${AUTOMATOR_API_URL}/health`, {
        signal: AbortSignal.timeout(2000), // Timeout rapide de 2s
      });
      if (res.ok) {
        const data = await res.json();
        setAutomatorStatus({ isOnline: true, agentReady: data.agent_ready });
        return true;
      }
    } catch {
      // Le serveur est offline, c'est normal si l'utilisateur ne l'a pas lancé
    }
    setAutomatorStatus({ isOnline: false, agentReady: false });
    return false;
  }, []);

  /**
   * Envoie une tâche à l'agent autonome.
   * @param message - La description en langage naturel de la tâche à effectuer.
   * @returns Le résultat de l'agent, ou null en cas d'erreur.
   */
  const runTask = useCallback(
    async (message: string): Promise<AutomatorResult | null> => {
      setIsLoading(true);
      try {
        const res = await fetch(`${AUTOMATOR_API_URL}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
          signal: AbortSignal.timeout(60000), // Timeout de 60s pour les tâches longues
        });

        if (!res.ok) {
          const err = await res.json();
          return { status: "error", result: err.detail || "Erreur inconnue de l'agent." };
        }

        const data: AutomatorResult = await res.json();
        return data;
      } catch (error: any) {
        if (error.name === "TimeoutError") {
          return { status: "error", result: "L'agent a mis trop de temps à répondre (timeout 60s)." };
        }
        return {
          status: "error",
          result: "Impossible de contacter le serveur NightCode Automator. Est-il lancé sur le port 8765 ?",
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, automatorStatus, checkStatus, runTask };
}
