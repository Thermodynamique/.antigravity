import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, RotateCcw, Box, Activity, Settings2, X, DownloadCloud, Atom, Network, Terminal, Power, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThreePreview } from './three-preview';

export interface DynamicPreviewBlockProps {
  id: string;
  title: string;
  type: '3d-model' | 'physics-sim' | 'molecule' | 'neural-graph';
  status: 'loading' | 'rendering' | 'ready' | 'error';
  onClose?: () => void;
  className?: string;
  streamUrl?: string; // Future: WebRTC/NVIDIA stream URL
}

export function DynamicPreviewBlock({ id, title, type, status, onClose, className, streamUrl }: DynamicPreviewBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [fps, setFps] = useState(60);
  const [isKilled, setIsKilled] = useState(false);

  // Simulated FPS counter (will be replaced by real metrics from NVIDIA stream)
  useEffect(() => {
    if (status !== 'ready' || isKilled) return;
    const interval = setInterval(() => {
      setFps(Math.floor(55 + Math.random() * 10));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, isKilled]);

  // Escape to exit fullscreen
  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isExpanded]);

  // Dynamic theme colors per simulation type
  const themeColors = {
    '3d-model': { gradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'rgba(6,182,212,0.15)' },
    'physics-sim': { gradient: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'rgba(249,115,22,0.15)' },
    'molecule': { gradient: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'rgba(16,185,129,0.15)' },
    'neural-graph': { gradient: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'rgba(168,85,247,0.15)' }
  };

  const theme = themeColors[type] || themeColors['3d-model'];

  const TypeIcon = useCallback(() => {
    switch (type) {
      case '3d-model': return <Box className="w-4 h-4" />;
      case 'physics-sim': return <Activity className="w-4 h-4" />;
      case 'molecule': return <Atom className="w-4 h-4" />;
      case 'neural-graph': return <Network className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  }, [type]);

  const typeLabel = {
    '3d-model': 'Modèle 3D',
    'physics-sim': 'Simulation Physique',
    'molecule': 'Molécule',
    'neural-graph': 'Réseau Neuronal'
  }[type] || 'Simulation';

  const content = (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden backdrop-blur-2xl bg-[#0a0a0a]/95 border shadow-2xl",
        isExpanded ? "fixed inset-4 z-[9999] rounded-3xl" : "w-full max-w-2xl rounded-2xl",
        isExpanded ? "border-neutral-600/50" : "border-neutral-800/80 hover:border-neutral-700/80",
        "transition-[border-color,box-shadow] duration-500 ease-out",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Glow Effect */}
      <div className={cn(
        "absolute -inset-0.5 bg-gradient-to-br opacity-0 transition-opacity duration-700 blur-xl -z-10",
        theme.gradient,
        status === 'rendering' ? "opacity-30 animate-pulse" : (isHovered && !isKilled ? "opacity-20" : "opacity-0")
      )} />

      {/* Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-lg bg-black/50 border border-white/5", theme.text)}>
            <TypeIcon />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-1.5 w-1.5 relative">
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isKilled ? 'bg-red-400' : (status === 'ready' ? 'bg-emerald-400' : 'bg-yellow-400'))} />
                <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", isKilled ? 'bg-red-500' : (status === 'ready' ? 'bg-emerald-500' : 'bg-yellow-500'))} />
              </span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                {isKilled ? 'ARRÊTÉ (GPU LIBÉRÉ)' : status === 'loading' ? 'Initialisation...' : status === 'rendering' ? 'Génération...' : typeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {status === 'ready' && (
            <>
              {/* Bouton TUER / RELANCER la simulation */}
              {isKilled ? (
                <button
                  onClick={() => setIsKilled(false)}
                  className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Relancer la simulation 3D"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Relancer</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsKilled(true)}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Tuer la simulation (Arrêter la boucle 3D et libérer le GPU)"
                >
                  <Power className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setShowLogs(!showLogs)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showLogs ? "text-emerald-400 bg-emerald-500/10" : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
                title="Logs & Métriques"
              >
                <Terminal className="w-4 h-4" />
              </button>
              <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Réinitialiser la vue">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Paramètres de simulation">
                <Settings2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title={isExpanded ? "Réduire" : "Plein écran"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-1" title="Fermer la fenêtre (Masquer)">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Viewport Area */}
      <div className={cn(
        "relative w-full bg-[#050505] flex flex-col items-center justify-center overflow-hidden",
        isExpanded ? "flex-1 min-h-0" : showLogs ? "h-[280px]" : "h-[400px]"
      )}>
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

        {isKilled ? (
          <div className="z-10 flex flex-col items-center gap-3 text-neutral-400 p-6 text-center animate-in fade-in duration-300">
            <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <Power className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Simulation arrêtée</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">La boucle de rendu Three.js et le contexte WebGL ont été détruits pour libérer 100% des ressources processeur et mémoire GPU.</p>
            </div>
            <button
              onClick={() => setIsKilled(false)}
              className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-black" /> Relancer la 3D
            </button>
          </div>
        ) : status === 'rendering' ? (
          <div className="flex flex-col items-center gap-4 z-10">
            <div className="relative">
              <div className={cn("absolute inset-0 blur-xl animate-pulse opacity-50 rounded-full", theme.gradient)} />
              <DownloadCloud className={cn("w-8 h-8 animate-bounce relative", theme.text)} />
            </div>
            <p className="text-sm font-mono tracking-widest text-neutral-400 animate-pulse">COMPILATION DU RENDU CLOUD...</p>
          </div>
        ) : status === 'ready' ? (
          <div className="absolute inset-0 z-10">
            <ThreePreview type={type} isKilled={isKilled} />
          </div>
        ) : (
          <div className="z-10 text-neutral-600 flex flex-col items-center gap-2">
            <p className="font-mono text-xs tracking-widest uppercase">Canvas de rendu WebGL / Iframe</p>
            <p className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/5">En attente du flux serveur</p>
          </div>
        )}

        {/* Subtle overlay gradients for depth */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0a0a0a]/80 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0a]/80 to-transparent pointer-events-none" />
      </div>

      {/* Streaming Logs Panel (expandable) */}
      {showLogs && status === 'ready' && (
        <div className="border-t border-white/5 bg-[#060606] shrink-0">
          <div className="px-4 py-2 max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:hidden font-mono text-[10px] text-neutral-500 space-y-0.5">
            <p><span className="text-emerald-500/70">[STREAM]</span> Connexion au moteur de rendu établie</p>
            <p><span className="text-blue-500/70">[GPU]</span> NVIDIA RTX • CUDA 12.4 • VRAM: 22.4GB / 24GB</p>
            <p><span className="text-yellow-500/70">[SCENE]</span> {title} — {typeLabel} chargé</p>
            <p><span className="text-emerald-500/70">[PERF]</span> FPS: {fps} | Latence: {Math.floor(30 + Math.random() * 20)}ms | Triangles: 142K</p>
            {streamUrl && <p><span className="text-purple-500/70">[OMNIVERSE]</span> Stream URL: {streamUrl}</p>}
          </div>
        </div>
      )}

      {/* Footer / Status Bar */}
      {status === 'ready' && (
        <div className="px-4 py-2 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between text-[10px] font-mono text-neutral-500 shrink-0">
          <div className="flex items-center gap-3">
            <span className={cn("flex items-center gap-1", fps > 50 ? "text-emerald-500/70" : "text-yellow-500/70")}>
              FPS: {fps}
            </span>
            <span>Latence: {Math.floor(30 + Math.random() * 20)}ms</span>
          </div>
          <span className="text-neutral-600">Moteur: {streamUrl ? 'NVIDIA Omniverse' : 'Cloud Render V2'}</span>
        </div>
      )}
    </div>
  );

  // Use a React Portal for fullscreen mode to escape Canvas transform context
  if (isExpanded && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
