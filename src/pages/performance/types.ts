export interface Review {
  id: string;
  employee_id: string;
  reviewer_id: string;
  quarter: string;
  year: number;
  review_type?: string | null;
  evaluation_period?: string | null;
  evaluation_date?: string | null;
  quality_of_work_score?: number | null;
  productivity_score?: number | null;
  attendance_score?: number | null;
  communication_score: number | null;
  teamwork_score: number | null;
  problem_solving_score?: number | null;
  responsibility_score?: number | null;
  initiative_score?: number | null;
  technical_score: number | null;
  goal_achievement_score?: number | null;
  leadership_score: number | null;
  quality_of_work_comment?: string | null;
  productivity_comment?: string | null;
  attendance_comment?: string | null;
  communication_comment?: string | null;
  teamwork_comment?: string | null;
  problem_solving_comment?: string | null;
  responsibility_comment?: string | null;
  initiative_comment?: string | null;
  technical_comment?: string | null;
  goal_achievement_comment?: string | null;
  overall_score: number | null;
  comments: string | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  key_goals?: string | null;
  goals_completed?: string | null;
  major_achievements?: string | null;
  projects_completed?: string | null;
  skills_to_improve?: string | null;
  performance_issues?: string | null;
  recommended_training?: string | null;
  training_required?: string | null;
  new_skills_to_develop?: string | null;
  career_development_goals?: string | null;
  next_period_objectives?: string | null;
  self_quality_of_work_score?: number | null;
  self_productivity_score?: number | null;
  self_attendance_score?: number | null;
  self_communication_score?: number | null;
  self_teamwork_score?: number | null;
  self_problem_solving_score?: number | null;
  self_responsibility_score?: number | null;
  self_initiative_score?: number | null;
  self_technical_score?: number | null;
  self_goal_achievement_score?: number | null;
  manager_comments?: string | null;
  employee_comments?: string | null;
  employee_acknowledged?: boolean | null;
  employee_acknowledged_date?: string | null;
  hr_approved?: boolean | null;
  evaluator_approved?: boolean | null;
  status: "submitted" | "self_review" | "draft" | string;
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
  employee_code?: string | null;
  reports_to?: string | null;
  line_manager?: string | null;
  app_role?: string | null;
  is_direct_manager?: boolean;
  branch_id?: string | null;
}

export interface ReviewForm {
  id?: string;
  is_self_assessment?: boolean;
  employee_id: string;
  reviewer_id: string;
  quarter: string;
  year: number;
  review_type: string;
  evaluation_period: string;
  evaluation_date: string;
  quality_of_work_score: number;
  quality_of_work_comment: string;
  productivity_score: number;
  productivity_comment: string;
  attendance_score: number;
  attendance_comment: string;
  communication_score: number;
  communication_comment: string;
  teamwork_score: number;
  teamwork_comment: string;
  problem_solving_score: number;
  problem_solving_comment: string;
  responsibility_score: number;
  responsibility_comment: string;
  initiative_score: number;
  initiative_comment: string;
  technical_score: number;
  technical_comment: string;
  goal_achievement_score: number;
  goal_achievement_comment: string;
  leadership_score: number;
  self_quality_of_work_score: number;
  self_productivity_score: number;
  self_attendance_score: number;
  self_communication_score: number;
  self_teamwork_score: number;
  self_problem_solving_score: number;
  self_responsibility_score: number;
  self_initiative_score: number;
  self_technical_score: number;
  self_goal_achievement_score: number;
  key_goals: string;
  goals_completed: string;
  major_achievements: string;
  projects_completed: string;
  skills_to_improve: string;
  performance_issues: string;
  recommended_training: string;
  training_required: string;
  new_skills_to_develop: string;
  career_development_goals: string;
  next_period_objectives: string;
  comments: string;
  strengths: string;
  areas_for_improvement: string;
  manager_comments: string;
  employee_comments: string;
  employee_acknowledged: boolean;
  employee_acknowledged_date: string;
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
