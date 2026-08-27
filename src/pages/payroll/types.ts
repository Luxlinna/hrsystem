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
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: "paid" | "processed" | "pending";
  created_at?: string;
  notes?: string | null;
  employees?: Employee | null;
}

export interface PayrollForm {
  employee_id: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  status: "paid" | "processed" | "pending";
  notes: string;
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
