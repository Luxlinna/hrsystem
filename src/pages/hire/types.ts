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

export interface CandidateDocument {
  name: string;
  url: string;
  size?: number;
  type?: string;
  uploaded_at?: string;
  stage_key?: string;
  notes?: string;
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

export type HireTab = "actions" | "requests" | "jobs" | "candidates" | "interviews" | "pipeline";

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

export * from "./formTypes";

