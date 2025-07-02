import React, { useState } from 'react';
import { Plus, GitBranch, Calendar, Trash2 } from 'lucide-react';
import { useDAGGraphs } from '../hooks/useDAGGraphs';
import { DAGGraph } from '../types/database';

interface GraphSelectorProps {
  projectId: string;
  onSelectGraph: (graph: DAGGraph) => void;
  selectedGraph: DAGGraph | null;
}

const GraphSelector: React.FC<GraphSelectorProps> = ({
  projectId,
  onSelectGraph,
  selectedGraph,
}) => {
  const { graphs, loading, createGraph, deleteGraph } = useDAGGraphs(projectId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGraphName, setNewGraphName] = useState('');

  const handleCreateGraph = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGraphName.trim()) return;

    const graph = await createGraph(newGraphName.trim());
    if (graph) {
      setNewGraphName('');
      setShowCreateForm(false);
      onSelectGraph(graph);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Graphs</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-1 text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Graph</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
          <form onSubmit={handleCreateGraph} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Graph Name
              </label>
              <input
                type="text"
                value={newGraphName}
                onChange={(e) => setNewGraphName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter graph name"
                required
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewGraphName('');
                }}
                className="bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-400 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {graphs.length === 0 ? (
        <div className="text-center py-8">
          <GitBranch className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">No graphs in this project</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            Create First Graph
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {graphs.map((graph) => (
            <div
              key={graph.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${
                selectedGraph?.id === graph.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectGraph(graph)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {graph.name}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this graph?')) {
                      deleteGraph(graph.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <span>Nodes: {Array.isArray(graph.nodes) ? graph.nodes.length : 0}</span>
                  <span>Edges: {Array.isArray(graph.edges) ? graph.edges.length : 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(graph.updated_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GraphSelector;