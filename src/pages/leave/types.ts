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
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url?: string | null;
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
  reports_to?: string | null;
}

export interface LeaveTypePolicy {
  type: string;
  default_days: number | null;
}

export interface LeaveFormData {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  totalApprovedDays: number;
  onLeaveToday: number;
  myAnnualRemaining: number;
  myAnnualEntitlement: number;
  myAnnualUsed: number;
  myAnnualPending: number;
}
