"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, CornerDownLeft, Combine } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export interface SpatialWindowData {
  id: string;
  content: string;
  label?: string;
  x: number; // horizontal offset from screen center (negative = left, positive = right)
}

interface SpatialWindowProps {
  win: SpatialWindowData;
  isSelected: boolean;
  zIndex: number;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onReturnToChat: (id: string) => void;
  onBringToFront: (id: string) => void;
  onMove: (id: string, x: number) => void;
}

// Auto-fit responsive sizing instead of rigid 460px
const MIN_WIDTH = 320;
const MAX_WIDTH = 620;

export function SpatialWindow({
  win,
  isSelected,
  zIndex,
  onSelect,
  onClose,
  onReturnToChat,
  onBringToFront,
  onMove,
}: SpatialWindowProps) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dragRef = useRef<{ startX: number; startWinX: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- Slide-in entrance ---
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // --- Horizontal drag only ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      onMove(win.id, dragRef.current.startWinX + (e.clientX - dragRef.current.startX));
    };
    const handleMouseUp = () => {
      if (dragRef.current) { dragRef.current = null; setIsDragging(false); }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [win.id, onMove]);

  const handleBarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onBringToFront(win.id);
    dragRef.current = { startX: e.clientX, startWinX: win.x };
    setIsDragging(true);
  }, [win.id, win.x, onBringToFront]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onClose(win.id), 380);
  }, [win.id, onClose]);

  const handleReturn = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onReturnToChat(win.id), 380);
  }, [win.id, onReturnToChat]);

  // --- 3D perspective rotation (Apple Vision Pro style) ---
  // Distance from center determines rotation angle
  const absX = Math.abs(win.x);
  // Max rotation ~18deg at 800px offset
  const rotateYDeg = win.x > 0
    ? -Math.min(18, absX * 0.022)
    : Math.min(18, absX * 0.022);
  // Slight scale reduction for depth perception
  const scaleVal = Math.max(0.82, 1 - absX * 0.00025);
  // Opacity also slightly dims distant windows
  const opacityVal = Math.max(0.75, 1 - absX * 0.0003);

  // Compute dynamic width and height based on text content
  const lineCount = (win.content.match(/\n/g) || []).length + 1;
  const maxLineLength = Math.max(...win.content.split('\n').map(l => l.length), 20);
  const dynamicWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.min(600, maxLineLength * 9 + 60)));

  // Left edge of window so it stays centered on its x offset
  const sign = win.x >= 0 ? '+' : '-';
  const leftPx = `calc(50% ${sign} ${Math.abs(win.x)}px - ${dynamicWidth / 2}px)`;

  // Transition config
  const transitionDuration = isDragging ? "0ms" : "450ms";
  const transitionEasing = "cubic-bezier(0.16, 1, 0.3, 1)";

  // Entrance: start from x=0, scale=0.6, opacity=0 → animate to final
  const entranceTranslateX = mounted && !isClosing ? 0 : (win.x > 0 ? -120 : 120);
  const entranceScale = mounted && !isClosing ? scaleVal : 0.8;
  const entranceOpacity = mounted && !isClosing ? opacityVal : 0;

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-auto"
      style={{
        width: dynamicWidth,
        maxWidth: MAX_WIDTH,
        left: leftPx,
        zIndex,
        transition: `left ${transitionDuration} ${transitionEasing}`,
        perspective: "1200px",
      }}
      onClick={() => onBringToFront(win.id)}
    >
      {/* The actual panel with 3D perspective */}
      <div
        style={{
          position: "absolute",
          inset: "12px 0",
          transform: `
            translateX(${entranceTranslateX}px)
            rotateY(${rotateYDeg}deg)
            scale(${entranceScale})
          `,
          transformStyle: "preserve-3d",
          transformOrigin: win.x > 0 ? "left center" : "right center",
          opacity: entranceOpacity,
          transition: isDragging
            ? "none"
            : `transform 450ms ${transitionEasing}, opacity 450ms ${transitionEasing}`,
          borderRadius: 28,
          overflow: "hidden",
          // Layered shadow for depth
          boxShadow: isSelected
            ? "0 0 0 1px rgba(251,191,36,0.35), 0 40px 120px rgba(0,0,0,0.9), 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)"
            : "0 40px 120px rgba(0,0,0,0.9), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          // True frosted glass
          background: "rgba(16, 16, 20, 0.82)",
          backdropFilter: "blur(72px) saturate(1.8) brightness(0.95)",
          WebkitBackdropFilter: "blur(72px) saturate(1.8) brightness(0.95)",
          border: isSelected
            ? "1px solid rgba(251,191,36,0.3)"
            : "1px solid rgba(255,255,255,0.09)",
          display: "flex",
          flexDirection: "column",
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* ── macOS-style title bar ─────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.055)",
            flexShrink: 0,
            cursor: isDragging ? "grabbing" : "grab",
            background: "rgba(255,255,255,0.022)",
            userSelect: "none",
          }}
          onMouseDown={handleBarMouseDown}
        >
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", border: "none", cursor: "pointer", flexShrink: 0, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.25)" }}
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              title="Fermer"
            />
            <button
              style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", border: "none", cursor: "pointer", flexShrink: 0, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.25)" }}
              onClick={(e) => { e.stopPropagation(); handleReturn(); }}
              title="Ramener au centre"
            />
            <button
              style={{
                width: 12, height: 12, borderRadius: "50%",
                background: isSelected ? "#34d399" : "#28c840",
                border: "none", cursor: "pointer", flexShrink: 0,
                boxShadow: isSelected ? "0 0 8px rgba(52,211,153,0.6), 0 0 0 0.5px rgba(0,0,0,0.25)" : "0 0 0 0.5px rgba(0,0,0,0.25)"
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(win.id); }}
              title={isSelected ? "Désélectionner" : "Sélectionner pour fusionner"}
            />
          </div>

          {/* Title */}
          <span style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.02em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "-apple-system, 'Inter', sans-serif",
          }}>
            {win.label || "Réponse IA"}
          </span>

          {/* Return icon */}
          <button
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.22)", padding: "3px 5px",
              borderRadius: 6, display: "flex", alignItems: "center",
              flexShrink: 0, transition: "color 0.15s",
            }}
            onClick={(e) => { e.stopPropagation(); handleReturn(); }}
            title="Ramener au centre"
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
          >
            <CornerDownLeft size={13} />
          </button>
        </div>

        {/* ── Scrollable content ─────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 26px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}
        >
          <div style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: "rgba(232,232,240,0.92)",
            fontFamily: "-apple-system, 'Inter', sans-serif",
            letterSpacing: "0.01em",
          }}>
            <ReactMarkdown
              components={{
                code({ children, className, ...rest }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    <pre style={{
                      background: "rgba(0,0,0,0.45)",
                      padding: "14px 18px",
                      borderRadius: 12,
                      fontSize: 12,
                      overflowX: "auto",
                      color: "#6ee7b7",
                      border: "1px solid rgba(255,255,255,0.05)",
                      margin: "16px 0",
                      whiteSpace: "pre",
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                    }}>
                      <code {...rest}>{children}</code>
                    </pre>
                  ) : (
                    <code style={{
                      background: "rgba(255,255,255,0.06)",
                      padding: "2px 7px",
                      borderRadius: 5,
                      fontSize: 13,
                      color: "#6ee7b7",
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                    }} {...rest}>{children}</code>
                  );
                },
                h1: ({ ...p }) => <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 24, marginBottom: 8, letterSpacing: "-0.01em" }} {...p} />,
                h2: ({ ...p }) => <h2 style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginTop: 18, marginBottom: 6 }} {...p} />,
                h3: ({ ...p }) => <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginTop: 14, marginBottom: 4 }} {...p} />,
                ul: ({ ...p }) => <ul style={{ paddingLeft: 20, margin: "10px 0", listStyleType: "disc" }} {...p} />,
                ol: ({ ...p }) => <ol style={{ paddingLeft: 20, margin: "10px 0" }} {...p} />,
                li: ({ ...p }) => <li style={{ marginBottom: 5 }} {...p} />,
                strong: ({ ...p }) => <strong style={{ color: "#fff", fontWeight: 600 }} {...p} />,
                p: ({ ...p }) => <p style={{ marginBottom: 14 }} {...p} />,
                blockquote: ({ ...p }) => (
                  <blockquote style={{
                    borderLeft: "2px solid rgba(255,255,255,0.15)",
                    paddingLeft: 16,
                    color: "rgba(255,255,255,0.45)",
                    fontStyle: "italic",
                    margin: "14px 0",
                  }} {...p} />
                ),
                hr: () => <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "16px 0" }} />,
              }}
            >
              {win.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* ── Bottom action bar ─────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 18px",
          borderTop: "1px solid rgba(255,255,255,0.055)",
          flexShrink: 0,
          background: "rgba(255,255,255,0.015)",
        }}>
          <button
            onClick={handleReturn}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)",
              background: "none", border: "none", cursor: "pointer",
              padding: "5px 10px", borderRadius: 8, transition: "color 0.15s, background 0.15s",
              fontFamily: "-apple-system, 'Inter', sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "none"; }}
          >
            <CornerDownLeft size={12} />
            Ramener au centre
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onSelect(win.id); }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600,
              color: isSelected ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.3)",
              background: isSelected ? "rgba(251,191,36,0.08)" : "none",
              border: isSelected ? "1px solid rgba(251,191,36,0.2)" : "1px solid transparent",
              cursor: "pointer", padding: "5px 10px", borderRadius: 8, transition: "all 0.15s",
              fontFamily: "-apple-system, 'Inter', sans-serif",
            }}
          >
            <Combine size={12} />
            {isSelected ? "Sélectionnée" : "Fusionner"}
          </button>
        </div>
      </div>
    </div>
  );
}
