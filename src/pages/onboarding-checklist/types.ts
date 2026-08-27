export interface ChecklistTask {
  id: string;
  onboarding_request_id: string;
  task_name: string;
  description: string | null;
  category: string;
  assigned_to: string | null;
  assigned_to_role: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  priority: "high" | "medium" | "low";
  sort_order: number;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role?: string;
  avatar_url?: string | null;
}

export interface OnboardingHire {
  id: string;
  employee_id: string | null;
  stage: string;
  status: string;
  day_count: number;
  requested_by: string;
  created_at: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url: string | null;
    branches?: { name: string } | null;
  } | null;
}

export interface TaskForm {
  task_name: string;
  description: string;
  category: "documents" | "it_setup" | "training" | "general";
  assigned_to: string;
  assigned_to_role: string;
  due_date: string;
  priority: "high" | "medium" | "low";
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  highPriority: number;
  pct: number;
}
