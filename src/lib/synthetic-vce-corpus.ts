/**
 * synthetic-vce-corpus.ts
 *
 * Données synthétiques au format production exact du backend VCE.
 * Utilisées pour tester les flux UI sans lancer le vrai backend.
 *
 * Use Case : Le Chercheur — corpus SOD2 (7 documents, multi-domaines)
 *
 * Pipeline simulé :
 *   Documents → Atoms → Claims → Relations → Contradictions → Evidence
 */

// ---------------------------------------------------------------------------
// Types miroir du backend Python (claims_graph.py + atom_graph.py)
// ---------------------------------------------------------------------------

export interface VceClaim {
  claim_id: string;
  text: string;
  action: "auto_accepted" | "review_required" | "rejected";
  confidence: number; // formule 4 signaux
  signal_accord: number;
  signal_fidelite: number;
  signal_certitude: number;
  signal_compliance: number;
  corroborating_sources: string[]; // doc_ids
  valid_from: string; // ISO 8601
  valid_until: string | null; // null = encore valide (bi-temporel)
  invalidated_by: string | null;
}

export interface VceAtom {
  atom_id: string;
  source_doc: string; // nom du fichier source
  domain: "medical" | "code_source" | "patent" | "legal" | "default";
  text: string; // texte brut de l'atom
  attention_score: number; // 0.6*relevance + 0.4*trust
  claims: VceClaim[];
  contradicted_by: string[]; // atom_ids
  corroborated_by: string[]; // atom_ids
  is_c3?: boolean; // compression optique activée
  fidelity_score?: number; // score de fidélité C3
}

export interface VceRelation {
  relation_id: string;
  source_atom: string;
  target_atom: string;
  type: "corroborates" | "contradicts" | "cites" | "extends" | "depends_on";
  label: string;
  confidence: number;
  assertion?: string; // phrase explicative du lien
}

export interface VceSyntheticDocument {
  doc_id: string;
  filename: string;
  domain: VceAtom["domain"];
  year: number;
  atoms: VceAtom[];
}

// ---------------------------------------------------------------------------
// Corpus Synthétique — SOD2 Researcher Use Case
// ---------------------------------------------------------------------------

