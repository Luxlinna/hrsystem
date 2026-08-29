// Static lookup tables for the TopBar component tree.
//
// These were previously defined INSIDE component bodies (MobileDrawer,
// runSearch), which caused React to re-allocate them on every render.
// Moving them here to module scope means they are created exactly once
// when the module is first imported.

import type { SearchResult } from "./types";

// ── Global search: navigable module list ────────────────────────────────────
export const MODULE_SEARCH_RESULTS: SearchResult[] = [
  { id: "m-dashboard",     label: "Dashboard",          sublabel: "Main overview",       icon: "ri-dashboard-line",          path: "/",                  category: "Module" },
  { id: "m-employees",     label: "Employee Directory", sublabel: "Browse all staff",     icon: "ri-user-search-line",        path: "/employees",         category: "Module" },
  { id: "m-branches",      label: "Branch Management",  sublabel: "10 branches",          icon: "ri-building-line",           path: "/branches",          category: "Module" },
  { id: "m-analytics",     label: "Analytics",          sublabel: "Charts & insights",    icon: "ri-bar-chart-2-line",        path: "/analytics",         category: "Module" },
  { id: "m-onboarding",    label: "Onboarding",         sublabel: "New hire pipeline",    icon: "ri-user-add-line",           path: "/onboarding",        category: "Module" },
  { id: "m-checklist",     label: "Onboarding Checklist", sublabel: "Task assignments",  icon: "ri-task-line",               path: "/onboarding-checklist", category: "Module" },
  { id: "m-leave",         label: "Leave Requests",     sublabel: "Approve / reject",     icon: "ri-calendar-event-line",    path: "/leave",             category: "Module" },
  { id: "m-leave-cal",     label: "Leave Calendar",     sublabel: "Team availability",    icon: "ri-calendar-2-line",        path: "/leave-calendar",    category: "Module" },
  { id: "m-hire",          label: "Hire / Recruitment", sublabel: "Candidates & jobs",    icon: "ri-briefcase-line",          path: "/hire",              category: "Module" },
  { id: "m-offboard",      label: "Offboarding",        sublabel: "Exit workflows",       icon: "ri-user-unfollow-line",      path: "/offboard",          category: "Module" },
  { id: "m-orgchart",      label: "Org Chart",          sublabel: "Reporting structure",  icon: "ri-organization-chart",     path: "/org-chart",         category: "Module" },
  { id: "m-payroll",       label: "Payroll",            sublabel: "Monthly payroll",      icon: "ri-money-dollar-circle-line", path: "/payroll-module",  category: "Module" },
  { id: "m-payapproval",   label: "Payroll Approval",   sublabel: "Review & approve runs", icon: "ri-file-check-line",      path: "/payroll-approval",  category: "Module" },
  { id: "m-finance",       label: "Finance",            sublabel: "Expense tracking",     icon: "ri-bank-line",               path: "/finance",           category: "Module" },
  { id: "m-it",            label: "IT Management",      sublabel: "Assets & tickets",     icon: "ri-computer-line",           path: "/it-management",     category: "Module" },
  { id: "m-benefits",      label: "Benefits",           sublabel: "Plans & enrollment",   icon: "ri-heart-pulse-line",        path: "/benefits",          category: "Module" },
  { id: "m-tools",         label: "HR Tools",           sublabel: "Productivity tools",   icon: "ri-tools-line",              path: "/tools",             category: "Module" },
  { id: "m-reports",       label: "Reports & Export",   sublabel: "CSV / PDF reports",    icon: "ri-file-chart-line",         path: "/reports",           category: "Module" },
  { id: "m-audit",         label: "Audit Log",          sublabel: "Activity history",     icon: "ri-shield-check-line",       path: "/audit-log",         category: "Module" },
  { id: "m-selfservice",   label: "Self-Service Portal", sublabel: "Employee view",       icon: "ri-user-settings-line",     path: "/self-service",      category: "Module" },
  { id: "m-settings",      label: "Settings",           sublabel: "System configuration", icon: "ri-settings-3-line",         path: "/settings",          category: "Module" },
  { id: "m-usermanagement", label: "Admin Portal",   sublabel: "Accounts & permissions", icon: "ri-user-settings-line",   path: "/admin?tab=users",   category: "Module" },
  { id: "m-notifications", label: "Notifications",      sublabel: "Alerts & updates",     icon: "ri-notification-3-line",    path: "/notifications",     category: "Module" },
  { id: "m-meeting-rooms", label: "Meeting Rooms",      sublabel: "Book a room",          icon: "ri-door-open-line",          path: "/meeting-rooms",     category: "Module" },
  { id: "m-tasks",         label: "Tasks",              sublabel: "Track and assign work", icon: "ri-checkbox-multiple-line", path: "/tasks",             category: "Module" },
];

