"use client";

import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Layers, Sparkles, Folder, FileCode, FileText, Bot, Play, GitCompare, Code2, Edit3, X, Maximize2 } from "lucide-react";
import { CentralComparisonTable, ComparisonItem } from "./central-comparison-table";

export interface VceSubsystemNodeData {
  label: string;
  category?: string;
  isSubsystem?: boolean;
  subsystemFiles?: Array<{
    id: string;
    name: string;
    type: 'code' | 'doc' | 'claim';
    path?: string;
    content?: string;
  }>;
  activeAgentRole?: 'refactor' | 'research' | 'doc' | 'sentinel';
}

export function VceSubsystemNode({ data, selected }: { data: VceSubsystemNodeData; selected?: boolean }) {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [activeMode, setActiveMode] = useState<'EXPLORE' | 'EDIT' | 'COMPARE' | 'AGENT' | 'NONE'>('NONE');
  const [activeFileForEdit, setActiveFileForEdit] = useState<any | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent', text: string }>>([
    { sender: 'agent', text: 'Bonjour ! Je suis l\'agent dédié à ce sous-système. Que souhaitez-vous analyser ou modifier dans ces atomes ?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [fileTreeVisible, setFileTreeVisible] = useState(false);

  const files = data.subsystemFiles || [
    { id: 'f1', name: 'core_engine.py', type: 'code', detail: 'Moteur d\'exécution AST', content: '# Core AST Engine\ndef process_ast():\n    pass' },
    { id: 'f2', name: 'claims_validator.ts', type: 'code', detail: 'Valideur de signaux CVI', content: '// CVI Validator\nexport function validateClaim(claim: string) {\n  return true;\n}' },
    { id: 'f3', name: 'architecture_spec.md', type: 'doc', detail: 'Rapport de synthèse R&D', content: '# Architecture Spec\nSpécification du monde unifié VCE.' },
  ];

  const toggleFileSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileIds(prev =>
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  return (
    <div
      className={cn(
        "relative min-w-[380px] max-w-[440px] rounded-3xl p-5 backdrop-blur-2xl transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border font-sans",
        selected
          ? "bg-purple-950/40 border-purple-400/60 ring-2 ring-purple-500/30"
          : "bg-[#0d0e15]/80 border-white/15 hover:border-white/25"
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-neutral-900" />

      {/* HEADER DU SOUS-SYSTÈME (Groupe Spatial Canvas) */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-mono text-purple-400 uppercase tracking-widest">GROUPE DE SOUS-SYSTÈME VCE</div>
            <h3 className="text-sm font-semibold text-white tracking-wide">{data.label}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-300 bg-purple-950/50 border border-purple-500/30 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          <span>{files.length} Atomes</span>
        </div>
      </div>

      {/* BARRE D'ACTIONS CONTEXTUELLES & BIFURCATIONS */}
      <div className="flex items-center gap-2 mb-3">
        {/* ACTION 1: EXPLORER (Bifurcation Discuter vs Naviguer) */}
        <button
          onClick={() => setActiveMode(prev => prev === 'EXPLORE' ? 'NONE' : 'EXPLORE')}
          className={cn(
            "px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5",
            activeMode === 'EXPLORE'
              ? "bg-purple-600 text-white border-purple-400"
              : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
          )}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Explorer</span>
        </button>

        {/* ACTION 2: MODIFIER (Bifurcation Édition Humaine vs Agent) */}
        <button
          onClick={() => setActiveMode(prev => prev === 'EDIT' ? 'NONE' : 'EDIT')}
          className={cn(
            "px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5",
            activeMode === 'EDIT'
              ? "bg-blue-600 text-white border-blue-400"
              : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
          )}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Modifier</span>
        </button>

        {/* ACTION 3: COMPARER (Actif uniquement sur sélection multiple >= 2) */}
        <button
          disabled={selectedFileIds.length < 2}
          onClick={() => setActiveMode('COMPARE')}
          className={cn(
            "px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5",
            selectedFileIds.length >= 2
              ? "bg-emerald-600/40 border-emerald-500/50 text-emerald-200 cursor-pointer hover:bg-emerald-600/60"
              : "bg-white/5 border-white/5 text-neutral-600 cursor-not-allowed opacity-50"
          )}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Comparer ({selectedFileIds.length})</span>
        </button>
      </div>

      {/* BIFURCATION MODE: EXPLORER */}
      {activeMode === 'EXPLORE' && (
        <div className="p-3 mb-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs animate-in fade-in duration-200">
          <div className="text-[10px] font-mono text-purple-300 mb-2 uppercase tracking-wider">Mode d'Exploration :</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => setFileTreeVisible(false)}
              className={cn("p-2 rounded-xl border text-left text-[11px]", !fileTreeVisible ? "bg-purple-800/60 border-purple-400 text-white" : "bg-purple-900/40 border-purple-500/30 text-purple-200")}
            >
              💬 Discuter avec l'IA du sous-système
            </button>
            <button
              onClick={() => setFileTreeVisible(true)}
              className={cn("p-2 rounded-xl border text-left text-[11px]", fileTreeVisible ? "bg-purple-800/60 border-purple-400 text-white" : "bg-purple-900/40 border-purple-500/30 text-purple-200")}
            >
              📁 Parcourir l'arborescence des fichiers
            </button>
          </div>

          {!fileTreeVisible ? (
            <div className="space-y-2 pt-2 border-t border-purple-500/20">
              <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={cn("p-2 rounded-lg text-[11px]", msg.sender === 'user' ? "bg-purple-900/50 text-purple-200 ml-4 text-right" : "bg-white/10 text-neutral-200 mr-4")}>
                    {msg.text}
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  const text = chatInput;
                  setChatMessages(prev => [...prev, { sender: 'user', text }]);
                  setChatInput('');
                  setTimeout(() => {
                    setChatMessages(prev => [...prev, { sender: 'agent', text: `Analyse de "${text}" effectuée sur le sous-système ${data.label}. Les atomes sont certifiés SHA-256.` }]);
                  }, 600);
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Poser une question au sous-système..."
                  className="flex-1 bg-black/40 border border-purple-500/30 rounded-lg px-2 py-1 text-[11px] text-white outline-none focus:border-purple-400"
                />
                <button type="submit" className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] rounded-lg font-bold">
                  Envoyer
                </button>
              </form>
            </div>
          ) : (
            <div className="p-2 bg-black/40 rounded-xl border border-purple-500/20 text-[11px] font-mono text-purple-300 space-y-1">
              <div>📁 Root/</div>
              {files.map(f => (
                <div key={f.id} className="pl-4 text-neutral-300 hover:text-white cursor-pointer flex items-center gap-1.5">
                  <span>📄</span> {f.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BIFURCATION MODE: MODIFIER */}
      {activeMode === 'EDIT' && (
        <div className="p-3 mb-3 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-xs animate-in fade-in duration-200">
          <div className="text-[10px] font-mono text-blue-300 mb-2 uppercase tracking-wider">Choisir le mode d'édition :</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const targetFile = files[0];
                setActiveFileForEdit(targetFile);
              }}
              className="p-2 rounded-xl bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 text-left text-blue-200 text-[11px]"
            >
              ✍️ Édition Humaine Plein Écran
            </button>
            <button
              onClick={() => {
                setChatMessages(prev => [...prev, { sender: 'agent', text: '🤖 Agent initialisé : Modification automatique des atomes en cours...' }]);
                setActiveMode('EXPLORE');
                setFileTreeVisible(false);
              }}
              className="p-2 rounded-xl bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 text-left text-blue-200 text-[11px]"
            >
              🤖 Déléguer la modif à l'Agent
            </button>
          </div>
        </div>
      )}

      {/* LISTE DES ATOMES / FICHIERS (AVEC SÉLECTION MULTIPLE POUR COMPARER) */}
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
        {files.map(file => {
          const isSelected = selectedFileIds.includes(file.id);
          return (
            <div
              key={file.id}
              onClick={(e) => toggleFileSelection(file.id, e)}
              className={cn(
                "p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                isSelected
                  ? "bg-purple-900/40 border-purple-400 text-white"
                  : "bg-white/5 border-white/5 hover:bg-white/10 text-neutral-300"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="rounded border-white/20 bg-black/40 text-purple-500 focus:ring-0 cursor-pointer"
                />
                {file.type === 'code' ? (
                  <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="text-xs font-mono truncate">{file.name}</span>
              </div>

              <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300 font-sans">
                {file.detail || "Certifié"}
              </span>
            </div>
          );
        })}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-neutral-900" />

      {/* OVERLAY PLEIN ÉCRAN POUR ÉDITION HUMAINE (MONACO / BLOCKNOTE) */}
      {activeFileForEdit && (
        <div className="fixed inset-0 z-[12000] bg-neutral-950/95 backdrop-blur-2xl p-8 flex flex-col font-sans animate-in fade-in duration-200 pointer-events-auto">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <Maximize2 className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">Édition Plein Écran — {activeFileForEdit.name}</h2>
                <p className="text-xs text-neutral-400 font-mono">Sous-Système : {data.label} | Mode Humain Direct</p>
              </div>
            </div>
            <button
              onClick={() => setActiveFileForEdit(null)}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col">
            <div className="text-xs font-mono text-purple-300 mb-2 uppercase">Éditeur de Matière</div>
            <textarea
              defaultValue={activeFileForEdit.content || `# ${activeFileForEdit.name}\n\nContenu de l'atome sous-système.`}
              className="w-full flex-1 bg-transparent text-white font-mono text-sm outline-none resize-none p-2 border border-white/5 rounded-xl focus:border-purple-500/50"
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-mono">Changements synchronisés en temps réel avec le monde VCE</span>
            <button
              onClick={() => setActiveFileForEdit(null)}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
            >
              Enregistrer & Quitter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* MATRICE DE COMPARAISON CENTRALISÉE Superposée */}
      <CentralComparisonTable
        isOpen={activeMode === 'COMPARE'}
        onClose={() => setActiveMode('NONE')}
        items={files
          .filter(f => selectedFileIds.includes(f.id))
          .map(f => ({
            id: f.id,
            title: f.name,
            content: f.content || `Fichier ${f.name} (${f.type}). Detail: ${f.detail || 'Atome certifié'}`,
            provenance: `Sous-Système ${data.label}`,
            version: 'v1.0'
          }))
        }
      />
    </div>
  );
}
