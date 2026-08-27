import type { Task, TaskActivity, FormState } from "./types";

export const STATUS_CONFIG: Record<
  Task["status"],
  { label: string; icon: string; headerBg: string; border: string; badge: string; accent: string }
> = {
  todo: {
    label: "To Do",
    icon: "ri-checkbox-blank-circle-line",
    headerBg: "bg-slate-50",
    border: "border-slate-200/80",
    badge: "bg-slate-100 text-slate-700",
    accent: "#64748B",
  },
  in_progress: {
    label: "In Progress",
    icon: "ri-progress-4-line",
    headerBg: "bg-sky-50/50",
    border: "border-sky-200/80",
    badge: "bg-sky-50 text-sky-700 border border-sky-200/60",
    accent: "#0284C7",
  },
  blocked: {
    label: "Blocked",
    icon: "ri-error-warning-line",
    headerBg: "bg-rose-50/50",
    border: "border-rose-200/80",
    badge: "bg-rose-50 text-rose-700 border border-rose-200/60",
    accent: "#E11D48",
  },
  done: {
    label: "Completed",
    icon: "ri-checkbox-circle-fill",
    headerBg: "bg-emerald-50/50",
    border: "border-emerald-200/80",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    accent: "#059669",
  },
};

export const STATUS_COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Completed" },
];

export const PRIORITY_META: Record<
  Task["priority"],
  { label: string; bg: string; text: string; border: string; icon: string; weight: number }
> = {
  low: { label: "Low", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: "ri-arrow-down-line", weight: 1 },
  medium: { label: "Medium", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200/70", icon: "ri-equal-line", weight: 2 },
  high: { label: "High", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/80", icon: "ri-arrow-up-line", weight: 3 },
  urgent: { label: "Urgent", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300", icon: "ri-fire-line", weight: 4 },
};

export const ACTIVITY_ICON: Record<TaskActivity["action"], string> = {
  created: "ri-add-circle-line",
  status_changed: "ri-arrow-left-right-line",
  assigned: "ri-user-shared-line",
  updated: "ri-edit-line",
};

export const ACTIVITY_COLOR: Record<TaskActivity["action"], string> = {
  created: "text-emerald-500",
  status_changed: "text-sky-500",
  assigned: "text-violet-500",
  updated: "text-gray-400",
};

export const WORKABLE_STATUSES = ["active", "on_leave", "onboarding"];

export const emptyForm: FormState = {
  title: "",
  description: "",
  assigned_to: "",
  status: "todo",
  priority: "medium",
  due_date: "",
  is_outside_work: false,
};