// Maps a URL path → permission module key.
// Paths that don't convert 1:1 (e.g. /payroll-module → "payroll") are listed
// explicitly; everything else strips the leading slash.
export const PATH_MODULE_OVERRIDES: Record<string, string> = {
  "/": "dashboard",
  "/payroll-module": "payroll",
  "/admin": "admin",
};

export function pathToModule(path: string): string {
  return PATH_MODULE_OVERRIDES[path] ?? path.slice(1);
}

// ── Mobile drawer navigation groups ─────────────────────────────────────────
// Defined at module scope so MobileDrawer never re-allocates this on render.
export interface DrawerItem {
  path: string;
  label: string;
  icon: string;
  module: string;
}

export interface DrawerGroup {
  label: string;
  items: DrawerItem[];
}

export const DRAWER_GROUPS: DrawerGroup[] = [
  {
    label: "Core",
    items: [
      { path: "/",          label: "Dashboard", icon: "ri-dashboard-line",    module: "dashboard" },
      { path: "/employees", label: "Directory",  icon: "ri-user-search-line", module: "employees" },
      { path: "/branches",  label: "Branches",   icon: "ri-building-line",    module: "branches"  },
      { path: "/analytics", label: "Analytics",  icon: "ri-bar-chart-2-line", module: "analytics" },
    ],
  },
  {
    label: "Workforce",
    items: [
      { path: "/onboarding",          label: "Onboarding",    icon: "ri-user-add-line",           module: "onboarding"          },
      { path: "/onboarding-checklist", label: "Checklists",   icon: "ri-task-line",               module: "onboarding-checklist"},
      { path: "/leave",               label: "Leave",         icon: "ri-calendar-event-line",     module: "leave"               },
      { path: "/leave-calendar",      label: "Leave Calendar",icon: "ri-calendar-2-line",         module: "leave-calendar"      },
      { path: "/shifts",              label: "Shifts",        icon: "ri-calendar-schedule-line",  module: "shifts"              },
      { path: "/hire",                label: "Hire",          icon: "ri-briefcase-line",          module: "hire"                },
      { path: "/offboard",            label: "Off Board",     icon: "ri-user-unfollow-line",      module: "offboard"            },
      { path: "/org-chart",           label: "Org Chart",     icon: "ri-organization-chart",     module: "org-chart"           },
      { path: "/performance",         label: "Performance",   icon: "ri-star-line",               module: "performance"         },
      { path: "/attendance",          label: "Attendance",    icon: "ri-fingerprint-line",        module: "attendance"          },
      { path: "/training",            label: "Training",      icon: "ri-graduation-cap-line",     module: "training"            },
      { path: "/disciplinary",        label: "Disciplinary",  icon: "ri-alert-line",              module: "disciplinary"        },
      { path: "/meeting-rooms",       label: "Meeting Rooms", icon: "ri-door-open-line",          module: "meeting-rooms"       },
      { path: "/tasks",               label: "Tasks",         icon: "ri-checkbox-multiple-line",  module: "tasks"               },
    ],
  },
  {
    label: "Operations",
    items: [
      { path: "/payroll-module",  label: "Payroll",       icon: "ri-money-dollar-circle-line", module: "payroll"          },
      { path: "/payroll-approval",label: "Pay Approval",  icon: "ri-file-check-line",          module: "payroll-approval" },
      { path: "/finance",         label: "Finance",       icon: "ri-bank-line",                module: "finance"          },
      { path: "/it-management",   label: "IT",            icon: "ri-computer-line",            module: "it-management"    },
      { path: "/benefits",        label: "Benefits",      icon: "ri-heart-pulse-line",         module: "benefits"         },
      { path: "/tools",           label: "Tools",         icon: "ri-tools-line",               module: "tools"            },
      { path: "/announcements",   label: "Announcements", icon: "ri-megaphone-line",           module: "announcements"    },
      { path: "/documents",       label: "Documents",     icon: "ri-folder-line",              module: "documents"        },
    ],
  },
  {
    label: "Insights",
    items: [
      { path: "/reports",      label: "Reports",      icon: "ri-file-chart-line",    module: "reports"      },
      { path: "/audit-log",    label: "Audit Log",    icon: "ri-shield-check-line",  module: "audit-log"    },
      { path: "/self-service", label: "Self-Service", icon: "ri-user-settings-line", module: "self-service" },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/admin?tab=users", label: "Admin Portal", icon: "ri-user-settings-line", module: "admin" },
      { path: "/notifications", label: "Notifications", icon: "ri-notification-3-line", module: "notifications" },
      { path: "/settings",      label: "Settings",      icon: "ri-settings-3-line",     module: "settings"      },
    ],
  },
];
