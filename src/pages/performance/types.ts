export interface Review {
  id: string;
  employee_id: string;
  reviewer_id: string;
  quarter: string;
  year: number;
  overall_score: number | null;
  communication_score: number | null;
  teamwork_score: number | null;
  technical_score: number | null;
  leadership_score: number | null;
  comments: string | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  employee?: { first_name: string; last_name: string; role: string; department: string };
  reviewer?: { first_name: string; last_name: string };
}

export interface Goal {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  target_date: string;
  progress: number;
  status: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url?: string | null;
}

export interface ReviewForm {
  employee_id: string;
  reviewer_id: string;
  quarter: string;
  year: number;
  communication_score: number;
  teamwork_score: number;
  technical_score: number;
  leadership_score: number;
  comments: string;
  strengths: string;
  areas_for_improvement: string;
}

export interface GoalForm {
  employee_id: string;
  title: string;
  description: string;
  target_date: string;
  progress: number;
  status: string;
}

export interface TaskStats {
  total: number;
  done: number;
  overdue: number;
}
