export interface Branch {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  avatar_url: string | null;
  branch_id?: string | null;
}

export type DisciplinarySeverity = "low" | "medium" | "high" | "critical";
export type DisciplinaryType =
  | "verbal_warning"
  | "written_warning"
  | "final_warning"
  | "pip"
  | "incident"
  | "suspension"
  | "termination"
  | string;

export interface DisciplinaryRecord {
  id: string;
  employee_id: string;
  type: string;
  title: string;
  description: string | null;
  severity: DisciplinarySeverity;
  status: "open" | "in_progress" | "resolved" | "escalated" | "closed";
  incident_date: string | null;
  follow_up_date: string | null;
  resolved_at: string | null;
  created_by: string;
  witnesses: string | null;
  action_taken: string | null;
  pip_start_date: string | null;
  pip_end_date: string | null;
  pip_goals: string | null;
  notes?: string | null;
  branch_id?: string | null;
  is_admin_scope?: boolean;
  created_at: string;
  employees?: Employee;
  branches?: { id?: string; name: string } | null;
}

export interface NewRecord {
  employee_id: string;
  type: string;
  title: string;
  description: string;
  severity: DisciplinarySeverity;
  status: "open" | "in_progress" | "resolved" | "escalated" | "closed";
  incident_date: string;
  follow_up_date: string;
  witnesses: string;
  action_taken: string;
  pip_start_date: string;
  pip_end_date: string;
  pip_goals: string;
  notes?: string | null;
  branch_id?: string;
  is_admin_scope?: boolean;
}

export type DisciplinaryTabKey = "all" | "open" | "pip" | "critical" | "resolved";
export type ViewMode = "cards" | "table";
