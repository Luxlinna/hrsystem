export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string | null;
  created_at: string;
  employees?: {
    id?: string;
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url: string | null;
    email?: string;
  } | null;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  annual_leave_days?: number;
  avatar_url?: string | null;
  email?: string;
  branch_id?: string;
}

export interface LeaveFormData {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface DepartmentImpact {
  dept: string;
  totalDays: number;
  staffCount: number;
  awayCount: number;
  pctAway: number;
}
