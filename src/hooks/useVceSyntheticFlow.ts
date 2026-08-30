"use client";

/**
 * useVceSyntheticFlow.ts
 *
 * Hook exposant les 3 flux utilisateur VCE simulés en données synthétiques.
 * Chaque flux anime séquentiellement les étapes du pipeline :
 *   Documents → Atoms → Claims → Relations → Contradictions → Evidence
 *
 * Quand le vrai backend sera branché, ces fonctions seront remplacées
 * par des appels API réels — l'interface ne change pas.
 */

import { useCallback, useRef } from "react";
import { useCanvas } from "@/contexts/CanvasContext";
import {
  SYNTHETIC_CORPUS,
  SYNTHETIC_RELATIONS,
  atomToCanvasNode,
  relationToCanvasEdge,
  gridPositions,
} from "@/lib/synthetic-vce-corpus";

export function useVceSyntheticFlow() {
  const { setNodes, setEdges, updateNodeData } = useCanvas();
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  /** Annule tous les timeouts en cours (pour reset propre). */
  const clearFlowTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // ---------------------------------------------------------------------------
  // Scénario A — Flux d'Ingestion & Atomisation
  // ---------------------------------------------------------------------------
  const triggerIngestionFlow = useCallback(() => {
    clearFlowTimeouts();

    // 1. Vider le canvas des nœuds de démo précédents
    setNodes(() => []);
    setEdges(() => []);

    const allAtoms = SYNTHETIC_CORPUS.flatMap((doc) => doc.atoms);
    const positions = gridPositions(allAtoms.length, 3);

    // 2. Phase 1 — Faire apparaître les documents bruts séquentiellement
    //    Chaque nœud apparaît en état "raw_doc" (icône PDF, pas encore analysé)
    allAtoms.forEach((atom, i) => {
      const t = setTimeout(() => {
        const node = atomToCanvasNode(atom, positions[i], "raw_doc");
        setNodes((nds) => [
          ...nds,
          {
            ...node,
            data: {
              ...node.data,
              label: `📄 ${atom.source_doc}`,
              atomizingState: "raw_doc",
            },
          } as any,
        ]);
      }, i * 250);
      timeoutsRef.current.push(t);
    });

    // 3. Phase 2 — Passer en état "atomizing" (spinner visible)
    const atomizingStart = allAtoms.length * 250 + 400;
    allAtoms.forEach((atom, i) => {
      const t = setTimeout(() => {
        updateNodeData(atom.atom_id, { atomizingState: "atomizing" });
      }, atomizingStart + i * 180);
      timeoutsRef.current.push(t);
    });

    // 4. Phase 3 — Révéler les atoms avec leurs claims
    const readyStart = atomizingStart + allAtoms.length * 180 + 800;
    allAtoms.forEach((atom, i) => {
      const t = setTimeout(() => {
        updateNodeData(atom.atom_id, {
          atomizingState: "ready",
          label: atom.source_doc,
          vceClaims: atom.claims,
          attentionScore: atom.attention_score,
          domainColor:
            atom.domain === "medical"
              ? "#10b981"
              : atom.domain === "patent"
              ? "#f59e0b"
              : "#64748b",
        });
      }, readyStart + i * 200);
      timeoutsRef.current.push(t);
    });

    // 5. Phase 4 — Tracer les relations (arêtes)
    const edgesStart = readyStart + allAtoms.length * 200 + 600;
    SYNTHETIC_RELATIONS.forEach((rel, i) => {
      const t = setTimeout(() => {
        const edge = relationToCanvasEdge(rel);
        setEdges((eds) => {
          const exists = eds.some((e) => e.id === edge.id);
          return exists ? eds : [...eds, edge as any];
        });
      }, edgesStart + i * 300);
      timeoutsRef.current.push(t);
    });
  }, [setNodes, setEdges, updateNodeData, clearFlowTimeouts]);

  // ---------------------------------------------------------------------------
  // Scénario B — Flux de Contradiction (focus sur les conflits SOD2)
  // ---------------------------------------------------------------------------
  const triggerContradictionFlow = useCallback(() => {
    clearFlowTimeouts();
    setNodes(() => []);
    setEdges(() => []);

    // Seulement les 3 atoms impliqués dans la contradiction SOD2
    const contradictingAtoms = SYNTHETIC_CORPUS.flatMap((doc) =>
      doc.atoms.filter((a) =>
        ["atom_sod2_001", "atom_sod2_cell_001", "atom_nature_001"].includes(a.atom_id)
      )
    );

    const positions = [
      { x: 120, y: 260 },  // JBC 2019 — gauche
      { x: 680, y: 260 },  // Cell 2022 — droite (contradicteur)
      { x: 400, y: 60 },   // Nature 2021 — haut (corroborateur)
    ];

    // Apparition séquentielle des 3 nœuds
    contradictingAtoms.forEach((atom, i) => {
      const t = setTimeout(() => {
        const node = atomToCanvasNode(atom, positions[i], "ready");
        setNodes((nds) => [...nds, node as any]);
      }, i * 400);
      timeoutsRef.current.push(t);
    });

    // Après 2s, tracer les arêtes de contradiction + corroboration
    const contradictionRelations = SYNTHETIC_RELATIONS.filter((r) =>
      ["rel_001", "rel_002", "rel_003"].includes(r.relation_id)
    );

    contradictionRelations.forEach((rel, i) => {
      const t = setTimeout(() => {
        const edge = relationToCanvasEdge(rel);
        setEdges((eds) => [...eds, edge as any]);
      }, 1400 + i * 400);
      timeoutsRef.current.push(t);
    });
  }, [setNodes, setEdges, clearFlowTimeouts]);

  // ---------------------------------------------------------------------------
  // Scénario C — Flux d'Édition Chirurgicale
  // Simule la modification d'un atom et son impact bi-temporel sur les claims
  // ---------------------------------------------------------------------------
  const triggerSurgicalEditFlow = useCallback(
    (atomId: string) => {
      // 1. Marquer le claim comme "en révision" (valid_until horodaté)
      const now = new Date().toISOString();
      updateNodeData(atomId, {
        atomizingState: "surgical_edit",
        surgicalEditTimestamp: now,
        vceClaims: (prevClaims: any[]) =>
          prevClaims?.map((c: any) =>
            c.action === "auto_accepted"
              ? {
                  ...c,
                  action: "review_required",
                  confidence: Math.max(0.5, c.confidence - 0.15),
                  valid_until: now,
                  editNote: "Modifié chirurgicalement — révision requise",
                }
              : c
          ),
      });

      // 2. Après 3s, rétablir si aucune nouvelle modification n'est faite
      //    (simulation du recalcul du backend après soumission)
    },
    [updateNodeData]
  );

  return {
    triggerIngestionFlow,
    triggerContradictionFlow,
    triggerSurgicalEditFlow,
    clearFlowTimeouts,
  };
}
