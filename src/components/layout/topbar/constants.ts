// Static lookup tables for the TopBar component tree.
//
// These were previously defined INSIDE component bodies (MobileDrawer,
// runSearch), which caused React to re-allocate them on every render.
// Moving them here to module scope means they are created exactly once
// when the module is first imported.

import type { SearchResult } from "./types";

export interface DrawerItem {
  path: string;
  label: string;
  icon: string;
  module: string;
  sublabel?: string;
}

export interface DrawerGroup {
  label: string;
  items: DrawerItem[];
}

const CORE_ITEMS: DrawerItem[] = [
  { path: "/", label: "Dashboard", sublabel: "Main overview", icon: "ri-dashboard-line", module: "dashboard" },
  { path: "/employees", label: "Directory", sublabel: "Browse all staff", icon: "ri-user-search-line", module: "employees" },
  { path: "/branches", label: "Branches", sublabel: "10 branches", icon: "ri-building-line", module: "branches" },
  { path: "/analytics", label: "Analytics", sublabel: "Charts & insights", icon: "ri-bar-chart-2-line", module: "analytics" },
];

const WORKFORCE_ITEMS: DrawerItem[] = [
  { path: "/onboarding", label: "Onboarding", sublabel: "New hire pipeline", icon: "ri-user-add-line", module: "onboarding" },
  { path: "/onboarding-checklist", label: "Checklists", sublabel: "Task assignments", icon: "ri-task-line", module: "onboarding-checklist" },
  { path: "/leave", label: "Leave", sublabel: "Approve / reject", icon: "ri-calendar-event-line", module: "leave" },
  { path: "/leave-calendar", label: "Leave Calendar", sublabel: "Team availability", icon: "ri-calendar-2-line", module: "leave-calendar" },
  { path: "/shifts", label: "Shifts", sublabel: "Shift scheduling", icon: "ri-calendar-schedule-line", module: "shifts" },
  { path: "/hire", label: "Hire", sublabel: "Candidates & jobs", icon: "ri-briefcase-line", module: "hire" },
  { path: "/offboard", label: "Off Board", sublabel: "Exit workflows", icon: "ri-user-unfollow-line", module: "offboard" },
  { path: "/org-chart", label: "Org Chart", sublabel: "Reporting structure", icon: "ri-organization-chart", module: "org-chart" },
  { path: "/performance", label: "Performance", sublabel: "Reviews & goals", icon: "ri-star-line", module: "performance" },
  { path: "/attendance", label: "Attendance", sublabel: "Punch records", icon: "ri-fingerprint-line", module: "attendance" },
  { path: "/training", label: "Training", sublabel: "Courses & programs", icon: "ri-graduation-cap-line", module: "training" },
  { path: "/disciplinary", label: "Disciplinary", sublabel: "Incidents & actions", icon: "ri-alert-line", module: "disciplinary" },
  { path: "/meeting-rooms", label: "Meeting Rooms", sublabel: "Book a room", icon: "ri-door-open-line", module: "meeting-rooms" },
  { path: "/tasks", label: "Tasks", sublabel: "Track and assign work", icon: "ri-checkbox-multiple-line", module: "tasks" },
];

const OPERATIONS_ITEMS: DrawerItem[] = [
  { path: "/payroll-module", label: "Payroll", sublabel: "Monthly payroll", icon: "ri-money-dollar-circle-line", module: "payroll" },
  { path: "/payroll-approval", label: "Pay Approval", sublabel: "Review & approve runs", icon: "ri-file-check-line", module: "payroll-approval" },
  { path: "/finance", label: "Finance", sublabel: "Expense tracking", icon: "ri-bank-line", module: "finance" },
  { path: "/it-management", label: "IT", sublabel: "Assets & tickets", icon: "ri-computer-line", module: "it-management" },
  { path: "/benefits", label: "Benefits", sublabel: "Plans & enrollment", icon: "ri-heart-pulse-line", module: "benefits" },
  { path: "/tools", label: "Tools", sublabel: "Productivity tools", icon: "ri-tools-line", module: "tools" },
  { path: "/announcements", label: "Announcements", sublabel: "Company news", icon: "ri-megaphone-line", module: "announcements" },
  { path: "/documents", label: "Documents", sublabel: "Company files", icon: "ri-folder-line", module: "documents" },
];

const INSIGHTS_ITEMS: DrawerItem[] = [
  { path: "/reports", label: "Reports", sublabel: "CSV / PDF reports", icon: "ri-file-chart-line", module: "reports" },
  { path: "/audit-log", label: "Audit Log", sublabel: "Activity history", icon: "ri-shield-check-line", module: "audit-log" },
  { path: "/self-service", label: "Self-Service", sublabel: "Employee view", icon: "ri-user-settings-line", module: "self-service" },
];

const SYSTEM_ITEMS: DrawerItem[] = [
  { path: "/admin?tab=users", label: "Admin Portal", sublabel: "Accounts & permissions", icon: "ri-user-settings-line", module: "admin" },
  { path: "/notifications", label: "Notifications", sublabel: "Alerts & updates", icon: "ri-notification-3-line", module: "notifications" },
  { path: "/settings", label: "Settings", sublabel: "System configuration", icon: "ri-settings-3-line", module: "settings" },
];

export const DRAWER_GROUPS: DrawerGroup[] = [
  { label: "Core", items: CORE_ITEMS },
  { label: "Workforce", items: WORKFORCE_ITEMS },
  { label: "Operations", items: OPERATIONS_ITEMS },
  { label: "Insights", items: INSIGHTS_ITEMS },
  { label: "System", items: SYSTEM_ITEMS },
];

export const MODULE_SEARCH_RESULTS: SearchResult[] = [
  ...CORE_ITEMS,
  ...WORKFORCE_ITEMS,
  ...OPERATIONS_ITEMS,
  ...INSIGHTS_ITEMS,
  ...SYSTEM_ITEMS,
].map((item) => ({
  id: `m-${item.module}`,
  label: item.label,
  sublabel: item.sublabel || "",
  icon: item.icon,
  path: item.path,
  category: "Module" as const,
}));

export const PATH_MODULE_OVERRIDES: Record<string, string> = {
  "/": "dashboard",
  "/payroll-module": "payroll",
  "/admin": "admin",
};

export function pathToModule(path: string): string {
  return PATH_MODULE_OVERRIDES[path] ?? path.slice(1);
}
