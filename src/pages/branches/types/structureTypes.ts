export interface Department {
  id: string;
  branch_id?: string | null;
  name: string;
  parent_department_id?: string | null;
  parent_department_name?: string | null;
  head_of_department_id?: string | null;
  head_of_department_name?: string | null;
  sort_order: number;
  status: "active" | "disabled" | string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DepartmentFormState {
  name: string;
  parent_department_id: string;
  parent_department_name: string;
  head_of_department_id: string;
  head_of_department_name: string;
  sort_order: string;
  status: "active" | "disabled";
}

export interface Position {
  id: string;
  branch_id?: string | null;
  name: string;
  tax_position?: string | null;
  status: "active" | "disabled" | string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PositionFormState {
  name: string;
  tax_position: string;
  status: "active" | "disabled";
}

export interface EmployeeType {
  id: string;
  branch_id?: string | null;
  name: string;
  status: "active" | "disabled" | string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface EmployeeTypeFormState {
  name: string;
  status: "active" | "disabled";
}

export interface EmployeeLevel {
  id: string;
  branch_id?: string | null;
  name: string;
  remark?: string | null;
  status: "active" | "disabled" | string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface EmployeeLevelFormState {
  name: string;
  remark: string;
  status: "active" | "disabled";
}

export interface ContractType {
  id: string;
  branch_id?: string | null;
  name: string;
  term: "None" | "Probation" | "FDC" | "UDC" | string;
  period_months?: number | null;
  alert_days_before: number;
  status: "active" | "disabled" | string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ContractTypeFormState {
  name: string;
  term: "None" | "Probation" | "FDC" | "UDC";
  period_months: string;
  alert_days_before: string;
  status: "active" | "disabled";
}

export interface JobStatus {
  id: string;
  branch_id?: string | null;
  name: string;
  code?: string;
  color?: string;
  status: "active" | "disabled" | string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface JobStatusFormState {
  name: string;
  code: string;
  color: string;
  status: "active" | "disabled";
}

