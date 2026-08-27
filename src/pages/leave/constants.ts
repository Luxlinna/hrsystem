import type { LeaveFormData } from "./types";

export const LEAVE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string; badgeBg: string }
> = {
  annual: {
    label: "Annual Leave",
    icon: "ri-sun-line",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-800",
  },
  sick: {
    label: "Sick Leave",
    icon: "ri-heart-pulse-line",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    badgeBg: "bg-rose-100 text-rose-800",
  },
  maternity: {
    label: "Maternity Leave",
    icon: "ri-parent-line",
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    badgeBg: "bg-pink-100 text-pink-800",
  },
  paternity: {
    label: "Paternity Leave",
    icon: "ri-user-heart-line",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-100 text-indigo-800",
  },
  unpaid: {
    label: "Unpaid Leave",
    icon: "ri-pause-circle-line",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    badgeBg: "bg-slate-100 text-slate-800",
  },
  bereavement: {
    label: "Bereavement",
    icon: "ri-empathize-line",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-800",
  },
  study: {
    label: "Study Leave",
    icon: "ri-book-open-line",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-800",
  },
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: "Pending Review",
    icon: "ri-time-line",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    icon: "ri-checkbox-circle-line",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: "ri-close-circle-line",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: "ri-indeterminate-circle-line",
    bg: "bg-gray-100 text-gray-600 border-gray-200",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

export const INITIAL_LEAVE_FORM: LeaveFormData = {
  employee_id: "",
  leave_type: "annual",
  start_date: "",
  end_date: "",
  reason: "",
};
