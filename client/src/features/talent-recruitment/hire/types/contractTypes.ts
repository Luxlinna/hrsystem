export type ContractWorkflowStage =
  | "draft"
  | "hr_review"
  | "hr_director_approval"
  | "chairwoman_approval"
  | "issued"
  | "signed"
  | "completed";

export interface EmploymentContract {
  id: string;
  contract_number: string;
  candidate_id: string;
  job_posting_id?: string | null;
  branch_id?: string | null;
  offer_id?: string | null;

  // History & Linkage
  candidate_name: string;
  candidate_email?: string | null;
  position_title: string;
  department: string;
  business_unit_name: string;
  offer_reference?: string | null;

  // Terms
  contract_type: "probationary" | "fixed_term" | "permanent";
  start_date: string;
  end_date?: string | null;
  probation_months: number;
  monthly_salary: number;
  currency: string;
  work_schedule?: string;
  work_location?: string;
  contract_url?: string | null;
  signed_contract_url?: string | null;

  // 7-Stage Workflow Progression
  status: ContractWorkflowStage;

  // Audit Trails
  created_by_name: string;
  hr_reviewer_name?: string | null;
  hr_reviewed_at?: string | null;
  hr_review_notes?: string | null;

  hr_director_name?: string | null;
  hr_director_approved_at?: string | null;
  hr_director_notes?: string | null;

  chairwoman_name?: string | null;
  chairwoman_approved_at?: string | null;
  chairwoman_notes?: string | null;

  issued_at?: string | null;
  issued_by_name?: string | null;

  signed_at?: string | null;
  signed_by_candidate?: boolean;
  signed_by_company?: boolean;

  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type ContractModalType =
  | "hr_review"
  | "hr_director_approval"
  | "chairwoman_approval"
  | "issue_contract"
  | "sign_contract"
  | null;
