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
    desc: "1st level informal verbal warning",
  },
  first_written_warning: {
    label: "1st Written Warning",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30",
    icon: "ri-file-warning-line",
    desc: "Formal 1st written warning letter",
  },
  written_warning: {
    label: "Written Warning",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30",
    icon: "ri-file-warning-line",
    desc: "Formal documented notice",
  },
  second_written_warning: {
    label: "2nd Written Warning",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 border-orange-200 dark:bg-orange-500/15 dark:border-orange-500/30",
    icon: "ri-file-damage-line",
    desc: "Repeated violation or escalated notice",
  },
  final_warning: {
    label: "Final Warning",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30",
    icon: "ri-error-warning-line",
    desc: "Final notice prior to termination",
  },
  show_cause: {
    label: "Show Cause Letter",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 border-purple-200 dark:bg-purple-500/15 dark:border-purple-500/30",
    icon: "ri-question-line",
    desc: "Notice to explain serious infraction",
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

export const WARNING_TYPES = [
  { value: "verbal_warning", label: "Verbal Warning", description: "First-level oral advisory / hearing" },
  { value: "first_written_warning", label: "1st Written Warning", description: "Official documented initial warning" },
  { value: "second_written_warning", label: "2nd Written Warning", description: "Second notice for recurring misconduct" },
  { value: "final_warning", label: "Final Warning", description: "Final warning letter before termination" },
  { value: "show_cause", label: "Show Cause Letter", description: "Formal request for employee explanation" },
  { value: "pip", label: "PIP Notice", description: "Performance Improvement Plan (PIP)" },
];


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
  warning_type: "first_written_warning",
  warning_date: new Date().toISOString().split("T")[0],
  action_to_take: "",
  employee_promise: "",
  remark: "",
  document_url: "",
  document_name: "",
  document_file: null,
};

