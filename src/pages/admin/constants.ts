import type { RoleFormState } from "./types";

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

export const SCOPE_OVERRIDES = [
  { group: "action", key: "leave_approve", label: "Can approve / reject leave requests", hint: "Off by default. Required to act on someone else's leave request. Enforced in the database, not just hidden in the UI — without it a role can still submit and cancel its own leave." },
  { group: "action", key: "meeting_rooms_approve", label: "Can approve / reject meeting room bookings", hint: "Allows this role to approve, reject, and adjust requirements & refreshments for meeting room reservations across all branches." },
  { group: "action", key: "hiring_requests_branch_approve", label: "Can approve branch hiring requests (Forward to HR)", hint: "Allows Branch Admins, Branch Managers, or authorized branch leaders to approve employee requisitions from their branch and route them to HR Division." },
  { group: "action", key: "hiring_requests_hr_review", label: "Can perform final HR Division review & publish live jobs", hint: "Allows HR Division officers/managers to accept, assign, and publish incoming branch requisitions as active job postings." },
  { group: "action", key: "employees_manage", label: "Can edit employee records (role, department, status, manager)", hint: "Off by default — this role can view the Employee Directory but profiles open read-only." },
  { group: "action", key: "attendance_notify", label: "Receives attendance check-in / check-out notifications", hint: "Off by default. When on, this role gets notified on employee check-ins and check-outs — whether that's every clock event or only late/early exceptions is set globally in Settings → Notifications." },

  { group: "visibility", key: "self_service_all_employees", label: "Can view/switch other employees in Self-Service", hint: "Off by default — this role only sees the employee record matching their own account email." },
  { group: "visibility", key: "leave_view_all_employees", label: "Can view all employees' leave requests", hint: "Off by default — this role only sees and submits their own leave requests (the team calendar stays visible either way). Viewing does NOT grant approval — use \"Can approve / reject leave requests\" above for that." },
  { group: "visibility", key: "leave_view_own_branch", label: "Can view their own branch's leave requests", hint: "For a branch/team-lead style role. Ignored if \"view all employees\" leave is already on. Scopes to employees who share this person's branch. Viewing does NOT grant approval." },
  { group: "visibility", key: "payroll_view_all_employees", label: "Can view all employees' payroll", hint: "Off by default — this role only sees their own payslip data." },
  { group: "visibility", key: "attendance_view_all_employees", label: "Can view all employees' attendance records", hint: "Off by default — this role only sees their own attendance history." },
  { group: "visibility", key: "attendance_view_own_branch", label: "Can view their own branch's attendance records", hint: "For a branch/team-lead style role. Ignored if \"view all employees\" attendance is already on." },
  { group: "visibility", key: "performance_view_all_employees", label: "Can view/manage all employees' performance reviews", hint: "Off by default — this role only sees their own reviews and goals." },
  { group: "visibility", key: "performance_view_own_branch", label: "Can view/manage their own branch's performance reviews", hint: "For a branch/team-lead style role. Ignored if \"view all employees\" performance is already on." },
  { group: "visibility", key: "disciplinary_view_all_employees", label: "Can view all employees' disciplinary records", hint: "Off by default — this role only sees their own records, if any." },
  { group: "visibility", key: "disciplinary_view_own_branch", label: "Can view their own branch's disciplinary records", hint: "For a branch/team-lead style role. Ignored if \"view all employees\" disciplinary is already on." },
  { group: "visibility", key: "task_view_all_employees", label: "Can view/assign tasks for all employees", hint: "Off by default — this role only sees and manages their own tasks." },
  { group: "visibility", key: "task_view_own_branch", label: "Can view/assign their own branch's tasks", hint: "For a branch/team-lead style role. Ignored if \"view all employees\" tasks is already on." },
] as const;

export const BLANK_ROLE: RoleFormState = {
  name: "",
  description: "",
  color: "#253C7D",
  is_admin: false,
  allowed_modules: [],
  ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, false])) as unknown as Omit<RoleFormState, "name" | "description" | "color" | "is_admin" | "allowed_modules">,
};
