import type { RoleFormState } from "./types";
import { SCOPE_HINTS } from "./scopeHints";

export const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "ri-dashboard-line", group: "Core" },
  { key: "employees", label: "Employees", icon: "ri-user-search-line", group: "Core" },
  { key: "branches", label: "Branches", icon: "ri-building-line", group: "Core" },
  { key: "analytics", label: "Analytics", icon: "ri-bar-chart-2-line", group: "Core" },
  { key: "onboarding", label: "Onboarding", icon: "ri-user-add-line", group: "Workforce" },
  { key: "onboarding-checklist", label: "Onboarding Checklist", icon: "ri-task-line", group: "Workforce" },
  { key: "leave", label: "Leave Requests", icon: "ri-calendar-event-line", group: "Workforce" },
  { key: "leave-calendar", label: "Leave Calendar", icon: "ri-calendar-2-line", group: "Workforce" },
  { key: "hire", label: "Recruitment", icon: "ri-briefcase-line", group: "Workforce" },
  { key: "offboard", label: "Offboarding", icon: "ri-user-unfollow-line", group: "Workforce" },
  { key: "org-chart", label: "Org Chart", icon: "ri-organization-chart", group: "Workforce" },
  { key: "performance", label: "Performance", icon: "ri-star-line", group: "Workforce" },
  { key: "attendance", label: "Attendance", icon: "ri-fingerprint-line", group: "Workforce" },
  { key: "training", label: "Training", icon: "ri-graduation-cap-line", group: "Workforce" },
  { key: "disciplinary", label: "Disciplinary", icon: "ri-alert-line", group: "Workforce" },
  { key: "shifts", label: "Shifts", icon: "ri-calendar-schedule-line", group: "Workforce" },
  { key: "meeting-rooms", label: "Meeting Rooms", icon: "ri-door-open-line", group: "Workforce" },
  { key: "tasks", label: "Tasks", icon: "ri-checkbox-multiple-line", group: "Workforce" },
  { key: "payroll", label: "Payroll", icon: "ri-money-dollar-circle-line", group: "Operations" },
  { key: "payroll-approval", label: "Payroll Approval", icon: "ri-file-check-line", group: "Operations" },
  { key: "finance", label: "Finance", icon: "ri-bank-line", group: "Operations" },
  { key: "it-management", label: "IT Management", icon: "ri-computer-line", group: "Operations" },
  { key: "benefits", label: "Benefits", icon: "ri-heart-pulse-line", group: "Operations" },
  { key: "tools", label: "HR Tools", icon: "ri-tools-line", group: "Operations" },
  { key: "announcements", label: "Announcements", icon: "ri-megaphone-line", group: "Operations" },
  { key: "documents", label: "Documents", icon: "ri-folder-line", group: "Operations" },
  { key: "reports", label: "Reports", icon: "ri-file-chart-line", group: "Insights" },
  { key: "audit-log", label: "Audit Log", icon: "ri-shield-check-line", group: "Insights" },
  { key: "self-service", label: "Self-Service", icon: "ri-user-settings-line", group: "Insights" },
  { key: "notifications", label: "Notifications", icon: "ri-notification-3-line", group: "System" },
  { key: "unity-apps", label: "Unity Apps", icon: "ri-apps-line", group: "System" },
  { key: "settings", label: "Settings", icon: "ri-settings-3-line", group: "System" },
] as const;

export const MODULE_GROUPS = ["Core", "Workforce", "Operations", "Insights", "System"] as const;

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
