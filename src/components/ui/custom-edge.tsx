import React, { useContext } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { X, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { useCanvas } from '@/contexts/CanvasContext';
import { EdgeModalContext } from './canvas';
import { cn } from '@/lib/utils';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  label,
  data,
}: EdgeProps) {
  const { activeEdgeId, setActiveEdgeId } = useContext(EdgeModalContext);
  const showDetailModal = activeEdgeId === id;
  const edgeData = (data || {}) as Record<string, any>;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isContradiction = edgeData.isContradiction || edgeData.relationType === "contradicts" || label?.toString().toLowerCase().includes('contradiction') || label?.toString().toLowerCase().includes('erreur');
  const isCorroboration = edgeData.isCorroboration || edgeData.relationType === "corroborates" || label?.toString().toLowerCase().includes('corrobore');

  // Palette de couleur épurée (Fils de Soie Lumineux)
  const strokeColor = isContradiction
    ? 'rgba(239, 68, 68, 0.4)'
    : isCorroboration
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(255, 255, 255, 0.12)';

  return (
    <>
      {/* Arête principale (Fil de Soie Discret) */}
      <BaseEdge
        path={edgePath}
        style={{
          strokeWidth: isContradiction ? 1.5 : 1,
          stroke: strokeColor,
          transition: 'stroke 0.4s ease, stroke-width 0.4s ease, opacity 0.4s ease',
          ...style,
        }}
      />

      <EdgeLabelRenderer>
        {showDetailModal && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan z-50 animate-in fade-in zoom-in-95 font-sans"
          >
            {/* Popover en verre dépoli ultra-épuré au clic sur le fil */}
            <div className="w-64 p-3 bg-neutral-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl text-xs text-neutral-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
                  {isContradiction ? "⚡ Contradiction" : "✦ Lien Sémantique"}
                </span>
                <button onClick={() => setActiveEdgeId(null)} className="text-neutral-400 hover:text-white text-[11px] p-0.5">✕</button>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-300 font-sans">
                {String(edgeData.assertion || `Lien sémantique de dépendance entre les atomes.`)}
              </p>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
