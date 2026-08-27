import type { NotificationType, TypeConfigItem } from "./types";

export const TYPE_CONFIG: Record<NotificationType, TypeConfigItem> = {
  success: {
    icon: "ri-checkbox-circle-line",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    accent: "bg-emerald-500",
  },
  warning: {
    icon: "ri-error-warning-line",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    accent: "bg-amber-500",
  },
  error: {
    icon: "ri-close-circle-line",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    accent: "bg-rose-500",
  },
  info: {
    icon: "ri-information-line",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    accent: "bg-[#253C7D]",
  },
};

export const SOURCE_LABELS: Record<string, string> = {
  hire: "Recruitment",
  leave: "Leave",
  payroll: "Payroll",
  branches: "Branches",
  system: "System",
  employees: "Employees",
  onboarding: "Onboarding",
  offboard: "Offboarding",
  finance: "Finance",
  it_management: "IT",
  benefits: "Benefits",
  training: "Training",
  tools: "Tools",
  announcements: "Announcements",
  meeting_rooms: "Meeting Rooms",
  password_reset: "Password Reset",
  tasks: "Tasks",
};

export const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "info", label: "Info" },
  { key: "success", label: "Success" },
  { key: "warning", label: "Warnings" },
  { key: "error", label: "Errors" },
];
