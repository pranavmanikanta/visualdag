export interface NodeData {
  label: string;
  id: string;
}

export interface GraphValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface HistoryState {
  nodes: any[];
  edges: any[];
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}