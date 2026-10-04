export interface Branch {
  id: string;
  name: string;
}

export interface BranchPayrollPolicy {
  id?: string;
  branch_id: string;
  pay_cycle: "monthly" | "bi-weekly" | "semi-monthly" | "weekly";
  pay_day: number;
  cutoff_day: number;
  overtime_rate: number;
  tax_rate: number;
  social_security_rate: number;
  health_insurance_rate: number;
  currency: string;
  disbursement_method: "bank_transfer" | "cash" | "cheque" | "direct_deposit";
  bank_name?: string | null;
  bank_account_number?: string | null;
  requires_two_tier_approval: boolean;
  auto_calculate_overtime: boolean;
  auto_deduct_late_penalties: boolean;
  policy_notes?: string | null;
  updated_by?: string | null;
  updated_at?: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url?: string | null;
  branch_id?: string | null;
  branches?: { id: string; name: string } | null;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  branch_id?: string | null;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  gross_pay?: number;
  net_pay: number;
  status: "paid" | "processed" | "pending";
  created_at?: string;
  notes?: string | null;
  employees?: Employee | null;
  branches?: { id: string; name: string } | null;
}

export interface PayrollForm {
  employee_id: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  status: "paid" | "processed" | "pending";
}

export interface PayrollStats {
  totalBase: number;
  totalBonus: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  avgNetPay: number;
  pendingCount: number;
}

export interface CompensationChartItem {
  name: string;
  base: number;
  bonus: number;
  deductions: number;
  net: number;
}

export interface DeptDistributionItem {
  name: string;
  value: number;
  fill: string;
}
