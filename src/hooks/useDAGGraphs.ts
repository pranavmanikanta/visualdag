import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DAGGraph } from '../types/database';
import { Node, Edge } from 'reactflow';
import toast from 'react-hot-toast';

export const useDAGGraphs = (projectId: string | null) => {
  const [graphs, setGraphs] = useState<DAGGraph[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setGraphs([]);
      setLoading(false);
      return;
    }

    fetchGraphs();
  }, [projectId]);

  const fetchGraphs = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('dag_graphs')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setGraphs(data || []);
    } catch (error) {
      console.error('Error fetching graphs:', error);
      toast.error('Failed to load graphs');
    } finally {
      setLoading(false);
    }
  };

  const createGraph = async (name: string, nodes: Node[] = [], edges: Edge[] = []) => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase
        .from('dag_graphs')
        .insert({
          project_id: projectId,
          name,
          nodes,
          edges,
          validation_status: { isValid: true, errors: [], warnings: [] },
        })
        .select()
        .single();

      if (error) throw error;

      setGraphs(prev => [data, ...prev]);
      toast.success('Graph created successfully');
      return data;
    } catch (error) {
      console.error('Error creating graph:', error);
      toast.error('Failed to create graph');
      return null;
    }
  };

  const updateGraph = async (
    id: string, 
    nodes: Node[], 
    edges: Edge[], 
    validationStatus?: any
  ) => {
    try {
      const { data, error } = await supabase
        .from('dag_graphs')
        .update({
          nodes,
          edges,
          validation_status: validationStatus,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setGraphs(prev => prev.map(g => g.id === id ? data : g));
      return data;
    } catch (error) {
      console.error('Error updating graph:', error);
      toast.error('Failed to save graph');
      return null;
    }
  };

  const deleteGraph = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dag_graphs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGraphs(prev => prev.filter(g => g.id !== id));
      toast.success('Graph deleted successfully');
    } catch (error) {
      console.error('Error deleting graph:', error);
      toast.error('Failed to delete graph');
    }
  };

  return {
    graphs,
    loading,
    createGraph,
    updateGraph,
    deleteGraph,
    refetch: fetchGraphs,
  };
};