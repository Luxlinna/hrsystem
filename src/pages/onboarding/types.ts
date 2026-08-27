export interface OnboardingRequest {
  id: string;
  employee_id: string;
  branch_id?: string;
  stage: string;
  day_count: number;
  status: string;
  requested_by: string;
  created_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    branches?: { name: string } | null;
  } | null;
}

export interface OnboardingDoc {
  id: string;
  onboarding_request_id: string;
  document_name: string;
  document_type?: string;
  stage: string;
  status: string;
  file_url: string | null;
  file_name: string | null;
  notes: string | null;
  due_date: string | null;
  uploaded_at?: string;
  created_at?: string;
}

export interface StageConfig {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url?: string | null;
  branches?: { name: string } | null;
}

export interface DocForm {
  document_name: string;
  notes: string;
  due_date: string;
}
