import type { RoleFormState } from "./types";
import { SCOPE_HINTS } from "./scopeHints";
import { ALL_MODULES, MODULE_GROUPS } from "./modulesConfig";

export { ALL_MODULES, MODULE_GROUPS };

export interface RoleCategoryDefinition {
  key: string;
  name: string;
  order: number;
  badge: string;
  badgeColor: string;
  icon: string;
  color: string;
  gradient: string;
  lightBg: string;
  borderClass: string;
  tagline: string;
  summary: string;
  scopeSummary: string;
  highlights: string[];
  restrictions: string[];
}

export const ROLE_CATEGORIES: RoleCategoryDefinition[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    order: 1,
    badge: "All Functions of System",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/50",
    icon: "ri-shield-star-fill",
    color: "#253C7D",
    gradient: "from-[#1E2E5D] via-[#253C7D] to-[#1E2E5D]",
    lightBg: "bg-indigo-50/40 dark:bg-indigo-950/20",
    borderClass: "border-indigo-200/80 dark:border-indigo-800/40 hover:border-indigo-400 dark:hover:border-indigo-600",
    tagline: "Total Authority · System Administration",
    summary: "Complete and unrestricted access across all system modules, configurations, salaries, and user accounts.",
    scopeSummary: "System-wide full control across all Business Units",
    highlights: [
      "All functions of system without restriction",
      "Full view, create, edit & delete capabilities",
      "Full access to salary, compensation & payroll modules",
      "System administration, user account & permission management",
      "Manage Privacy PIN Code, system email & timezone configurations",
    ],
    restrictions: [],
  },
  {
    key: "admin",
    name: "Admin",
    order: 2,
    badge: "All Functions (Except Salary)",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/50",
    icon: "ri-admin-fill",
    color: "#7C3AED",
    gradient: "from-[#5B21B6] via-[#7C3AED] to-[#5B21B6]",
    lightBg: "bg-violet-50/40 dark:bg-violet-950/20",
    borderClass: "border-violet-200/80 dark:border-violet-800/40 hover:border-violet-400 dark:hover:border-violet-600",
    tagline: "Full Operations · Salary Excluded",
    summary: "Full operational administration across employee profiles, recruitment, leaves, and attendance, strictly excluding salary.",
    scopeSummary: "Full operational access across all modules except salary",
    highlights: [
      "All operational functions (employees, attendance, leaves, recruitment)",
      "Manage, create and edit employee records & organizational structures",
      "Approve requests and manage user assignments",
      "Full access to Admin Portal",
    ],
    restrictions: [
      "Blocked from salary & payroll modules (/payroll-module, /payroll-approval)",
      "Cannot view employee salary or compensation figures across the system",
      "Cannot adjust system email, timezone, or manage Privacy PIN Code",
    ],
  },
  {
    key: "chairperson",
    name: "Chairwoman and Chairman",
    order: 3,
    badge: "All Functions (Except Edit)",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50",
    icon: "ri-vip-crown-fill",
    color: "#D97706",
    gradient: "from-[#B45309] via-[#D97706] to-[#B45309]",
    lightBg: "bg-amber-50/40 dark:bg-amber-950/20",
    borderClass: "border-amber-200/80 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-600",
    tagline: "Executive Board Oversight · View-Only",
    summary: "Executive board oversight across all system functions in view-only mode without editing or modifying records.",
    scopeSummary: "All functions of system in view-only mode (except edit)",
    highlights: [
      "Access to all system functions and modules across all BUs",
      "Executive overview, financial reports, analytics & audit logs",
      "Review candidates, requisitions & company KPIs",
      "Executive board-level visibility across all Business Units",
    ],
    restrictions: [
      "Cannot edit or mutate records (system-wide view-only mode)",
      "Creation, edit, and deletion actions are disabled",
      "Cannot adjust system email, timezone, or manage Privacy PIN Code",
    ],
  },
  {
    key: "line_manager",
    name: "Line Manager",
    order: 4,
    badge: "Supervisory Scope (Except Salary & Edit)",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/50",
    icon: "ri-team-fill",
    color: "#0284C7",
    gradient: "from-[#0369A1] via-[#0284C7] to-[#0369A1]",
    lightBg: "bg-sky-50/40 dark:bg-sky-950/20",
    borderClass: "border-sky-200/80 dark:border-sky-800/40 hover:border-sky-400 dark:hover:border-sky-600",
    tagline: "Direct Supervisees & Dept · Team Attendance",
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
      "Cannot view staff outside your department or supervision chain",
      "Cannot adjust email, timezone, or manage Privacy PIN Code",
    ],
  },
  {
    key: "employee",
    name: "Employee",
    order: 5,
    badge: "Self-Service Only",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50",
    icon: "ri-user-smile-fill",
    color: "#059669",
    gradient: "from-[#047857] via-[#059669] to-[#047857]",
    lightBg: "bg-emerald-50/40 dark:bg-emerald-950/20",
    borderClass: "border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-600",
    tagline: "Personal Information · Self Attendance Check",
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
      "Cannot adjust email, timezone, or manage Privacy PIN Code",
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
  { group: "action" as const, key: "candidates_manage", label: "Can register & add candidates to Talent Pipeline (HR / Recruiter)", hint: SCOPE_HINTS.candidates_manage },
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

export const DEFAULT_ROLE_NAMES = [
  "super admin",
  "admin",
  "chairwoman and chairman",
  "line manager",
  "employee",
];

export const isDefaultCanonicalRole = (role: { name?: string; is_admin?: boolean }) => {
  if (role.is_admin || (role.name || "").trim().toLowerCase() === "super admin") return true;
  return DEFAULT_ROLE_NAMES.includes((role.name || "").trim().toLowerCase());
};

export interface CategoryPreset {
  key: string;
  name: string;
  badge: string;
  color: string;
  is_admin: boolean;
  allowed_modules: string[];
  description: string;
  scopes: Partial<RoleFormState>;
}

export const CATEGORY_PRESETS: Record<string, CategoryPreset> = {
  super_admin: {
    key: "super_admin",
    name: "Super Admin",
    badge: "All Functions of System",
    color: "#253C7D",
    is_admin: true,
    allowed_modules: ALL_MODULES.map((m) => m.key),
    description: "Total authority across all system modules, configurations, salaries, and user accounts.",
    scopes: {},
  },
  admin: {
    key: "admin",
    name: "Admin",
    badge: "All Functions (Except Salary)",
    color: "#7C3AED",
    is_admin: false,
    allowed_modules: ALL_MODULES.map((m) => m.key).filter((k) => k !== "payroll" && k !== "payroll-approval"),
    description: "Full operational administration across modules, excluding salary & payroll.",
    scopes: {
      employees_manage: true,
      meeting_rooms_approve: true,
      leave_approve: true,
      leave_view_all_employees: true,
      attendance_view_all_employees: true,
      performance_view_all_employees: true,
      disciplinary_view_all_employees: true,
      task_view_all_employees: true,
      candidates_manage: false,
      payroll_view_all_employees: false,
    },
  },
  chairperson: {
    key: "chairperson",
    name: "Chairwoman and Chairman",
    badge: "All Functions (Except Edit)",
    color: "#D97706",
    is_admin: false,
    allowed_modules: ALL_MODULES.map((m) => m.key),
    description: "Executive board-level oversight. View-only access across all system functions (except edit).",
    scopes: {
      leave_view_all_employees: true,
      payroll_view_all_employees: true,
      attendance_view_all_employees: true,
      performance_view_all_employees: true,
      disciplinary_view_all_employees: true,
      task_view_all_employees: true,
      hiring_requests_chairman_approve: true,
      hiring_requests_branch_approve: true,
      candidate_approval_chairwoman_sign: true,
      employees_manage: false,
    },
  },
  line_manager: {
    key: "line_manager",
    name: "Line Manager",
    badge: "Supervisory Scope (Except Salary & Edit)",
    color: "#0284C7",
    is_admin: false,
    allowed_modules: [
      "dashboard",
      "employees",
      "attendance",
      "leave",
      "leave-calendar",
      "tasks",
      "performance",
      "training",
      "meeting-rooms",
      "announcements",
      "notifications",
      "documents",
      "self-service",
      "org-chart",
    ],
    description: "Supervisory role position for direct supervisees & department team attendance.",
    scopes: {
      leave_manager_endorse: true,
      employees_manage: false,
      payroll_view_all_employees: false,
    },
  },
  employee: {
    key: "employee",
    name: "Employee",
    badge: "Self-Service Only",
    color: "#059669",
    is_admin: false,
    allowed_modules: [
      "dashboard",
      "self-service",
      "attendance",
      "leave",
      "leave-calendar",
      "notifications",
      "announcements",
      "training",
      "meeting-rooms",
      "tasks",
    ],
    description: "Staff position with self-service access to personal profile, leaves, and attendance.",
    scopes: {},
  },
};

export function getRoleCategoryKey(role: { name?: string; is_admin?: boolean; category?: string | null; id?: number }): string {
  if (role.category && ROLE_CATEGORIES.some((c) => c.key === role.category)) {
    return role.category;
  }
  if (role.id) {
    try {
      const catMap = JSON.parse(localStorage.getItem("hrm_role_category_map") || "{}");
      if (catMap[role.id] && ROLE_CATEGORIES.some((c) => c.key === catMap[role.id])) {
        return catMap[role.id];
      }
    } catch (_e) { /* ignore */ }
  }
  if (role.is_admin || (role.name || "").trim().toLowerCase() === "super admin") {
    return "super_admin";
  }
  const n = (role.name || "").toLowerCase();
  if (/chair/i.test(n)) {
    return "chairperson";
  }
  if (/line\s*manager|supervisor/i.test(n)) {
    return "line_manager";
  }
  if (/employee|staff/i.test(n) && !/admin|manager/i.test(n)) {
    return "employee";
  }
  return "admin";
}

export function getShortBuName(name?: string | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  const normalized = trimmed.toUpperCase();

  if (normalized.includes("HR ADMIN") || normalized.includes("HUMAN RESOURCE")) {
    return "HR Admin";
  }
  if (normalized === "HEADQUARTERS" || normalized.includes("HEADQUARTER") || normalized === "HQ") {
    return "HQ";
  }

  let shortName = trimmed
    .replace(/UNIQUE\s+NOBLE/gi, "UN")
    .replace(/HOLDINGS?/gi, "Holdings")
    .replace(/INVESTMENTS?/gi, "Invest")
    .replace(/TRADING/gi, "Trading")
    .replace(/DEVELOPMENTS?/gi, "Dev")
    .replace(/MANAGEMENT/gi, "Mgmt")
    .replace(/ENTERPRISES?/gi, "Ent")
    .replace(/LOGISTICS?/gi, "Logistics")
    .replace(/INTERNATIONAL/gi, "Intl")
    .replace(/CORPORATION/gi, "Corp")
    .replace(/SERVICES?/gi, "Services")
    .replace(/DIVISIONS?/gi, "Div")
    .replace(/DEPARTMENTS?/gi, "Dept")
    .replace(/\s+/g, " ")
    .trim();

  return shortName || trimmed;
}

export function getRoleParentCategoryName(role: { name?: string; is_admin?: boolean; category?: string | null; id?: number }): string {
  const catKey = role.category || getRoleCategoryKey(role);
  const catObj = ROLE_CATEGORIES.find((c) => c.key === catKey);
  return catObj ? catObj.name : "Custom";
}

export function getRoleScopeLabel(role: { branch_name?: string | null; branch_ids?: string[] | null; branch_id?: string | null; site_name?: string | null }): string {
  if (role.site_name) {
    return `Site: ${getShortBuName(role.site_name)}`;
  }
  const bIds = role.branch_ids || (role.branch_id ? role.branch_id.split(",").map((s) => s.trim()).filter(Boolean) : []);
  if (bIds.length === 0) {
    return "Global (All BUs)";
  }
  if (role.branch_name) {
    const parts = role.branch_name.split(",").map((s) => getShortBuName(s.trim())).filter(Boolean);
    return parts.join(", ");
  }
  return `${bIds.length} BUs`;
}

export function formatRoleOptionLabel(role: { name?: string; is_admin?: boolean; category?: string | null; id?: number; branch_name?: string | null; branch_ids?: string[] | null; branch_id?: string | null; site_name?: string | null }): string {
  const roleName = role.name || "Role";
  const catName = getRoleParentCategoryName(role);
  const scopeLabel = getRoleScopeLabel(role);
  const isDirectArchetype = roleName.trim().toLowerCase() === catName.toLowerCase();

  if (isDirectArchetype) {
    return `${roleName} • ${scopeLabel}`;
  }
  return `${roleName} [Parent: ${catName}] • ${scopeLabel}`;
}

export const BLANK_ROLE: RoleFormState = {
  name: "",
  category: "line_manager",
  description: "",
  color: "#0284C7",
  is_admin: false,
  branch_id: null,
  work_location_id: null,
  allowed_modules: [],
  ...Object.fromEntries(SCOPE_OVERRIDES.map((o) => [o.key, false])) as unknown as Omit<RoleFormState, "name" | "category" | "description" | "color" | "is_admin" | "branch_id" | "work_location_id" | "allowed_modules">,
};
