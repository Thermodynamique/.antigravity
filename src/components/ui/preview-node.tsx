import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DynamicPreviewBlock } from './dynamic-preview-block';

export function PreviewNode({ id, data, selected }: NodeProps) {
  return (
    <div className={`relative ${selected ? 'ring-2 ring-emerald-500/50 rounded-2xl' : ''}`}>
      {/* Target handle for incoming connections */}
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-neutral-600 border-none" />

      <div className="w-[600px] nodrag nopan">
        <DynamicPreviewBlock
          id={id}
          title={data.label as string || 'Simulation Interactive'}
          type={(data.previewType as any) || '3d-model'}
          status={(data.status as any) || 'ready'}
        />
      </div>

      {/* Source handle for outgoing connections */}
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-neutral-600 border-none" />
    </div>
  );
}
