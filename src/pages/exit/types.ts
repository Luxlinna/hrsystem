export type ExitType =
  | "resignation"
  | "termination"
  | "retirement"
  | "contract_end"
  | "abandonment"
  | "mutual_agreement"
  | "death";

export type ReasonType =
  | "personal"
  | "better_opportunity"
  | "health"
  | "performance"
  | "misconduct"
  | "restructuring"
  | "relocation"
  | "retirement"
  | "contract_end"
  | "other";

export interface EmployeeExit {
  id: string;
  employee_id: string | null;
  exit_type: ExitType;
  last_working_day: string;
  reason_type: ReasonType;
  reason_description: string | null;
  document_url: string | null;
  document_name: string | null;
  status: "active" | "cancelled";
  recorded_by: string | null;
  created_at: string;
  // joined
  employees?: {
    first_name: string;
    last_name: string;
    role: string | null;
    department: string | null;
    avatar_url: string | null;
    branch_id: string | null;
    branches?: { id?: string; name: string } | null;
  } | null;
}

export interface ExitFormState {
  employee_id: string;
  exit_type: ExitType;
  last_working_day: string;
  reason_type: ReasonType;
  reason_description: string;
  document_url: string;
  document_name: string;
}

export const EMPTY_EXIT_FORM: ExitFormState = {
  employee_id: "",
  exit_type: "resignation",
  last_working_day: "",
  reason_type: "personal",
  reason_description: "",
  document_url: "",
  document_name: "",
};

export interface ExitEmployee {
  id: string;
  first_name: string;
  last_name: string;
  role: string | null;
  department: string | null;
  avatar_url: string | null;
  branch_id?: string | null;
  branches?: { id?: string; name: string } | null;
}
