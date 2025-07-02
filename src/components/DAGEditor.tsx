import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  NodeTypes,
  MarkerType,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import ControlPanel from './ControlPanel';
import ValidationPanel from './ValidationPanel';
import { useDAGValidation } from '../hooks/useDAGValidation';
import { useHistory } from '../hooks/useHistory';
import { useDAGGraphs } from '../hooks/useDAGGraphs';
import { getLayoutedElements } from '../utils/autoLayout';
import { NodeData } from '../types/graph';
import { DAGGraph } from '../types/database';
import toast from 'react-hot-toast';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const defaultEdgeOptions = {
  animated: true,
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#374151',
  },
  style: {
    stroke: '#374151',
    strokeWidth: 2,
  },
};

interface DAGEditorProps {
  selectedGraph: DAGGraph | null;
  projectId: string;
}

const DAGEditorInner: React.FC<DAGEditorProps> = ({ selectedGraph, projectId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const { updateGraph } = useDAGGraphs(projectId);
  const validation = useDAGValidation(nodes, edges);
  const { pushToHistory, undo, redo, canUndo, canRedo } = useHistory([], []);
  
  const connectingNodeId = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load graph data when selectedGraph changes
  useEffect(() => {
    if (selectedGraph) {
      const graphNodes = Array.isArray(selectedGraph.nodes) ? selectedGraph.nodes : [];
      const graphEdges = Array.isArray(selectedGraph.edges) ? selectedGraph.edges : [];
      
      setNodes(graphNodes);
      setEdges(graphEdges);
      
      // Update counter to avoid ID conflicts
      if (graphNodes.length > 0) {
        const maxId = Math.max(...graphNodes.map((n: Node) => parseInt(n.id) || 0));
        setNodeIdCounter(maxId + 1);
      } else {
        setNodeIdCounter(1);
      }
    } else {
      setNodes([]);
      setEdges([]);
      setNodeIdCounter(1);
    }
  }, [selectedGraph, setNodes, setEdges]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!selectedGraph || nodes.length === 0) return;

    setIsSaving(true);
    try {
      await updateGraph(selectedGraph.id, nodes, edges, validation);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedGraph, nodes, edges, validation, updateGraph]);

  // Debounced auto-save
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, autoSave]);

  // Manual save
  const handleSave = useCallback(async () => {
    if (!selectedGraph) {
      toast.error('No graph selected');
      return;
    }

    setIsSaving(true);
    try {
      await updateGraph(selectedGraph.id, nodes, edges, validation);
      setLastSaved(new Date());
      toast.success('Graph saved successfully');
    } catch (error) {
      toast.error('Failed to save graph');
    } finally {
      setIsSaving(false);
    }
  }, [selectedGraph, nodes, edges, validation, updateGraph]);

  // Save to history when nodes or edges change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      pushToHistory(nodes, edges);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, pushToHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 's') {
          event.preventDefault();
          handleSave();
        } else if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          const state = undo();
          if (state) {
            setNodes(state.nodes);
            setEdges(state.edges);
          }
        } else if (event.key === 'z' && event.shiftKey || event.key === 'y') {
          event.preventDefault();
          const state = redo();
          if (state) {
            setNodes(state.nodes);
            setEdges(state.edges);
          }
        }
      }
      
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter(node => node.selected);
        const selectedEdges = edges.filter(edge => edge.selected);
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();
          setNodes(prev => prev.filter(node => !node.selected));
          setEdges(prev => prev.filter(edge => !edge.selected));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, undo, redo, setNodes, setEdges, handleSave]);

  const isValidConnection = useCallback((connection: Connection) => {
    // Prevent self-referential edges
    if (connection.source === connection.target) {
      return false;
    }

    // Check if this edge would create a cycle
    const wouldCreateCycle = (sourceId: string, targetId: string): boolean => {
      const visited = new Set<string>();
      const recStack = new Set<string>();
      
      const adjacencyList = new Map<string, string[]>();
      
      // Build adjacency list with existing edges
      nodes.forEach(node => adjacencyList.set(node.id, []));
      edges.forEach(edge => {
        const sourceConnections = adjacencyList.get(edge.source) || [];
        sourceConnections.push(edge.target);
        adjacencyList.set(edge.source, sourceConnections);
      });
      
      // Add the potential new edge
      const sourceConnections = adjacencyList.get(sourceId) || [];
      sourceConnections.push(targetId);
      adjacencyList.set(sourceId, sourceConnections);

      const dfs = (nodeId: string): boolean => {
        visited.add(nodeId);
        recStack.add(nodeId);

        const neighbors = adjacencyList.get(nodeId) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (dfs(neighbor)) return true;
          } else if (recStack.has(neighbor)) {
            return true;
          }
        }

        recStack.delete(nodeId);
        return false;
      };

      for (const node of nodes) {
        if (!visited.has(node.id)) {
          if (dfs(node.id)) return true;
        }
      }
      return false;
    };

    return !wouldCreateCycle(connection.source!, connection.target!);
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        setEdges((eds) => addEdge(params, eds));
      } else {
        toast.error('Connection would create a cycle');
      }
    },
    [setEdges, isValidConnection]
  );

  const onAddNode = useCallback((label: string) => {
    const newNode: Node = {
      id: nodeIdCounter.toString(),
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: { label, id: nodeIdCounter.toString() } as NodeData,
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNodeIdCounter(prev => prev + 1);
  }, [nodeIdCounter, setNodes]);

  const onClear = useCallback(() => {
    if (confirm('Are you sure you want to clear the graph? This action cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      setNodeIdCounter(1);
    }
  }, [setNodes, setEdges]);

  const onAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges]);

  const onExport = useCallback(() => {
    const data = {
      nodes,
      edges,
      graphName: selectedGraph?.name || 'Untitled Graph',
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedGraph?.name || 'graph'}-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges, selectedGraph]);

  const onImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
          
          // Update counter to avoid ID conflicts
          const maxId = Math.max(...data.nodes.map((n: Node) => parseInt(n.id) || 0));
          setNodeIdCounter(maxId + 1);
          
          toast.success('Graph imported successfully');
        }
      } catch (error) {
        console.error('Invalid file format:', error);
        toast.error('Invalid file format. Please select a valid DAG export file.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  }, [setNodes, setEdges]);

  if (!selectedGraph) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Graph Selected</h3>
          <p className="text-gray-600">Select a graph from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Control Panel */}
      <div className="w-80 flex-shrink-0">
        <ControlPanel
          onAddNode={onAddNode}
          onClear={onClear}
          onAutoLayout={onAutoLayout}
          onUndo={() => {
            const state = undo();
            if (state) {
              setNodes(state.nodes);
              setEdges(state.edges);
            }
          }}
          onRedo={() => {
            const state = redo();
            if (state) {
              setNodes(state.nodes);
              setEdges(state.edges);
            }
          }}
          onExport={onExport}
          onImport={onImport}
          onSave={handleSave}
          canUndo={canUndo}
          canRedo={canRedo}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 flex flex-col">
        {/* Validation Panel */}
        <div className="p-4 bg-white border-b border-gray-200">
          <ValidationPanel validation={validation} />
        </div>

        {/* ReactFlow */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            isValidConnection={isValidConnection}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <Background color="#f1f5f9" gap={20} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

const DAGEditor: React.FC<DAGEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <DAGEditorInner {...props} />
    </ReactFlowProvider>
  );
};

export default DAGEditor;