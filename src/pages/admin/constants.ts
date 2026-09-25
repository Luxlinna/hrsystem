import type { RoleFormState } from "./types";
import { SCOPE_HINTS } from "./scopeHints";
import { ALL_MODULES, MODULE_GROUPS } from "./modulesConfig";

export { ALL_MODULES, MODULE_GROUPS };

export interface RoleCategoryDefinition {
  key: string;
  name: string;
  badge: string;
  badgeColor: string;
  icon: string;
  color: string;
  summary: string;
  scopeSummary: string;
  highlights: string[];
  restrictions: string[];
}

export const ROLE_CATEGORIES: RoleCategoryDefinition[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    badge: "All Functions",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40",
    icon: "ri-shield-star-line",
    color: "#253C7D",
    summary: "Complete and unrestricted access across all system modules, configurations, salaries, and user accounts.",
    scopeSummary: "System-wide full control across all Business Units",
    highlights: [
      "All functions of system",
      "Full view, create, edit & delete capabilities",
      "Full access to salary, compensation & payroll modules",
      "System administration & user role management",
    ],
    restrictions: [],
  },
  {
    key: "admin",
    name: "Admin",
    badge: "All Except Salary",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/40",
    icon: "ri-admin-line",
    color: "#7C3AED",
    summary: "Full operational administration across employee profiles, recruitment, leaves, and attendance, strictly excluding salary.",
    scopeSummary: "Full operational access across all modules except salary",
    highlights: [
      "All operational functions (employees, attendance, leaves, recruitment)",
      "Manage and edit employee records and organizational data",
      "Approve requests and manage user assignments",
      "Full access to Admin Portal",
    ],
    restrictions: [
      "Blocked from salary & payroll modules (/payroll-module, /payroll-approval)",
      "Cannot view employee salary or compensation figures",
    ],
  },
  {
    key: "chairperson",
    name: "Chairwoman and Chairman",
    badge: "All Except Edit",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40",
    icon: "ri-vip-crown-line",
    color: "#D97706",
    summary: "Executive board oversight across all system functions in view-only mode without editing or modifying records.",
    scopeSummary: "All functions of system in view-only mode (except edit)",
    highlights: [
      "Access to all system functions and modules",
      "Executive overview, financial reports, analytics & audit log",
      "Review candidates, requisitions & company metrics",
      "Executive board-level visibility across all BUs",
    ],
    restrictions: [
      "Cannot edit or mutate records (view-only mode)",
      "Creation and deletion actions are disabled",
    ],
  },
  {
    key: "line_manager",
    name: "Line Manager",
    badge: "Supervisor & Dept Scope",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/40",
    icon: "ri-team-line",
    color: "#2563EB",
    summary: "Supervisory role over staff under your direct supervision, division or department. Can check team attendance, except salary and edit.",
    scopeSummary: "Scope limited to supervised staff & own division/department",
    highlights: [
      "View staff under your supervisor or within your division/department",
      "Check and monitor attendance of supervisees & direct reports",
      "Endorse team leave requests (Stage 1 endorsement)",
      "Manage team tasks, reviews and training assignments",
    ],
    restrictions: [
      "Excluded from viewing salary & compensation information",
      "Cannot edit employee master profiles or system configurations",
      "Cannot view staff outside your department/supervision chain",
    ],
  },
  {
    key: "employee",
    name: "Employee",
    badge: "Self-Service Only",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40",
    icon: "ri-user-line",
    color: "#059669",
    summary: "Standard staff access limited to your own information, personal attendance punching, leave requests, and company announcements.",
    scopeSummary: "Self-service scope for personal information only",
    highlights: [
      "Access your own information via Self-Service profile",
      "Check your own attendance (punch in / punch out & view history)",
      "Submit personal leave requests and track approvals",
      "View company announcements, events and assigned tasks",
    ],
    restrictions: [
      "Cannot view other employees' records or directory details",
      "No administrative or editing permissions",
    ],
  },
];

export const COLORS = [
  "#253C7D", "#7C3AED", "#059669", "#D97706", "#DC2626",
  "#2563EB", "#DB2777", "#EA580C", "#64748B", "#0369A1",
] as const;

export const ACTION_OVERRIDES = [
  { group: "action" as const, key: "leave_manager_endorse", label: "Leave Stage 1: Can endorse team member leave requests (Line Manager)", hint: SCOPE_HINTS.leave_manager_endorse },
  { group: "action" as const, key: "leave_bu_admin_endorse", label: "Leave Stage 1: Can endorse department manager leave requests (BU Admin)", hint: SCOPE_HINTS.leave_bu_admin_endorse },
  { group: "action" as const, key: "leave_approve", label: "Leave Stage 2: Can grant final HR Division authorization (Final Sign-off)", hint: SCOPE_HINTS.leave_approve },
  { group: "action" as const, key: "meeting_rooms_approve", label: "Can approve / reject meeting room bookings", hint: SCOPE_HINTS.meeting_rooms_approve },
  { group: "action" as const, key: "hiring_requests_branch_approve", label: "Stage 1: Can approve branch hiring requests (Forward to HR)", hint: SCOPE_HINTS.hiring_requests_branch_approve },
  { group: "action" as const, key: "hiring_requests_hr_review", label: "Stage 2: Can review requisitions in HR Division (Forward to HR Admin)", hint: SCOPE_HINTS.hiring_requests_hr_review },
  { group: "action" as const, key: "hiring_requests_hr_admin_approve", label: "Stage 3: Can approve requisitions in HR Division (Forward to Chairman)", hint: SCOPE_HINTS.hiring_requests_hr_admin_approve },
  { group: "action" as const, key: "hiring_requests_chairman_approve", label: "Stage 4: Can perform final Chairman authorization & publish live jobs", hint: SCOPE_HINTS.hiring_requests_chairman_approve },
  { group: "action" as const, key: "candidate_approval_ceo_sign", label: "Candidate Approval Step 1: Can sign as CEO by BU (or delegate)", hint: SCOPE_HINTS.candidate_approval_ceo_sign },
  { group: "action" as const, key: "candidate_approval_hr_sign", label: "Candidate Approval Step 2: Can sign as HR Manager at HR Division (or delegate)", hint: SCOPE_HINTS.candidate_approval_hr_sign },
  { group: "action" as const, key: "candidate_approval_director_sign", label: "Candidate Approval Step 3: Can sign as HR Admin Director (or delegate)", hint: SCOPE_HINTS.candidate_approval_director_sign },
  { group: "action" as const, key: "candidate_approval_chairwoman_sign", label: "Candidate Approval Step 4: Final sign-off as Chairwoman", hint: SCOPE_HINTS.candidate_approval_chairwoman_sign },
  { group: "action" as const, key: "employees_manage", label: "Can edit employee records (role, department, status, manager)", hint: SCOPE_HINTS.employees_manage },
  { group: "action" as const, key: "exit_manage_settings", label: "Can manage Exit Settings (Exit Types & Reason Types)", hint: SCOPE_HINTS.exit_manage_settings },
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
  branch_id: null,
  work_location_id: null,
  allowed_modules: [],
  ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, false])) as unknown as Omit<RoleFormState, "name" | "description" | "color" | "is_admin" | "branch_id" | "work_location_id" | "allowed_modules">,
};
