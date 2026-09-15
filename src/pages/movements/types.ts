export type MovementType =
  | "probation"
  | "pass_probation"
  | "transfer"
  | "promote"
  | "demote"
  | "salary_adjustment"
  | "change_contract";

export interface EmployeeMovement {
  id: string;
  employee_id: string;
  movement_type: MovementType;
  title: string;
  effective_date: string;
  previous_values: Record<string, any>;
  new_values: Record<string, any>;
  remarks?: string | null;
  document_url?: string | null;
  document_name?: string | null;
  branch_id?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    role?: string | null;
    department?: string | null;
    avatar_url?: string | null;
    branch_id?: string | null;
    branches?: { name: string } | null;
    work_locations?: { name: string } | null;
  } | null;
}

export interface MovementTypeConfig {
  type: MovementType;
  label: string;
  shortLabel: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  description: string;
}

export interface MovementFormData {
  employee_id: string;
  movement_type: MovementType;
  effective_date: string;
  remarks: string;
  document_file?: File | null;

  // Contextual type fields
  // 1. Probation
  probation_months?: number;
  probation_end_date?: string;

  // 2. Pass Probation
  rating?: string;
  confirmed_role?: string;

  // 3. Transfer
  target_branch_id?: string;
  target_work_location_id?: string;
  target_department?: string;
  target_reports_to?: string;

  // 4. Promote
  new_role?: string;
  new_grade?: string;
  salary_increase?: number;

  // 5. Demote
  demote_new_role?: string;
  demote_reason?: string;

  // 6. Salary Adjustment
  current_salary?: number;
  new_salary?: number;
  currency?: string;
  adjustment_type?: string;

  // 7. Change Contract
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
}
