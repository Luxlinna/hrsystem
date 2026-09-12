export interface Branch {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string | null;
  location?: string | null;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  branch_id: string;
  description: string;
  requirements: string[];
  location: string;
  salary_min: number;
  salary_max: number;
  type: string;
  status: string;
  posted_at: string;
  closing_date: string;
  branches?: { id: string; name: string };
}

export type DocumentVerificationStatus =
  | "missing"
  | "uploaded"
  | "under_review"
  | "verified"
  | "rejected";

export interface CandidateDocument {
  name: string;
  url: string;
  size?: number;
  type?: string;
  uploaded_at?: string;
  stage_key?: string;
  notes?: string;
  doc_slot_key?: string;
  verification_status?: DocumentVerificationStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export type StageEvidenceStatus = "verified" | "pending" | "upcoming";

export interface CandidateApplication {
  id: string;
  candidate_id: string;
  job_posting_id?: string | null;
  stage: string;
  rating?: number | null;
  source?: string | null;
  applied_at: string;
  outcome?: "in_progress" | "hired" | "rejected" | "withdrawn" | "on_hold";
  outcome_notes?: string | null;
  notes?: string | null;
  job_postings?: {
    id: string;
    title: string;
    department: string;
    location?: string;
    branches?: { name: string };
  } | null;
}

export interface Candidate {
  id: string;
  candidate_code?: string | null;
  job_posting_id?: string | null;
  full_name: string;
  email: string;
  phone: string;
  location?: string | null;
  education?: string | null;
  work_experience?: string | null;
  skills?: string[] | null;
  languages?: string[] | null;
  expected_salary?: number | null;
  notice_period?: string | null;
  assigned_recruiter_id?: string | null;
  assigned_recruiter?: { id: string; first_name: string; last_name: string; email?: string } | null;
  tags?: string[] | null;
  source: string;
  stage: string;
  rating: number | null;
  notes: string;
  applied_at: string;
  resume_url: string | null;
  resume_name: string | null;
  documents?: CandidateDocument[] | null;
  linkedin_url?: string | null;
  job_postings?: { id: string; title: string; department: string; branch_id?: string | null; branches?: { name: string } } | null;
  applications?: CandidateApplication[];
}

export interface Interview {
  id: string;
  candidate_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  feedback: string;
  score: number;
  notes: string;
  candidates?: { id: string; full_name: string; job_posting_id?: string; job_postings?: { title: string; department?: string } } | null;
  employees?: { id?: string; first_name: string; last_name: string; avatar_url?: string } | null;
}

export interface CandidateApprovalPanel {
  name: string;
  date_time: string;
  position: string;
  signature?: string | null;
}

export interface CandidateApprovalSignatory {
  role_key: "ceo" | "hr_manager" | "division_director" | "chairwoman";
  title: string;
  default_name: string;
  assigned_name: string;
  status: "pending" | "approved" | "rejected";
  comment?: string | null;
  checked_by?: string | null;
  signed_at?: string | null;
}

export interface CandidateApproval {
  id: string;
  candidate_id: string;
  form_number: string; // e.g. CAF-2026-005
  branch_id?: string | null;
  status: "draft" | "in_review" | "approved" | "rejected";

  // Section I: Candidate & Role Overview
  candidate_name: string;
  gender: string;
  position_applied: string;
  business_unit: string;
  department: string;
  hiring_manager: string;
  current_salary: string;
  expectation_salary: string;
  current_benefit: string;
  notice_period: string;

  // Section II: Candidate Evaluation Summary
  education_and_skill: string;
  work_experience: string;
  strengths: string;
  improvement: string;
  overall_assessment: string;
  interview_panels: CandidateApprovalPanel[];

  // Section III: 4-Step Final Approval Signatories
  signatories: {
    ceo: CandidateApprovalSignatory;
    hr_manager: CandidateApprovalSignatory;
    division_director: CandidateApprovalSignatory;
    chairwoman: CandidateApprovalSignatory;
  };

