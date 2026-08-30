/**
 * PRIMITIVES DE DONNÉES CANONIQUES V2 (VCE INFORMATION SYSTEM)
 *
 * Découplage strict entre :
 * 1. Contenu (Content)
 * 2. Rétention (Cognitive & Context Retention)
 * 3. Provenance (Traçabilité & Source)
 * 4. Présentation (UI & Display State)
 */

export type RetentionState = 'active' | 'visible' | 'fading' | 'collapsed' | 'archived';
export type VisualState = 'full' | 'fading' | 'collapsed' | 'hidden';

export interface ProvenanceRef {
  conversationId: string;
  messageId: string;
  selectionRange?: { start: number; end: number };
  timestamp: number;
  sourceUrl?: string;
  claimId?: string;
}

export interface RetentionMetrics {
  score: number;
  state: RetentionState;
  userPinned: boolean;
  useCount: number;
  dependencyCount: number;
  lastAccessed: number;
}

export interface PresentationState {
  visualState: VisualState;
  inContextWindow: boolean; // True si inclus dans le prompt contextuel du LLM
  temporarilyExpanded: boolean;
}

export interface InformationItem {
  id: string;
  content: string;
  retention: RetentionMetrics;
  provenance: ProvenanceRef;
  presentation: PresentationState;
}

/** Primitive Fragment : entité intermédiaire autonome */
export interface Fragment {
  id: string;
  sourceMessageId: string;
  content: string;
  label: string;
  startOffset?: number;
  endOffset?: number;
  createdAt: number;
  retention: RetentionMetrics;
  provenance: ProvenanceRef;
}

/** Focus Slot State : Gestion non destructive des régénérations (V1/V2/V3) */
export interface BranchResponse {
  id: string;
  version: number;
  content: string;
  createdAt: number;
  provider?: string;
}

export interface FocusSlotState {
  activeBranchId: string;
  branches: BranchResponse[];
  userPrompt: string;
}

/** Traçabilité bilatérale Fragment -> Document */
export interface DocumentSectionMapping {
  sectionId: string;
  title: string;
  sourceFragmentIds: string[];
  status: 'valid' | 'needs_review' | 'outdated';
}
