import { useMemo } from 'react';
import { Node, Edge } from 'reactflow';
import { GraphValidation } from '../types/graph';

export const useDAGValidation = (nodes: Node[], edges: Edge[]): GraphValidation => {
  return useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum node requirement
    if (nodes.length < 2) {
      warnings.push('Graph should have at least 2 nodes for meaningful connections');
    }

    // Check for cycles using DFS
    const hasCycle = () => {
      const visited = new Set<string>();
      const recStack = new Set<string>();
      
      const adjacencyList = new Map<string, string[]>();
      
      // Build adjacency list
      nodes.forEach(node => adjacencyList.set(node.id, []));
      edges.forEach(edge => {
        const sourceConnections = adjacencyList.get(edge.source) || [];
        sourceConnections.push(edge.target);
        adjacencyList.set(edge.source, sourceConnections);
      });

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

    if (hasCycle()) {
      errors.push('Graph contains cycles - DAG must be acyclic');
    }

    // Check for self-referential edges
    const selfReferentialEdges = edges.filter(edge => edge.source === edge.target);
    if (selfReferentialEdges.length > 0) {
      errors.push('Self-referential edges are not allowed in a DAG');
    }

    // Check connectivity (if more than 1 node)
    if (nodes.length > 1) {
      const connectedNodes = new Set<string>();
      edges.forEach(edge => {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
      });

      if (connectedNodes.size < nodes.length && edges.length > 0) {
        warnings.push('Some nodes are not connected to the graph');
      }

      if (edges.length === 0) {
        warnings.push('No connections between nodes');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [nodes, edges]);
};