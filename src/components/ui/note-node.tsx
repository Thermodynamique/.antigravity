import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { BookMarked, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvas } from "@/contexts/CanvasContext";

interface NoteNodeProps {
    id: string;
    data: any;
    selected?: boolean;
    lastMessage: string;
}

export const NoteNode = memo(({ id, data, selected, lastMessage }: NoteNodeProps) => {
    const { setNodes, setEdges } = useCanvas();
    return (
        <div
            className={cn(
                "relative group flex flex-col w-[130px] h-[130px] bg-[#1a1814] text-yellow-500 shadow-md transition-all duration-300 border border-yellow-900/50 hover:border-yellow-700/80 hover:shadow-xl rotate-1 hover:rotate-0",
                selected && "ring-2 ring-yellow-600/50 scale-[1.02] z-50 border-yellow-600/50"
            )}
            style={{
                borderBottomRightRadius: '16px',
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px',
                borderBottomLeftRadius: '4px'
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-2 h-2 bg-yellow-700 rounded-none opacity-0 group-hover:opacity-100 transition-opacity border-none"
            />

            <div className="flex items-center justify-between p-2 bg-[#1f1b13] border-b border-yellow-900/30 shrink-0">
                <div className="flex items-center gap-2">
                    <BookMarked className="w-3.5 h-3.5 text-yellow-600" />
                    <span className="text-[10px] font-semibold text-yellow-700/80 uppercase tracking-widest">Note</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setNodes(nds => nds.filter(n => n.id !== id));
                        setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id));
                    }}
                    className="p-1 text-yellow-700 hover:text-red-400 hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                    title="Supprimer la note"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            <div className="flex-1 p-2.5 overflow-hidden">
                <p className="text-[10px] font-medium leading-relaxed line-clamp-5 text-neutral-400">
                    {lastMessage || data.label}
                </p>
            </div>

            {/* Fold corner effect */}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#241f15] border-t border-l border-yellow-900/50 rounded-tl-md shadow-[-2px_-2px_4px_rgba(0,0,0,0.2)]" />

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-2 h-2 bg-yellow-700 rounded-none opacity-0 group-hover:opacity-100 transition-opacity border-none"
            />
        </div>
    );
});
