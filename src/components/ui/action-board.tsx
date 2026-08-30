"use client";

import React, { useState } from "react";
import { useCanvas } from "@/contexts/CanvasContext";
import { CheckSquare, Circle, CheckCircle2, Clock, Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const CheckSquareIcon = CheckSquare as any;
const CircleIcon = Circle as any;
const CheckCircle2Icon = CheckCircle2 as any;
const ClockIcon = Clock as any;
const PlusIcon = Plus as any;
const GripVerticalIcon = GripVertical as any;

export function ActionBoard() {

    const { actions, setActions } = useCanvas();


    const addAction = (action: any) => {
        setActions(prev => [...prev, action]);
    };

    const updateAction = (id: string, updates: any) => {
        setActions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    const [newTaskTitle, setNewTaskTitle] = useState("");

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        addAction({
            id: `action_${Date.now()}`,
            title: newTaskTitle,
            status: 'todo'
        });
        setNewTaskTitle("");
    };

    const toggleStatus = (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'todo' ? 'in_progress' : currentStatus === 'in_progress' ? 'done' : 'todo';
        updateAction(id, { status: nextStatus as any });
    };

    const CheckCircle2Icon = CheckCircle2 as any;
    const ClockIcon = Clock as any;
    const CircleIcon = Circle as any;

    const getStatusIcon = (status: string) => {
        if (status === 'done') return <CheckCircle2Icon className="w-5 h-5 text-green-500" />;
        if (status === 'in_progress') return <ClockIcon className="w-5 h-5 text-yellow-500" />;
        return <CircleIcon className="w-5 h-5 text-neutral-500" />;
    };

    const todos = actions.filter(a => a.status === 'todo');
    const inProgress = actions.filter(a => a.status === 'in_progress');
    const done = actions.filter(a => a.status === 'done');

    const handleGenerateSynthesizedReport = () => {
        const reportContent = `# Rapport Synthétisé VCE — Multi-Domaines

## 1. Contexte & Corpus Synthétique Analysé
- **Medical / Bio-Med** : SOD2 (Mn-SOD) upregulation in cardiomyocytes (Confidence: 91%, Status: Auto-Accepted)
- **Monaco Engine (Rust)** : Async worker thread pool with zero-lock circular buffer queue
- **Brevet / Patent** : Dispositif d'intrication quantique à 4 qubits supraconducteurs

## 2. Piles d'Actions Retenues (Mémoire N0 -> N4)
${actions.map((a, i) => `${i + 1}. [${a.status.toUpperCase()}] ${a.title}`).join('\n')}

---
*Généré automatiquement par le Doc Builder Co-Pilot VCE.*`;

        const blob = new Blob([reportContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VCE_Rapport_Synthetise_${Date.now()}.md`;
        a.click();
    };

    return (
        <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-8 animate-in fade-in duration-500">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Actions & Doc Builder</h1>
                    <p className="text-neutral-400">Planifiez, exécutez et compilez vos livrables de recherche VCE.</p>
                </div>
                <button
                    onClick={handleGenerateSynthesizedReport}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2 hover:scale-105"
                >
                    <CheckSquareIcon className="w-4 h-4" />
                    <span>📑 Compiler Rapport (Doc Builder)</span>
                </button>
            </div>

            <form onSubmit={handleCreateTask} className="mb-8">
                <div className="relative flex items-center">
                    <PlusIcon className="absolute left-4 w-5 h-5 text-neutral-500" />
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Ajouter une nouvelle tâche..."
                        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-700 transition-shadow"
                    />
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden pb-4">
                {/* TO DO */}
                <div className="flex flex-col bg-neutral-900/30 rounded-2xl p-4 border border-neutral-800/50">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <CircleIcon className="w-4 h-4 text-neutral-500" />
                        <h3 className="font-semibold text-neutral-300">À faire</h3>
                        <span className="ml-auto bg-neutral-800 text-neutral-400 text-xs py-0.5 px-2 rounded-full">{todos.length}</span>
                    </div>
                    <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
                        {todos.map(task => (
                            <TaskCard key={task.id} task={task} onToggle={() => toggleStatus(task.id, task.status)} icon={getStatusIcon(task.status)} />
                        ))}
                    </div>
                </div>

                {/* IN PROGRESS */}
                <div className="flex flex-col bg-neutral-900/30 rounded-2xl p-4 border border-neutral-800/50">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <ClockIcon className="w-4 h-4 text-yellow-500" />
                        <h3 className="font-semibold text-neutral-300">En cours</h3>
                        <span className="ml-auto bg-neutral-800 text-neutral-400 text-xs py-0.5 px-2 rounded-full">{inProgress.length}</span>
                    </div>
                    <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
                        {inProgress.map(task => (
                            <TaskCard key={task.id} task={task} onToggle={() => toggleStatus(task.id, task.status)} icon={getStatusIcon(task.status)} />
                        ))}
                    </div>
                </div>

                {/* DONE */}
                <div className="flex flex-col bg-neutral-900/30 rounded-2xl p-4 border border-neutral-800/50">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <CheckCircle2Icon className="w-4 h-4 text-green-500" />
                        <h3 className="font-semibold text-neutral-300">Terminé</h3>
                        <span className="ml-auto bg-neutral-800 text-neutral-400 text-xs py-0.5 px-2 rounded-full">{done.length}</span>
                    </div>
                    <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
                        {done.map(task => (
                            <TaskCard key={task.id} task={task} onToggle={() => toggleStatus(task.id, task.status)} icon={getStatusIcon(task.status)} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TaskCard({ task, onToggle, icon }: { task: any, onToggle: () => void, icon: React.ReactElement }) {
    return (
        <div className="group flex items-start gap-3 p-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all cursor-pointer shadow-sm">
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="mt-0.5 flex-shrink-0">
                {icon}
            </button>
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm text-neutral-200 leading-relaxed", task.status === 'done' && "text-neutral-500 line-through decoration-neutral-700")}>
                    {task.title}
                </p>
                {task.sourceDocumentId && (
                    <div className="mt-2 text-[10px] font-medium text-blue-400 uppercase tracking-wider bg-blue-900/20 px-2 py-0.5 rounded w-fit">
                        Doc Lié
                    </div>
                )}
            </div>
            <button className="opacity-0 group-hover:opacity-100 p-1 text-neutral-600 hover:text-neutral-300 transition-opacity">
                <GripVerticalIcon className="w-4 h-4" />
            </button>
        </div>
    );
}
