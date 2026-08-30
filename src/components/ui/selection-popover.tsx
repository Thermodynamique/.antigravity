"use client";

import { useEffect, useState, useCallback } from "react";
import { Scissors, Bookmark, Layers, X, MoveUpRight } from "lucide-react";
import { useRigorousResearch } from "@/contexts/RigorousResearchContext";

interface SelectionPopoverProps {
  onEjectToSpace?: (text: string) => void;
  onMarkImportant?: (text: string) => void;
  onAddToCompare?: (text: string) => void;
}

export function SelectionPopover({ onEjectToSpace, onMarkImportant, onAddToCompare }: SelectionPopoverProps) {
  const [selectedText, setSelectedText] = useState<string>("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const { addExtractedFragment } = useRigorousResearch();

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setPosition(null);
      setSelectedText("");
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setPosition(null);
      setSelectedText("");
      return;
    }

    const anchor = selection.anchorNode?.parentElement;
    if (anchor?.closest('textarea, input, [contenteditable]')) {
      setPosition(null);
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        setSelectedText(text);
        setPosition({
          top: Math.max(10, rect.top - 42),
          left: Math.min(window.innerWidth - 180, Math.max(10, rect.left + rect.width / 2 - 70)),
        });
      }
    } catch {
      setPosition(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("keyup", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("keyup", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  if (!position || !selectedText) return null;

  const dismiss = () => {
    setPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  /** 1. Extraire → SpatialWindow Auto-fit */
  const handleExtractToWindow = () => {
    addExtractedFragment(selectedText, 2);
    if (onEjectToSpace) onEjectToSpace(selectedText);
    dismiss();
  };

  /** 2. Marquer Important (Niveau 2) */
  const handleImportant = () => {
    addExtractedFragment(selectedText, 2);
    if (onMarkImportant) onMarkImportant(selectedText);
    dismiss();
  };

  /** 3. Comparer dans le Bloc Central */
  const handleCompare = () => {
    if (onAddToCompare) onAddToCompare(selectedText);
    dismiss();
  };

  return (
    <div
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-[9999] flex items-center gap-1 p-1 bg-[#0d0d10]/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.9)] text-white animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
    >
      {/* 1. Extraire */}
      <button
        onClick={handleExtractToWindow}
        className="p-1.5 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
        title="Extraire le fragment en fenêtre flottante"
      >
        <MoveUpRight className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[10px]">Extraire</span>
      </button>

      <div className="w-px h-4 bg-neutral-800" />

      {/* 2. Important */}
      <button
        onClick={handleImportant}
        className="p-1.5 hover:bg-emerald-600/30 text-emerald-300 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
        title="Marquer ce fragment comme important (Niveau 2)"
      >
        <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px]">Important</span>
      </button>

      <div className="w-px h-4 bg-neutral-800" />

      {/* 3. Comparer */}
      <button
        onClick={handleCompare}
        className="p-1.5 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
        title="Ajouter au mode Comparaison du Bloc Central"
      >
        <Layers className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[10px]">Comparer</span>
      </button>

      <button
        onClick={dismiss}
        className="p-1 text-neutral-500 hover:text-white transition-colors ml-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
