import type { RoleFormState } from "./types";
import { SCOPE_HINTS } from "./scopeHints";
import { ALL_MODULES, MODULE_GROUPS } from "./modulesConfig";

export { ALL_MODULES, MODULE_GROUPS };

export const COLORS = [
  "#253C7D", "#7C3AED", "#059669", "#D97706", "#DC2626",
  "#2563EB", "#DB2777", "#EA580C", "#64748B", "#0369A1",
] as const;

export const ACTION_OVERRIDES = [
  { group: "action" as const, key: "leave_approve", label: "Can approve / reject leave requests", hint: SCOPE_HINTS.leave_approve },
  { group: "action" as const, key: "meeting_rooms_approve", label: "Can approve / reject meeting room bookings", hint: SCOPE_HINTS.meeting_rooms_approve },
  { group: "action" as const, key: "hiring_requests_branch_approve", label: "Stage 1: Can approve branch hiring requests (Forward to HR)", hint: SCOPE_HINTS.hiring_requests_branch_approve },
  { group: "action" as const, key: "hiring_requests_hr_review", label: "Stage 2: Can review requisitions in HR Division (Forward to HR Admin)", hint: SCOPE_HINTS.hiring_requests_hr_review },
  { group: "action" as const, key: "hiring_requests_hr_admin_approve", label: "Stage 3: Can approve requisitions in HR Division (Forward to Chairman)", hint: SCOPE_HINTS.hiring_requests_hr_admin_approve },
  { group: "action" as const, key: "hiring_requests_chairman_approve", label: "Stage 4: Can perform final Chairman authorization & publish live jobs", hint: SCOPE_HINTS.hiring_requests_chairman_approve },
  { group: "action" as const, key: "employees_manage", label: "Can edit employee records (role, department, status, manager)", hint: SCOPE_HINTS.employees_manage },
  { group: "action" as const, key: "attendance_notify", label: "Receives attendance check-in / check-out notifications", hint: SCOPE_HINTS.attendance_notify },
] as const;

export const VISIBILITY_OVERRIDES = [
  { group: "visibility" as const, key: "self_service_all_employees", label: "Can view/switch other employees in Self-Service", hint: SCOPE_HINTS.self_service_all_employees },
  { group: "visibility" as const, key: "leave_view_all_employees", label: "Can view all employees' leave requests", hint: SCOPE_HINTS.leave_view_all_employees },
  { group: "visibility" as const, key: "leave_view_own_branch", label: "Can view their own branch's leave requests", hint: SCOPE_HINTS.leave_view_own_branch },
  { group: "visibility" as const, key: "payroll_view_all_employees", label: "Can view all employees' payroll", hint: SCOPE_HINTS.payroll_view_all_employees },
  { group: "visibility" as const, key: "attendance_view_all_employees", label: "Can view all employees' attendance records", hint: SCOPE_HINTS.attendance_view_all_employees },
  { group: "visibility" as const, key: "attendance_view_own_branch", label: "Can view their own branch's attendance records", hint: SCOPE_HINTS.attendance_view_own_branch },
  { group: "visibility" as const, key: "performance_view_all_employees", label: "Can view/manage all employees' performance reviews", hint: SCOPE_HINTS.performance_view_all_employees },
  { group: "visibility" as const, key: "performance_view_own_branch", label: "Can view/manage their own branch's performance reviews", hint: SCOPE_HINTS.performance_view_own_branch },
  { group: "visibility" as const, key: "disciplinary_view_all_employees", label: "Can view all employees' disciplinary records", hint: SCOPE_HINTS.disciplinary_view_all_employees },
  { group: "visibility" as const, key: "disciplinary_view_own_branch", label: "Can view their own branch's disciplinary records", hint: SCOPE_HINTS.disciplinary_view_own_branch },
  { group: "visibility" as const, key: "task_view_all_employees", label: "Can view/assign tasks for all employees", hint: SCOPE_HINTS.task_view_all_employees },
  { group: "visibility" as const, key: "task_view_own_branch", label: "Can view/assign their own branch's tasks", hint: SCOPE_HINTS.task_view_own_branch },
] as const;

export const SCOPE_OVERRIDES = [...ACTION_OVERRIDES, ...VISIBILITY_OVERRIDES] as const;

export const BLANK_ROLE: RoleFormState = {
  name: "",
  description: "",
  color: "#253C7D",
  is_admin: false,
  allowed_modules: [],
  ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, false])) as unknown as Omit<RoleFormState, "name" | "description" | "color" | "is_admin" | "allowed_modules">,
};
