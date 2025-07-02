export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          user_id: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          user_id: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          user_id?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      dag_graphs: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          nodes: any;
          edges: any;
          layout_config: any;
          validation_status: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          nodes?: any;
          edges?: any;
          layout_config?: any;
          validation_status?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          nodes?: any;
          edges?: any;
          layout_config?: any;
          validation_status?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_collaborators: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: 'owner' | 'editor' | 'viewer';
          created_at?: string;
        };
      };
    };
  };
}

export type Project = Database['public']['Tables']['projects']['Row'];
export type DAGGraph = Database['public']['Tables']['dag_graphs']['Row'];
export type ProjectCollaborator = Database['public']['Tables']['project_collaborators']['Row'];