  created_at: string;
  updated_at?: string | null;
  completed_at?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export type HireTab = "actions" | "requests" | "jobs" | "candidates" | "interviews" | "pipeline" | "offers";

export type OfferStatus =
  | "salary_proposal"
  | "pending_bu_ceo"
  | "pending_hr_manager"
  | "pending_hr_director"
  | "pending_chairwoman"
  | "approved"
  | "issued"
  | "accepted"
  | "rejected"
  // Legacy statuses for backward compatibility
  | "salary_approved"
  | "draft_letter"
  | "hr_review"
  | "management_approval";

export interface OfferAllowanceItem {
  name: string;
  amount: number;
}

export interface OfferSignatory {
  role_key: "bu_ceo" | "hr_manager" | "hr_director" | "chairwoman";
  title: string;
  name?: string | null;
  status: "pending" | "approved" | "rejected";
  comment?: string | null;
  signed_at?: string | null;
}

export interface OfferSignatories {
  bu_ceo: OfferSignatory;
  hr_manager: OfferSignatory;
  hr_director: OfferSignatory;
  chairwoman: OfferSignatory;
}

export interface OfferLetter {
  id: string;
  offer_number: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email?: string | null;
  candidate_phone?: string | null;
  candidate_address?: string | null;
  hiring_request_id?: string | null;
  job_posting_id?: string | null;
  job_title: string;
  department: string;
  division?: string | null;
  business_unit?: string | null;
  branch_id?: string | null;
  reporting_to?: string | null;
  employment_type: string;
  working_days?: string | null;
  working_time?: string | null;
  base_salary: number;
  probation_salary?: number | null;
  probation_months: number;
  target_start_date: string;
  allowances: OfferAllowanceItem[];
  benefits_summary?: string | null;
  special_terms?: string | null;
  status: OfferStatus;
  signatories?: OfferSignatories | null;

  // Workflow audit fields
  proposed_by_id?: string | null;
  proposed_by_name?: string | null;
  proposed_at?: string | null;
  proposal_notes?: string | null;

  salary_approved_by?: string | null;
  salary_approved_at?: string | null;
  salary_approval_notes?: string | null;

  hr_reviewed_by?: string | null;
  hr_reviewed_at?: string | null;
  hr_review_notes?: string | null;

  management_approved_by?: string | null;
  management_approved_at?: string | null;
  management_approval_notes?: string | null;

  issued_by?: string | null;
  issued_at?: string | null;
  expiry_date?: string | null;

  decision_at?: string | null;
  decision_notes?: string | null;
  rejection_reason?: string | null;

  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export type RecruitmentActionRole =
  | "manager"
  | "hiring_manager"
  | "hr_manager"
  | "hr_director"
  | "ceo_director"
  | "chairwoman";

export interface HiringRequest {
  id: string;
  requisition_id?: string;
  title: string;
  department: string;
  division?: string | null;
  company?: string | null;
  business_unit?: string | null;
  branch_id: string | null;
  position_type?: "new" | "replacement";
  replacement_for_id?: string | null;
  replacement_for_name?: string | null;
  location?: string | null;
  target_joining_date?: string | null;
  job_description?: string | null;
  jd_summary?: string | null;
  jd_responsibilities?: string | null;
  jd_requirements?: string | null;
  jd_qualifications?: string | null;
  jd_reporting_line?: string | null;
  jd_template_id?: string | null;
  jd_version?: number;
  hiring_manager_id?: string | null;
  hiring_manager_name?: string | null;
  requested_by_id?: string | null;
  requested_by_name: string;
  requested_by_email?: string | null;
  headcount: number;
  employment_type: string;
  salary_min?: number | null;
  salary_max?: number | null;
  justification?: string | null;
  urgency: "low" | "medium" | "high" | "urgent";
  status: "pending" | "pending_branch_review" | "pending_hr_review" | "pending_hr_admin_review" | "pending_chairman_review" | "approved" | "rejected" | "fulfilled";
  branch_approved_by?: string | null;
  branch_approved_at?: string | null;
  hr_reviewed_by?: string | null;
  hr_reviewed_at?: string | null;
  hr_admin_approved_by?: string | null;
  hr_admin_approved_at?: string | null;
  chairman_approved_by?: string | null;
  chairman_approved_at?: string | null;
  hr_assigned_to_id?: string | null;
  hr_assigned_to_name?: string | null;
  assigned_recruiter_id?: string | null;
  assigned_recruiter_name?: string | null;
  stage_entered_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  job_posting_id?: string | null;
  created_at: string;
  branches?: { id: string; name: string } | null;
}

export interface StageConfigItem {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
  hex: string;
}

export interface JobDescriptionTemplate {
  id: string;
  title: string;
  department: string;
  business_unit?: string | null;
  job_summary: string;
  responsibilities: string;
  requirements: string;
  qualifications: string;
  reporting_line?: string | null;
  version: number;
  created_by_name?: string | null;
  created_at?: string;
}

export * from "./formTypes";

