import type { LeaveFormData } from "./types";

export const LEAVE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string; badgeBg: string; barBg: string }
> = {
  annual: {
    label: "Annual Leave",
    icon: "ri-sun-line",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-800",
    barBg: "bg-emerald-500",
  },
  sick: {
    label: "Sick Leave",
    icon: "ri-heart-pulse-line",
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    text: "text-rose-700",
    border: "border-rose-200",
    badgeBg: "bg-rose-100 text-rose-800",
    barBg: "bg-rose-500",
  },
  maternity: {
    label: "Maternity Leave",
    icon: "ri-parent-line",
    bg: "bg-pink-50 text-pink-700 border-pink-200",
    text: "text-pink-700",
    border: "border-pink-200",
    badgeBg: "bg-pink-100 text-pink-800",
    barBg: "bg-pink-500",
  },
  paternity: {
    label: "Paternity Leave",
    icon: "ri-user-heart-line",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    text: "text-indigo-700",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-100 text-indigo-800",
    barBg: "bg-indigo-500",
  },
  unpaid: {
    label: "Unpaid Leave",
    icon: "ri-pause-circle-line",
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    text: "text-slate-700",
    border: "border-slate-200",
    badgeBg: "bg-slate-200 text-slate-800",
    barBg: "bg-slate-500",
  },
  bereavement: {
    label: "Bereavement",
    icon: "ri-empathize-line",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    text: "text-purple-700",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-800",
    barBg: "bg-purple-500",
  },
  study: {
    label: "Study Leave",
    icon: "ri-book-open-line",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
    border: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-800",
    barBg: "bg-amber-500",
  },
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const INITIAL_LEAVE_CALENDAR_FORM: LeaveFormData = {
  employee_id: "",
  leave_type: "annual",
  start_date: "",
  end_date: "",
  reason: "",
};
