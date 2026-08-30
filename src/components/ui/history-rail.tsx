"use client";

import { Clock, Eye, MoveUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TurnRecord {
  index: number;
  id: string;
  timestamp: number;
  previewText: string;
  retentionState: 'active' | 'visible' | 'fading' | 'collapsed' | 'archived';
  fullContent: string;
}

interface HistoryRailProps {
  turns: TurnRecord[];
  onScrollToTurn: (index: number) => void;
  onEjectTurn: (turn: TurnRecord) => void;
}

export function HistoryRail({ turns, onScrollToTurn, onEjectTurn }: HistoryRailProps) {
  if (turns.length === 0) return null;

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 py-4 px-1.5 bg-[#0e0e11]/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl pointer-events-auto">
      <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-1">
        <Clock className="w-2.5 h-2.5" />
      </div>

      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar px-0.5">
        {turns.map((turn) => {
          const opacityClass =
            turn.retentionState === 'active' ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
            turn.retentionState === 'visible' ? 'bg-neutral-700 text-white hover:bg-neutral-600' :
            turn.retentionState === 'fading' ? 'bg-yellow-600/60 text-yellow-200 hover:bg-yellow-600' :
            'bg-neutral-900 text-neutral-600 hover:text-white border border-neutral-800';

          return (
            <div key={turn.id} className="relative group/rail">
              <button
                onClick={() => onScrollToTurn(turn.index)}
                className={cn(
                  "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer",
                  opacityClass
                )}
                title={`Tour ${turn.index + 1} — ${turn.previewText}`}
              >
                {turn.index + 1}
              </button>

              {/* Popover au survol */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden group-hover/rail:flex flex-col gap-1 p-2 bg-[#141418] border border-neutral-700 rounded-xl shadow-2xl min-w-[220px] max-w-[280px] z-50 text-left animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                  <span className="text-[10px] font-bold text-neutral-400">Tour #{turn.index + 1}</span>
                  <span className="text-[9px] text-neutral-500">{new Date(turn.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[11px] text-neutral-300 line-clamp-3 font-sans leading-snug">
                  {turn.previewText}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 mt-1">
                  <button
                    onClick={() => onScrollToTurn(turn.index)}
                    className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white"
                  >
                    <Eye className="w-3 h-3" /> Aller au tour
                  </button>
                  <button
                    onClick={() => onEjectTurn(turn)}
                    className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                  >
                    <MoveUpRight className="w-3 h-3" /> Éjecter
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
