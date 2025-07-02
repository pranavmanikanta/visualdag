import React, { useState } from 'react';
import { 
  Plus, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  GitBranch,
  Download,
  Upload,
  Save,
  Clock
} from 'lucide-react';

interface ControlPanelProps {
  onAddNode: (label: string) => void;
  onClear: () => void;
  onAutoLayout: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  nodeCount: number;
  edgeCount: number;
  isSaving: boolean;
  lastSaved: Date | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddNode,
  onClear,
  onAutoLayout,
  onUndo,
  onRedo,
  onExport,
  onImport,
  onSave,
  canUndo,
  canRedo,
  nodeCount,
  edgeCount,
  isSaving,
  lastSaved,
}) => {
  const [nodeLabel, setNodeLabel] = useState('');

  const handleAddNode = () => {
    if (nodeLabel.trim()) {
      onAddNode(nodeLabel.trim());
      setNodeLabel('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddNode();
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white p-6 border-r border-gray-200 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Save Status */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800">Save Status</h3>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
          <div className="flex items-center space-x-1 text-xs text-blue-600">
            <Clock className="h-3 w-3" />
            <span>Last saved: {formatLastSaved(lastSaved)}</span>
          </div>
        </div>

        {/* Graph Stats */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Graph Stats</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Nodes: {nodeCount}</div>
            <div>Edges: {edgeCount}</div>
          </div>
        </div>

        {/* Add Node */}
        <div>
          <h3 className="text-sm font-medium text-gray-800 mb-3">Add Node</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter node label"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleAddNode}
              disabled={!nodeLabel.trim()}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Node</span>
            </button>
          </div>
        </div>

        {/* History Controls */}
        <div>
          <h3 className="text-sm font-medium text-gray-800 mb-3">History</h3>
          <div className="flex space-x-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Undo</span>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <RotateCw className="h-4 w-4" />
              <span>Redo</span>
            </button>
          </div>
        </div>

        {/* Layout Controls */}
        <div>
          <h3 className="text-sm font-medium text-gray-800 mb-3">Layout</h3>
          <button
            onClick={onAutoLayout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            <GitBranch className="h-4 w-4" />
            <span>Auto Layout</span>
          </button>
        </div>

        {/* Import/Export */}
        <div>
          <h3 className="text-sm font-medium text-gray-800 mb-3">Data</h3>
          <div className="space-y-2">
            <button
              onClick={onExport}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <label className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Clear Graph */}
        <div>
          <h3 className="text-sm font-medium text-gray-800 mb-3">Actions</h3>
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Graph</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;