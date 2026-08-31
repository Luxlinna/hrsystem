export interface UserRole {
  id: number;
  name: string;
  description: string;
  color: string;
  is_admin: boolean;
  allowed_modules: string[];
  employees_manage: boolean;
  self_service_all_employees: boolean;
  leave_view_all_employees: boolean;
  leave_approve: boolean;
  payroll_view_all_employees: boolean;
  attendance_view_all_employees: boolean;
  performance_view_all_employees: boolean;
  disciplinary_view_all_employees: boolean;
  leave_view_own_branch: boolean;
  attendance_view_own_branch: boolean;
  performance_view_own_branch: boolean;
  disciplinary_view_own_branch: boolean;
  task_view_all_employees: boolean;
  task_view_own_branch: boolean;
  meeting_rooms_approve: boolean;
  attendance_notify: boolean;
  hiring_requests_branch_approve?: boolean;
  hiring_requests_hr_review?: boolean;
}

export interface UsePermissionsReturn {
  role: UserRole | null;
  loading: boolean;
  can: (module: string) => boolean;
  isAdmin: boolean;
  isBranchAdmin: boolean;
}
