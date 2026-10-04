export interface NewHiringRequestFormState {
  title: string;
  position?: string;
  department: string;
  division: string;
  company: string;
  business_unit: string;
  site?: string;
  branch_id: string;
  position_type: "new" | "replacement";
  replacement_for_id: string;
  replacement_for_name: string;
  location: string;
  employee_type?: string;
  employment_type: string;
  employee_level?: string;
  contract_type?: string;
  target_joining_date: string;
  job_description: string;
  jd_summary?: string;
  jd_responsibilities?: string;
  jd_requirements?: string;
  jd_qualifications?: string;
  jd_reporting_line?: string;
  jd_template_id?: string;
  years_of_experience?: string;
  experience_description?: string;
  team_supervision?: string;
  hiring_manager_id: string;
  hiring_manager_name: string;
  assigned_recruiter_id?: string;
  assigned_recruiter_name?: string;
  headcount: number;
  salary_min: string;
  salary_max: string;
  justification: string;
  urgency: "low" | "medium" | "high" | "urgent";
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
  location: string;
  education: string;
  work_experience: string;
  skills: string;
  languages: string;
  expected_salary: string;
  notice_period: string;
  assigned_recruiter_id: string;
  tags: string;
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
  interviewer_id?: string;
  interviewer_name?: string;
  interviewer_ids?: string[];
  interviewer_names?: string[];
}

