import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useCanvas } from "@/contexts/CanvasContext";

interface RootNodeProps {
    id: string;
    data: any;
    selected?: boolean;
}

export const RootNode = memo(({ id, data, selected }: RootNodeProps) => {
    const { nodes, updateNodeData } = useCanvas();

    const totalBranches = (nodes?.length || 1) - 1;
    const totalDocuments = nodes?.filter(n => n.data?.isDocument).length || 0;

    return (
        <div
            className={cn(
                "relative group flex flex-col min-w-[320px] rounded-2xl border bg-[#0a0a0a] shadow-2xl transition-all duration-300 overflow-hidden",
                selected ? "border-blue-500 shadow-blue-500/20" : "border-neutral-800"
            )}
        >
            <div className="px-5 py-4 border-b border-neutral-800/50 bg-gradient-to-r from-blue-900/20 to-transparent">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Mémoire Active</span>
                </div>
                <input
                    className="text-xl font-bold bg-transparent text-white outline-none w-full placeholder:text-neutral-700 mt-2"
                    placeholder="Nom du projet"
                    value={data.label === "Idée Principale" ? "Projet : IA Prototype" : data.label}
                    onChange={(e) => updateNodeData(id, { label: e.target.value })}
                />
            </div>

            <div className="flex flex-col gap-3 px-5 py-4 bg-[#0a0a0a]/50">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500">Branches</span>
                    <span className="text-neutral-200 font-medium">{totalBranches}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500">Documents</span>
                    <span className="text-neutral-200 font-medium">{totalDocuments}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2 pt-3 border-t border-neutral-800/50">
                    <span className="text-neutral-500">Dernière activité</span>
                    <span className="text-neutral-400 text-xs">À l'instant</span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-black rounded-full" />
        </div>
    );
});
