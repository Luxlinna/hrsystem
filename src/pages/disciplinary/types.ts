export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  avatar_url: string | null;
}

export interface DisciplinaryRecord {
  id: string;
  employee_id: string;
  type: string;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
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
  created_at: string;
  employees?: Employee;
}

export interface NewRecord {
  employee_id: string;
  type: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "escalated" | "closed";
  incident_date: string;
  follow_up_date: string;
  witnesses: string;
  action_taken: string;
  pip_start_date: string;
  pip_end_date: string;
  pip_goals: string;
}

export type DisciplinaryTabKey = "all" | "open" | "pip" | "critical" | "resolved";
export type ViewMode = "cards" | "table";