export const SYNTHETIC_CORPUS: VceSyntheticDocument[] = [
  {
    doc_id: "doc_jbc_2019",
    filename: "article_JBC_2019_SOD2_ROS.pdf",
    domain: "medical",
    year: 2019,
    atoms: [
      {
        atom_id: "atom_sod2_001",
        source_doc: "article_JBC_2019_SOD2_ROS.pdf",
        domain: "medical",
        text: "SOD2 (Mn-SOD) expression is significantly upregulated in response to mitochondrial ROS accumulation in cardiomyocytes.",
        attention_score: 0.91,
        claims: [
          {
            claim_id: "claim_sod2_001",
            text: "SOD2 est uprégulé par l'accumulation mitochondriale de ROS dans les cardiomyocytes",
            action: "auto_accepted",
            confidence: 0.91,
            signal_accord: 0.95,
            signal_fidelite: 0.88,
            signal_certitude: 0.91,
            signal_compliance: 0.90,
            corroborating_sources: ["doc_nature_2021", "doc_rapport_tech"],
            valid_from: "2026-08-17T00:00:00Z",
            valid_until: null,
            invalidated_by: null,
          },
        ],
        contradicted_by: ["atom_sod2_cell_001"],
        corroborated_by: ["atom_nature_001"],
      },
      {
        atom_id: "atom_sod2_002",
        source_doc: "article_JBC_2019_SOD2_ROS.pdf",
        domain: "medical",
        text: "Mice lacking SOD2 in cardiomyocytes show 3.2x increase in mitochondrial superoxide at baseline.",
        attention_score: 0.88,
        claims: [
          {
            claim_id: "claim_sod2_002",
            text: "Les souris SOD2-KO montrent une augmentation de 3.2x du superoxyde mitochondrial",
            action: "auto_accepted",
            confidence: 0.88,
            signal_accord: 0.90,
            signal_fidelite: 0.85,
            signal_certitude: 0.88,
            signal_compliance: 0.88,
            corroborating_sources: ["doc_rapport_tech"],
            valid_from: "2026-08-17T00:00:00Z",
            valid_until: null,
            invalidated_by: null,
          },
        ],
        contradicted_by: [],
        corroborated_by: ["atom_rapport_001"],
      },
    ],
  },
  {
    doc_id: "doc_cell_2022",
    filename: "article_Cell_2022_SOD2_controversy.pdf",
    domain: "medical",
    year: 2022,
    atoms: [
      {
        atom_id: "atom_sod2_cell_001",
        source_doc: "article_Cell_2022_SOD2_controversy.pdf",
        domain: "medical",
        text: "In vivo whole-body SOD2 induction by ROS cannot be demonstrated in primary hepatocytes under physiological conditions.",
        attention_score: 0.78,
        claims: [
          {
            claim_id: "claim_sod2_cell_001",
            text: "SOD2 n'est PAS induit par les ROS in vivo dans des conditions physiologiques",
            action: "review_required",
            confidence: 0.78,
            signal_accord: 0.55,
            signal_fidelite: 0.82,
            signal_certitude: 0.78,
            signal_compliance: 0.75,
            corroborating_sources: [],
            valid_from: "2026-08-17T00:00:00Z",
            valid_until: null,
            invalidated_by: null,
          },
        ],
        contradicted_by: ["atom_sod2_001"],
        corroborated_by: [],
      },
    ],
  },
  {
    doc_id: "doc_nature_2021",
    filename: "article_Nature_2021_oxidative_stress.pdf",
    domain: "medical",
    year: 2021,
    atoms: [
      {
        atom_id: "atom_nature_001",
        source_doc: "article_Nature_2021_oxidative_stress.pdf",
        domain: "medical",
        text: "Mn-SOD upregulation represents a primary adaptive response to increased mitochondrial ROS in cardiac tissue.",
        attention_score: 0.94,
        claims: [
          {
            claim_id: "claim_nature_001",
            text: "La surexpression de Mn-SOD est la réponse adaptative primaire aux ROS mitochondriaux cardiaques",
            action: "auto_accepted",
            confidence: 0.94,
            signal_accord: 0.98,
            signal_fidelite: 0.91,
            signal_certitude: 0.94,
            signal_compliance: 0.92,
            corroborating_sources: ["doc_jbc_2019", "doc_rapport_tech"],
            valid_from: "2026-08-17T00:00:00Z",
            valid_until: null,
            invalidated_by: null,
          },
        ],
        contradicted_by: ["atom_sod2_cell_001"],
        corroborated_by: ["atom_sod2_001"],
      },
    ],
  },
  {
    doc_id: "doc_brevet_us_2020",
    filename: "brevet_US20200193418_SOD2_therapy.pdf",
    domain: "patent",
    year: 2020,
    atoms: [
      {
        atom_id: "atom_brevet_001",
        source_doc: "brevet_US20200193418_SOD2_therapy.pdf",
        domain: "patent",
        text: "Revendication 1 : Méthode d'augmentation de l'activité SOD2 par administration d'un vecteur AAV ciblant le promoteur PGC-1α.",
        attention_score: 0.85,
        claims: [
          {
            claim_id: "claim_brevet_001",
            text: "Vecteur AAV ciblant PGC-1α pour augmenter SOD2 — Revendication 1 (US2020193418)",
            action: "auto_accepted",
            confidence: 0.85,
            signal_accord: 0.80,
            signal_fidelite: 0.88,
            signal_certitude: 0.85,
            signal_compliance: 0.86,
            corroborating_sources: ["doc_jbc_2019"],
            valid_from: "2026-08-17T00:00:00Z",
            valid_until: null,
            invalidated_by: null,
          },
        ],
        contradicted_by: [],
        corroborated_by: ["atom_sod2_001"],
        is_c3: true,
        fidelity_score: 0.94,
      },
    ],
  },
  {
    doc_id: "doc_rapport_tech",
    filename: "rapport_technique_SOD2_knockout_2023.pdf",
    domain: "medical",
    year: 2023,
    atoms: [
      {
        atom_id: "atom_rapport_001",
        source_doc: "rapport_technique_SOD2_knockout_2023.pdf",
        domain: "medical",
        text: "Résultats d'expériences KO confirmés sur 3 lignées cellulaires distinctes : augmentation constante du superoxyde mitochondrial (p < 0.001).",
        attention_score: 0.89,
        claims: [
          {
            claim_id: "claim_rapport_001",
            text: "Augmentation du superoxyde mitochondrial confirmée sur 3 lignées KO (p < 0.001)",
            action: "auto_accepted",
            confidence: 0.89,
            signal_accord: 0.88,
            signal_fidelite: 0.90,
            signal_certitude: 0.89,
            signal_compliance: 0.88,
            corroborating_sources: ["doc_jbc_2019"],
            valid_from: "2026-08-17T00:00:00Z",
            valid_until: null,
            invalidated_by: null,
          },
        ],
        contradicted_by: [],
        corroborated_by: ["atom_sod2_002"],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Relations entre Atoms
// ---------------------------------------------------------------------------

export const SYNTHETIC_RELATIONS: VceRelation[] = [
  {
    relation_id: "rel_001",
    source_atom: "atom_sod2_001",
    target_atom: "atom_sod2_cell_001",
    type: "contradicts",
    label: "CONTRADICTION : Induction SOD2 par ROS",
    confidence: 0.96,
    assertion:
      "JBC 2019 affirme que SOD2 est uprégulé par les ROS mitochondriaux dans les cardiomyocytes. Cell 2022 conteste cette induction in vivo dans des conditions physiologiques.",
  },
  {
    relation_id: "rel_002",
    source_atom: "atom_nature_001",
    target_atom: "atom_sod2_cell_001",
    type: "contradicts",
    label: "CONTRADICTION : SOD2 réponse adaptative",
    confidence: 0.89,
    assertion:
      "Nature 2021 établit SOD2 comme réponse adaptative primaire. Cell 2022 ne peut pas reproduire ce résultat in vivo.",
  },
  {
    relation_id: "rel_003",
    source_atom: "atom_sod2_001",
    target_atom: "atom_nature_001",
    type: "corroborates",
    label: "corrobore",
    confidence: 0.94,
    assertion: "JBC 2019 et Nature 2021 convergent sur le mécanisme d'upregulation de SOD2 par les ROS mitochondriaux.",
  },
  {
    relation_id: "rel_004",
    source_atom: "atom_brevet_001",
    target_atom: "atom_sod2_001",
    type: "extends",
    label: "étend / application thérapeutique",
    confidence: 0.85,
    assertion:
      "Le brevet US2020193418 construit une application thérapeutique sur la découverte que SOD2 répond aux ROS via PGC-1α.",
  },
  {
    relation_id: "rel_005",
    source_atom: "atom_rapport_001",
    target_atom: "atom_sod2_002",
    type: "corroborates",
    label: "corrobore",
    confidence: 0.89,
    assertion:
      "Le rapport technique 2023 réplique les résultats KO de JBC 2019 sur 3 lignées cellulaires supplémentaires.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convertit un VceAtom en nœud React Flow (format production). */
export function atomToCanvasNode(
  atom: VceAtom,
  position: { x: number; y: number },
  state: "raw_doc" | "atomizing" | "ready" = "ready"
) {
  const domainColors: Record<string, string> = {
    medical: "#10b981",
    patent: "#f59e0b",
    legal: "#8b5cf6",
    code_source: "#3b82f6",
    default: "#64748b",
  };

  return {
    id: atom.atom_id,
    type: "custom",
    position,
    data: {
      label: atom.source_doc,
      category: atom.domain === "patent" ? "note" : "hypothesis",
      isDocument: true,
      atomizingState: state,
      attentionScore: atom.attention_score,
      domain: atom.domain,
      domainColor: domainColors[atom.domain] || "#64748b",
      vceClaims: atom.claims,
      contradictedBy: atom.contradicted_by,
      corroboratedBy: atom.corroborated_by,
      isC3: atom.is_c3,
      fidelityScore: atom.fidelity_score,
      documentData: [
        {
          type: "heading",
          content: [{ type: "text", text: atom.source_doc, styles: {} }],
          props: { level: 2 },
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: atom.text, styles: {} }],
        },
      ],
      messages: [{ role: "assistant", content: atom.text }],
    },
  };
}

/** Convertit une VceRelation en edge React Flow. */
export function relationToCanvasEdge(rel: VceRelation) {
  return {
    id: rel.relation_id,
    source: rel.source_atom,
    target: rel.target_atom,
    type: "custom",
    label: rel.label,
    data: {
      isContradiction: rel.type === "contradicts",
      isCorroboration: rel.type === "corroborates",
      isCitation: rel.type === "cites",
      isExtension: rel.type === "extends",
      assertion: rel.assertion,
      confidence: rel.confidence,
      relationType: rel.type,
    },
  };
}

/** Calcule les positions en grille pour N documents. */
export function gridPositions(count: number, cols = 3): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    x: (i % cols) * 520 + 80,
    y: Math.floor(i / cols) * 380 + 80,
  }));
}
