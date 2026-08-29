export interface AppRole {
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
  created_at: string;
}

export interface UserAssignment {
  id: number;
  user_id: string | null;
  email: string;
  display_name: string | null;
  role_id: number | null;
  created_at: string;
  app_roles?: { id: number; name: string; color: string; is_admin?: boolean } | null;
  branch_id?: string | null;
  branch_name?: string | null;
  default_work_location_id?: string | null;
  site_name?: string | null;
}

export interface AuthAccount {
  id: string;
  email: string | null;
  display_name: string | null;
  email_confirmed_at: string | null;
  confirmed_at: string | null;
}

export interface AuthAccountsResult {
  accounts: AuthAccount[];
  assignments: UserAssignment[] | null;
}

export interface DirectoryEmployee {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  department: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  default_work_location_id?: string | null;
  site_name?: string | null;
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  acted_at: string | null;
  admin_note: string | null;
  reset_link_sent_at: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export type AdminTab = "roles" | "users" | "password-resets";

export interface RoleFormState {
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
}

export interface NewUserState {
  email: string;
  display_name: string;
  role_id: string;
  sendInvite: boolean;
}
