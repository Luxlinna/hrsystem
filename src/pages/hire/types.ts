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
}

export interface Candidate {
  id: string;
  job_posting_id: string;
  full_name: string;
  email: string;
  phone: string;
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

export type HireTab = "requests" | "jobs" | "candidates" | "interviews" | "pipeline";

export interface HiringRequest {
  id: string;
  title: string;
  department: string;
  branch_id: string | null;
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
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  job_posting_id?: string | null;
  created_at: string;
  branches?: { id: string; name: string } | null;
}

export interface NewHiringRequestFormState {
  title: string;
  department: string;
  branch_id: string;
  headcount: number;
  employment_type: string;
  salary_min: string;
  salary_max: string;
  justification: string;
  urgency: "low" | "medium" | "high" | "urgent";
}

export interface StageConfigItem {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
  hex: string;
}

export interface NewJobFormState {
  title: string;
  department: string;
  branch_id: string;
  description: string;
  location: string;
  salary_min: string;
  salary_max: string;
  type: string;
  closing_date: string;
}

export interface NewCandidateFormState {
  full_name: string;
  email: string;
  phone: string;
  job_posting_id: string;
  source: string;
  notes: string;
}

export interface NewInterviewFormState {
  candidate_id: string;
  scheduled_at: string;
  duration_minutes: string;
  type: string;
  notes: string;
}
