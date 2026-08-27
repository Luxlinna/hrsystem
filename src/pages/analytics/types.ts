export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  status: string;
  join_date: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
}

export interface PayrollRecord {
  employee_id: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  status: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
}

export interface Candidate {
  id: string;
  stage: string;
  department: string;
  applied_at: string;
}

export interface OffboardingRequest {
  id: string;
  employee_id: string;
  reason: string;
  status: string;
  last_day: string;
}

export interface ExpenseRecord {
  id: string;
  employee_id: string;
  category: string;
  amount: number;
  status: string;
  submitted_at: string;
  branch_id: string;
}

export interface ITAsset {
  id: string;
  type: string;
  status: string;
  assigned_to: string | null;
}

export interface ITTicket {
  id: string;
  priority: string;
  status: string;
  category: string;
  created_at: string;
}

export interface BenefitEnrollment {
  id: string;
  employee_id: string;
  plan_id: number;
  status: string;
}

export interface BenefitPlan {
  id: number;
  name: string;
  type: string;
}

export type AnalyticsTabKey =
  | "overview"
  | "leave"
  | "payroll"
  | "hiring"
  | "offboarding"
  | "it"
  | "finance"
  | "benefits";

export type ExportFormat = "csv" | "xlsx" | "pdf";
