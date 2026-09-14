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

export interface CanonicalBadgeInfo {
  label: string;
  emoji: string;
  color: string;
}

export function getCanonicalEventBadge(title: string, message: string): CanonicalBadgeInfo | null {
  const combined = `${title} ${message}`.toLowerCase();
  if (combined.includes("sla exceeded") || combined.includes("turnaround sla")) {
    return { label: "SLA exceeded", emoji: "🚨", color: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (combined.includes("feedback overdue") || combined.includes("scorecard")) {
    return { label: "Interview feedback overdue", emoji: "⏳", color: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (combined.includes("contract approved") || combined.includes("contract endorsed") || combined.includes("contract fully authorized")) {
    return { label: "Contract approved", emoji: "👑", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (combined.includes("contract ready") || combined.includes("contract draft")) {
    return { label: "Contract ready", emoji: "📜", color: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (combined.includes("documents missing") || combined.includes("missing document")) {
    return { label: "Document missing", emoji: "📁", color: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (combined.includes("offer accepted")) {
    return { label: "Offer accepted", emoji: "🎉", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (combined.includes("offer approved") || combined.includes("offer letter fully authorized") || combined.includes("offer letter step")) {
    return { label: "Offer approved", emoji: "✅", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (combined.includes("salary approval required") || combined.includes("salary proposal")) {
    return { label: "Salary approval required", emoji: "💰", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  }
  if (combined.includes("candidate selected") || combined.includes("caf fully authorized")) {
    return { label: "Candidate selected", emoji: "🎯", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (combined.includes("interview scheduled") || combined.includes("interview booked")) {
    return { label: "Interview scheduled", emoji: "📅", color: "bg-cyan-50 text-cyan-700 border-cyan-200" };
  }
  if (combined.includes("cv review required") || combined.includes("screen candidate")) {
    return { label: "CV review required", emoji: "📄", color: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (combined.includes("candidate shortlisted")) {
    return { label: "Candidate shortlisted", emoji: "🌟", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (combined.includes("declined") || combined.includes("rejected")) {
    return { label: "Rejected", emoji: "❌", color: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (combined.includes("revision requested") || combined.includes("sent back for revision")) {
    return { label: "Revision requested", emoji: "📝", color: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (combined.includes("approval pending") || combined.includes("step 1 signed") || combined.includes("step 2 reviewed") || combined.includes("step 3 approved") || combined.includes("stage transition")) {
    return { label: "Approval pending", emoji: "⏳", color: "bg-purple-50 text-purple-700 border-purple-200" };
  }
  if (combined.includes("requisition submitted") || combined.includes("new requisition")) {
    return { label: "Requisition submitted", emoji: "📋", color: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  return null;
}
