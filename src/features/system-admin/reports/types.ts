export interface ReportConfig {
  module: string;
  dateFrom: string;
  dateTo: string;
  employeeSearch?: string;
  departmentFilter?: string;
  branchFilter?: string;
  recordStatus?: "all" | "active" | "deleted";
}

export interface LeaveRow {
  id: string;
  employee: string;
  department: string;
  branch: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export interface PayrollRow {
  id: string;
  employee: string;
  department: string;
  branch: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export interface HeadcountRow {
  branch: string;
  department: string;
  employee_count: number;
  active: number;
  onboarding: number;
  deleted_count: number;
}

export interface ExpenseRow {
  id: string;
  description: string;
  category: string;
  amount: number;
  submitted_by: string;
  status: string;
  date: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export interface HireRow {
  id: string;
  name: string;
  position: string;
  stage: string;
  status: string;
  applied_date: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export interface DailyLogRow {
  id: string;
  employee: string;
  department: string;
  branch: string;
  date: string;
  time: string;
  activity: string;
  notes: string;
  status?: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export interface AttendanceRow {
  id: string;
  employee_id: string;
  employee: string;
  department: string;
  branch: string;
  role: string;
  date: string;
  clock_in: string;
  clock_out: string;
  hours: number;
  status: string;
  late_minutes: number;
  notes: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export interface AttendanceSummaryRow {
  id: string;
  employee: string;
  department: string;
  branch: string;
  role: string;
  days_logged: number;
  present: number;
  late: number;
  absent: number;
  remote: number;
  total_hours: number;
  late_minutes: number;
  attendance_rate: number;
  last_logged: string;
}

export interface RoomBookingRow {
  id: string;
  room_name: string;
  title: string;
  employee: string;
  department: string;
  branch: string;
  date: string;
  time: string;
  attendees: number;
  status: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export interface OnboardingRow {
  id: string;
  employee: string;
  role: string;
  department: string;
  branch: string;
  stage: string;
  status: string;
  verified_docs: string;
  requested_by: string;
  started_date: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export interface OnboardingTaskRow {
  id: string;
  task_name: string;
  candidate: string;
  employee?: string;
  department: string;
  branch: string;
  category: string;
  priority: string;
  assigned_to: string;
  due_date: string;
  status: string;
  completed_by: string;
  completed_at: string;
  verified_at: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export interface ShiftRow {
  id: string;
  shift_date: string;
  shift_name: string;
  employee: string;
  department: string;
  branch: string;
  time: string;
  hours: number;
  capacity: number;
  staffing: string;
  status: string;
  notes: string;
  deleted_by?: string;
  deleted_at?: string | null;
  deleted_at_formatted?: string;
}

export type ReportRow =
  | LeaveRow
  | PayrollRow
  | HeadcountRow
  | ExpenseRow
  | HireRow
  | DailyLogRow
  | AttendanceRow
  | AttendanceSummaryRow
  | RoomBookingRow
  | OnboardingRow
  | OnboardingTaskRow
  | ShiftRow;

export interface ModuleItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
}
