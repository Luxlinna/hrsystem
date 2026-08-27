export interface PayrollRun {
  id: string;
  period: string;
  department: string;
  total_base: number;
  total_bonus: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  status: string;
  submitted_by: string | null;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface PayrollApproval {
  id: string;
  run_id: string;
  approver_name: string;
  approver_role: string | null;
  status: string;
  notes: string | null;
  acted_at: string | null;
  created_at: string;
}

export interface EmployeeItemRecord {
  id: string;
  employee_id: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: string;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url: string | null;
  } | null;
}

export interface CreatePayrollRunForm {
  period: string;
  department: string;
  total_base: string;
  total_bonus: string;
  total_deductions: string;
  employee_count: string;
  notes: string;
}
