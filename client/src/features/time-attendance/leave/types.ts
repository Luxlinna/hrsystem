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
    display_name?: string | null;
    full_name?: string | null;
    role: string;
    department: string;
    avatar_url?: string | null;
    email?: string;
    employee_code?: string | null;
    biometric_user_id?: string | null;
    branch_id?: string | null;
    reports_to?: string | null;
  } | null;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  display_name?: string | null;
  full_name?: string | null;
  gender?: string | null;
  role: string;
  department: string;
  annual_leave_days?: number;
  avatar_url?: string | null;
  email?: string;
  phone?: string | null;
  branch_id?: string;
  reports_to?: string | null;
  employee_id?: string | null;
  employee_code?: string | null;
  biometric_user_id?: string | null;
  position?: string | null;
  division?: string | null;
  site?: string | null;
  bu_full_name?: string | null;
  code_bu?: string | null;
  join_date?: string | null;
  start_date?: string | null;
  employment_type?: string | null;
  contract_type?: string | null;
  nationality?: string | null;
  branches?: {
    id?: string;
    name?: string;
    location?: string | null;
  } | any;
}

export interface LeaveTypePolicy {
  type: string;
  default_days: number | null;
  is_unpaid?: boolean;
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
  attachment_files?: File[];
  attachment_urls?: string[];
}

export interface LeaveTypeBalanceStats {
  balance: number | string;
  used: number;
  available: number | string;
  pending: number;
  isUnpaid?: boolean;
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
