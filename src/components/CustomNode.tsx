import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../types/graph';

const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-2 shadow-lg rounded-lg bg-white border-2 transition-all duration-200 ${
        selected 
          ? 'border-blue-500 shadow-blue-200' 
          : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-400 border-2 border-white"
      />
      <div className="text-sm font-medium text-gray-800">
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-400 border-2 border-white"
      />
    </div>
  );
};

export default CustomNode;