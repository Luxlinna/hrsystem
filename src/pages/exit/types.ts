export type ExitType =
  | "resignation"
  | "termination"
  | "retirement"
  | "contract_end"
  | "abandonment"
  | "mutual_agreement"
  | "death"
  | (string & {});

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
  | "other"
  | (string & {});

export interface SeverancePayInfo {
  eligible?: boolean;
  severance_amount?: number;
  unused_leave_amount?: number;
  notice_pay_amount?: number;
  total_amount?: number;
  remark?: string;
}

export interface EmployeeExit {
  id: string;
  employee_id: string | null;
  exit_type: ExitType;
  last_working_day: string;
  effective_date?: string;
  reason_type: ReasonType | string;
  reason_description: string | null;
  is_blacklisted?: boolean;
  remark?: string | null;
  contract_type?: string | null;
  severance_pay_info?: SeverancePayInfo | null;
  document_url: string | null;
  document_name: string | null;
  status: "active" | "cancelled";
  recorded_by: string | null;
  created_at: string;
  // joined
  employees?: {
    first_name: string;
    last_name: string;
    kh_name?: string | null;
    role: string | null;
    department: string | null;
    avatar_url: string | null;
    branch_id: string | null;
    biometric_user_id?: string | null;
    employee_code?: string | null;
    contract_type?: string | null;
    branches?: { id?: string; name: string } | null;
  } | null;
}

export interface ExitFormState {
  employee_id: string;
  exit_type: ExitType;
  last_working_day: string; // Effective Date
  reason_type: ReasonType | string;
  reason_description: string; // Reason
  is_blacklisted: boolean;
  remark: string;
  contract_type: string; // Contracts
  severance_pay_info: SeverancePayInfo;
  document_url: string;
  document_name: string;
}

export const EMPTY_EXIT_FORM: ExitFormState = {
  employee_id: "",
  exit_type: "",
  last_working_day: new Date().toISOString().slice(0, 10),
  reason_type: "",
  reason_description: "",
  is_blacklisted: false,
  remark: "",
  contract_type: "",
  severance_pay_info: {
    eligible: false,
    severance_amount: 0,
    unused_leave_amount: 0,
    notice_pay_amount: 0,
    total_amount: 0,
    remark: "",
  },
  document_url: "",
  document_name: "",
};

export interface ExitEmployee {
  id: string;
  first_name: string;
  last_name: string;
  kh_name?: string | null;
  role: string | null;
  department: string | null;
  avatar_url: string | null;
  branch_id?: string | null;
  biometric_user_id?: string | null;
  employee_code?: string | null;
  contract_type?: string | null;
  branches?: { id?: string; name: string } | null;
}

export function exitToFormState(exit: EmployeeExit): ExitFormState {
  return {
    employee_id: exit.employee_id || "",
    exit_type: exit.exit_type,
    last_working_day: exit.last_working_day || new Date().toISOString().slice(0, 10),
    reason_type: exit.reason_type,
    reason_description: exit.reason_description || "",
    is_blacklisted: Boolean(exit.is_blacklisted),
    remark: exit.remark || "",
    contract_type: exit.contract_type || exit.employees?.contract_type || "",
    severance_pay_info: exit.severance_pay_info || {
      eligible: false,
      severance_amount: 0,
      unused_leave_amount: 0,
      notice_pay_amount: 0,
      total_amount: 0,
      remark: "",
    },
    document_url: exit.document_url || "",
    document_name: exit.document_name || "",
  };
}


