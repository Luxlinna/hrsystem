export interface Tool {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: string;
  created_at: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department?: string;
  role?: string;
  avatar_url?: string | null;
}

export interface ToolAssignment {
  id: number;
  tool_id: number;
  employee_id: string;
  assigned_at: string;
  revoked_at: string | null;
  employees?: {
    id?: string;
    first_name: string;
    last_name: string;
    department?: string;
    role?: string;
    avatar_url?: string | null;
  } | null;
}

export interface ToolUsage {
  id: number;
  tool_id: number;
  employee_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  employees?: {
    id?: string;
    first_name: string;
    last_name: string;
    department?: string;
    role?: string;
    avatar_url?: string | null;
  } | null;
}

export type ToolsTab = "tools" | "access" | "activity";
export type ToolsViewMode = "cards" | "table";
