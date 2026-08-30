"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface DocumentClaimLink {
  blockId: string;
  claimId: string;
  text: string;
  citationText: string;
  confidence: number;
  sourceDocId?: string;
  sourceTileId?: number;
  domain: string;
  validFrom: string;
  validUntil?: string | null;
  invalidatedBy?: string | null;
  status: "accepted" | "review" | "rejected" | "invalidated";
}

export interface InvalidationAlert {
  id: string;
  blockId: string;
  claimId: string;
  claimText: string;
  reason: string;
  timestamp: string;
  resolved: boolean;
}

export interface ExtractedFragment {
  id: string;
  text: string;
  sourceMessageId?: string;
  timestamp: number;
  retentionLevel: 0 | 1 | 2 | 3 | 4;
}

interface RigorousResearchContextType {
  isRigorousModeEnabled: boolean;
  setIsRigorousModeEnabled: (enabled: boolean) => void;
  toggleRigorousMode: () => void;

  documentClaims: DocumentClaimLink[];
  linkClaimToDocumentBlock: (link: Omit<DocumentClaimLink, "validFrom" | "status">) => void;
  unlinkClaimFromDocumentBlock: (blockId: string, claimId: string) => void;

  invalidationAlerts: InvalidationAlert[];
  triggerClaimInvalidation: (claimId: string, reason: string) => void;
  resolveInvalidationAlert: (alertId: string) => void;

  extractedFragments: ExtractedFragment[];
  addExtractedFragment: (text: string, retentionLevel?: 0 | 1 | 2 | 3 | 4) => ExtractedFragment;
  removeExtractedFragment: (id: string) => void;
}

const RigorousResearchContext = createContext<RigorousResearchContextType | undefined>(undefined);

export function RigorousResearchProvider({ children }: { children: ReactNode }) {
  const [isRigorousModeEnabled, setIsRigorousModeEnabled] = useState<boolean>(true);
  const [documentClaims, setDocumentClaims] = useState<DocumentClaimLink[]>([
    {
      blockId: "sample_block_1",
      claimId: "claim_stripe_1",
      text: "Stripe API SDK handles automatic retries on 401 and 429 status codes.",
      citationText: "Stripe Client automatic retry policy",
      confidence: 0.92,
      sourceDocId: "stripe_client.py",
      domain: "code_source",
      validFrom: new Date().toISOString(),
      status: "accepted"
    }
  ]);

  const [invalidationAlerts, setInvalidationAlerts] = useState<InvalidationAlert[]>([]);
  const [extractedFragments, setExtractedFragments] = useState<ExtractedFragment[]>([]);

  const toggleRigorousMode = useCallback(() => {
    setIsRigorousModeEnabled(prev => !prev);
  }, []);

  const linkClaimToDocumentBlock = useCallback((link: Omit<DocumentClaimLink, "validFrom" | "status">) => {
    const newLink: DocumentClaimLink = {
      ...link,
      validFrom: new Date().toISOString(),
      status: link.confidence >= 0.8 ? "accepted" : "review",
    };
    setDocumentClaims(prev => {
      const exists = prev.some(item => item.blockId === link.blockId && item.claimId === link.claimId);
      if (exists) return prev;
      return [...prev, newLink];
    });
  }, []);

  const unlinkClaimFromDocumentBlock = useCallback((blockId: string, claimId: string) => {
    setDocumentClaims(prev => prev.filter(item => !(item.blockId === blockId && item.claimId === claimId)));
  }, []);

  const triggerClaimInvalidation = useCallback((claimId: string, reason: string) => {
    const now = new Date().toISOString();
    setDocumentClaims(prev =>
      prev.map(c => {
        if (c.claimId === claimId) {
          return {
            ...c,
            validUntil: now,
            invalidatedBy: reason,
            status: "invalidated"
          };
        }
        return c;
      })
    );

    // Find linked blocks to create alerts
    setDocumentClaims(currentClaims => {
      const affected = currentClaims.filter(c => c.claimId === claimId);
      affected.forEach(c => {
        const newAlert: InvalidationAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          blockId: c.blockId,
          claimId: c.claimId,
          claimText: c.text,
          reason,
          timestamp: now,
          resolved: false
        };
        setInvalidationAlerts(prev => [...prev, newAlert]);
      });
      return currentClaims;
    });
  }, []);

  const resolveInvalidationAlert = useCallback((alertId: string) => {
    setInvalidationAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  }, []);

  const addExtractedFragment = useCallback((text: string, retentionLevel: 0 | 1 | 2 | 3 | 4 = 2) => {
    const fragment: ExtractedFragment = {
      id: `frag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text,
      timestamp: Date.now(),
      retentionLevel
    };
    setExtractedFragments(prev => [fragment, ...prev]);
    return fragment;
  }, []);

  const removeExtractedFragment = useCallback((id: string) => {
    setExtractedFragments(prev => prev.filter(f => f.id !== id));
  }, []);

  return (
    <RigorousResearchContext.Provider
      value={{
        isRigorousModeEnabled,
        setIsRigorousModeEnabled,
        toggleRigorousMode,
        documentClaims,
        linkClaimToDocumentBlock,
        unlinkClaimFromDocumentBlock,
        invalidationAlerts,
        triggerClaimInvalidation,
        resolveInvalidationAlert,
        extractedFragments,
        addExtractedFragment,
        removeExtractedFragment
      }}
    >
      {children}
    </RigorousResearchContext.Provider>
  );
}

export function useRigorousResearch() {
  const context = useContext(RigorousResearchContext);
  if (!context) {
    throw new Error("useRigorousResearch must be used within a RigorousResearchProvider");
  }
  return context;
}
