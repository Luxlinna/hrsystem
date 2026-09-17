export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string | null;
  remark?: string | null;
  attachment_url?: string | null;
  category_law?: string | null;
  approved_by?: string | null;
  created_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url?: string | null;
    email?: string;
    employee_code?: string | null;
    biometric_user_id?: string | null;
    branch_id?: string | null;
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
  employee_id?: string | null;
  employee_code?: string | null;
  biometric_user_id?: string | null;
  branches?: {
    id: string;
    name: string;
    location?: string | null;
  } | null;
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
  remark: string;
  category_law?: string;
  attachment_url?: string | null;
  attachment_file?: File | null;
}

export interface LeaveTypeBalanceStats {
  balance: number;
  used: number;
  available: number;
  pending: number;
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
