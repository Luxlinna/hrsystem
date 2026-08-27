import type { DisciplinaryRecord, NewRecord } from "./types";

export const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string; desc: string }
> = {
  verbal_warning: {
    label: "Verbal Warning",
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-100 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600",
    icon: "ri-discuss-line",
    desc: "First-level policy review",
  },
  written_warning: {
    label: "Written Warning",
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-100 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600",
    icon: "ri-file-warning-line",
    desc: "Formal documented notice",
  },
  final_warning: {
    label: "Final Warning",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30",
    icon: "ri-error-warning-line",
    desc: "Last notice before escalation",
  },
  pip: {
    label: "Performance Plan (PIP)",
    color: "text-[#253C7D] dark:text-sky-400",
    bg: "bg-[#253C7D]/10 border-[#253C7D]/20 dark:bg-sky-400/15 dark:border-sky-400/30",
    icon: "ri-focus-3-line",
    desc: "Structured performance goals",
  },
  incident: {
    label: "Workplace Incident",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30",
    icon: "ri-alert-line",
    desc: "Safety or policy violation",
  },
  suspension: {
    label: "Suspension",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30",
    icon: "ri-pause-circle-line",
    desc: "Temporary work removal",
  },
  termination: {
    label: "Termination",
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-200/70 border-slate-300 dark:bg-slate-700/70 dark:border-slate-600",
    icon: "ri-user-unfollow-line",
    desc: "Employment separation",
  },
};

export const SEVERITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  low: {
    label: "Low",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600",
    dot: "bg-slate-400",
  },
  medium: {
    label: "Medium",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  high: {
    label: "High",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
  critical: {
    label: "Critical",
    color: "text-rose-800 dark:text-rose-300",
    bg: "bg-rose-100 border-rose-300 dark:bg-rose-500/25 dark:border-rose-500/40 font-black",
    dot: "bg-rose-600 animate-pulse",
  },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: {
    label: "Open Case",
    color: "text-[#253C7D] dark:text-sky-400",
    bg: "bg-[#253C7D]/10 border-[#253C7D]/20 dark:bg-sky-400/15 dark:border-sky-400/30",
  },
  in_progress: {
    label: "In Progress",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30",
  },
  escalated: {
    label: "Escalated",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30",
  },
  resolved: {
    label: "Resolved",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30",
  },
  closed: {
    label: "Closed",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600",
  },
};

export const isOverdueRecord = (r: Pick<DisciplinaryRecord, "follow_up_date" | "status">) =>
  !!r.follow_up_date &&
  r.status !== "resolved" &&
  r.status !== "closed" &&
  new Date(r.follow_up_date + "T00:00:00") < new Date();

export const INITIAL_NEW_RECORD: NewRecord = {
  employee_id: "",
  type: "verbal_warning",
  title: "",
  description: "",
  severity: "medium",
  status: "open",
  incident_date: new Date().toISOString().split("T")[0],
  follow_up_date: "",
  witnesses: "",
  action_taken: "",
  pip_start_date: "",
  pip_end_date: "",
  pip_goals: "",
};
