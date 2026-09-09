export interface CandidateApplicationItem {
  id: string;
  candidate_id: string;
  job_posting_id: string | null;
  stage: string;
  rating?: number | null;
  source?: string | null;
  applied_at: string;
  outcome?: string | null;
  outcome_notes?: string | null;
  notes?: string | null;
  job_posting?: {
    title: string;
    department: string;
  } | null;
}

export interface MyEmployee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: string;
  join_date: string;
  phone: string | null;
  reports_to: string | null;
  branches: { name: string } | null;
  location?: string | null;
  education?: string | null;
  work_experience?: string | null;
  skills?: string[] | null;
  languages?: string[] | null;
  expected_salary?: number | null;
  notice_period?: string | null;
  resume_url?: string | null;
  resume_name?: string | null;
  candidate_code?: string | null;
  candidate_id?: string | null;
  source?: string | null;
  assigned_recruiter_name?: string | null;
  tags?: string[] | null;
  candidate_notes?: string | null;
  applications?: CandidateApplicationItem[];
}

export interface DirectReport {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url: string | null;
}
