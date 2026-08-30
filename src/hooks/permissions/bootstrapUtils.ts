import type { UserRole } from "./types";

const BOOTSTRAP_ADMIN_EMAILS = new Set(
  ((import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAILS as string | undefined) || "admin@hrmops.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export function isBootstrapAdminEmail(email?: string | null): boolean {
  return !!email && BOOTSTRAP_ADMIN_EMAILS.has(email.toLowerCase());
}

export function bootstrapAdminRole(): UserRole {
  return {
    id: -1,
    name: "Super Admin",
    description: "Bootstrap full access administrator",
    color: "#253C7D",
    is_admin: true,
    allowed_modules: ["*"],
    employees_manage: true,
    self_service_all_employees: true,
    leave_view_all_employees: true,
    leave_approve: true,
    payroll_view_all_employees: true,
    attendance_view_all_employees: true,
    performance_view_all_employees: true,
    disciplinary_view_all_employees: true,
    leave_view_own_branch: true,
    attendance_view_own_branch: true,
    performance_view_own_branch: true,
    disciplinary_view_own_branch: true,
    task_view_all_employees: true,
    task_view_own_branch: true,
    meeting_rooms_approve: true,
    attendance_notify: true,
  };
}
