import type { QuickActionItem, AdminActionItem } from "./types";

export const pieColors = ["#253C7D", "#29ABE2", "#74C8EC", "#A8D8D8", "#D4ECEB"];

export const QUICK_ACTIONS: QuickActionItem[] = [
  {
    label: "Log Attendance",
    icon: "ri-fingerprint-line",
    path: "/self-service?tab=checkin",
    module: "self-service",
    color: "bg-emerald-500",
    note: "Check in / out",
  },
  {
    label: "Submit Leave",
    icon: "ri-calendar-event-line",
    path: "/self-service?tab=leave",
    module: "self-service",
    color: "bg-amber-500",
    note: "Request time off",
  },
  {
    label: "New Employee",
    icon: "ri-user-add-line",
    path: "/employees",
    module: "employees",
    color: "bg-violet-500",
    note: "Add to directory",
  },
  {
    label: "Notifications",
    icon: "ri-notification-3-line",
    path: "/notifications",
    module: "notifications",
    color: "bg-rose-500",
    note: "Check alerts",
  },
];

export const ADMIN_ACTIONS: AdminActionItem[] = [
  { label: "Hire", icon: "ri-briefcase-line", path: "/hire", module: "hire" },
  { label: "Off Board", icon: "ri-user-unfollow-line", path: "/offboard", module: "offboard" },
  { label: "Org Chart", icon: "ri-organization-chart", path: "/org-chart", module: "org-chart" },
  { label: "Tools", icon: "ri-tools-line", path: "/tools", module: "tools" },
  { label: "Benefits", icon: "ri-heart-pulse-line", path: "/benefits", module: "benefits" },
  { label: "IT Mgmt", icon: "ri-computer-line", path: "/it-management", module: "it-management" },
  { label: "Finance", icon: "ri-bank-line", path: "/finance", module: "finance" },
  { label: "Settings", icon: "ri-settings-3-line", path: "/settings", module: "settings" },
  { label: "Unity Apps", icon: "ri-apps-line", path: "/unity-apps", module: "unity-apps" },
];
