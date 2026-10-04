import type { LeaveFormData } from "./types";

export const LEAVE_TYPE_CONFIG: Record<
  string,
  {
    code: string;
    label: string;
    icon: string;
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    requiresUpload: boolean;
    defaultDays?: number;
  }
> = {
  annual: {
    code: "AL",
    label: "Annual Leave (AL)",
    icon: "ri-sun-line",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-800",
    requiresUpload: false,
    defaultDays: 18,
  },
  sick: {
    code: "SL",
    label: "Sick Leave (SL)",
    icon: "ri-heart-pulse-line",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    badgeBg: "bg-rose-100 text-rose-800",
    requiresUpload: true,
    defaultDays: 30,
  },
  special: {
    code: "SP",
    label: "Special Leave (SP)",
    icon: "ri-star-line",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-800",
    requiresUpload: true,
    defaultDays: 7,
  },
  maternity: {
    code: "ML",
    label: "Maternity Leave (ML)",
    icon: "ri-parent-line",
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    badgeBg: "bg-pink-100 text-pink-800",
    requiresUpload: true,
    defaultDays: 90,
  },
  paternity: {
    code: "PL",
    label: "Paternity Leave",
    icon: "ri-user-heart-line",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-100 text-indigo-800",
    requiresUpload: true,
    defaultDays: 3,
  },
  unpaid: {
    code: "UL",
    label: "Unpaid Leave",
    icon: "ri-pause-circle-line",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    badgeBg: "bg-slate-100 text-slate-800",
    requiresUpload: false,
  },
  bereavement: {
    code: "BL",
    label: "Bereavement",
    icon: "ri-empathize-line",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-800",
    requiresUpload: true,
    defaultDays: 3,
  },
  study: {
    code: "STL",
    label: "Study Leave",
    icon: "ri-book-open-line",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    badgeBg: "bg-blue-100 text-blue-800",
    requiresUpload: false,
    defaultDays: 5,
  },
};

export interface LabourLawCategory {
  id: string;
  name: string;
  lawRef: string;
  defaultDays: number;
  description: string;
}

export const SPECIAL_LEAVE_LABOUR_LAW_CATEGORIES: LabourLawCategory[] = [
  {
    id: "sp_marriage_employee",
    name: "Marriage of Employee (3 Days)",
    lawRef: "Labour Law Art. 171",
    defaultDays: 3,
    description: "Paid special leave for employee's own wedding ceremony (up to 3 days).",
  },
  {
    id: "sp_childbirth",
    name: "Childbirth / Paternity (1-2 Days)",
    lawRef: "Labour Law Art. 171",
    defaultDays: 1,
    description: "Paid leave upon delivery of child by employee's spouse.",
  },
  {
    id: "sp_marriage_child",
    name: "Marriage of Employee's Child (1 Day)",
    lawRef: "Labour Law Art. 171",
    defaultDays: 1,
    description: "Special leave for wedding of employee's biological or adopted child.",
  },
  {
    id: "sp_death_immediate",
    name: "Death of Spouse, Child, or Parents (3 Days)",
    lawRef: "Labour Law Art. 171",
    defaultDays: 3,
    description: "Bereavement leave for loss of husband/wife, child, or father/mother.",
  },
  {
    id: "sp_death_sibling",
    name: "Death of Brother, Sister, or Grandparents (1 Day)",
    lawRef: "Labour Law Art. 171",
    defaultDays: 1,
    description: "Bereavement leave for loss of sibling or direct grandparent.",
  },
];

export const MATERNITY_LEAVE_LABOUR_LAW_CATEGORIES: LabourLawCategory[] = [
  {
    id: "ml_standard",
    name: "Standard Delivery — 90 Continuous Days",
    lawRef: "Labour Law Art. 182",
    defaultDays: 90,
    description: "Statutory 90 continuous calendar days of maternity leave with 50% wages for eligible staff.",
  },
  {
    id: "ml_cesarean",
    name: "Caesarean Section / Complication Delivery (90 Days)",
    lawRef: "Labour Law Art. 182 & 183",
    defaultDays: 90,
    description: "90 continuous calendar days with potential medical extension per physician note.",
  },
  {
    id: "ml_miscarriage",
    name: "Miscarriage / Medical Interruption per Medical Certificate",
    lawRef: "Labour Law Art. 182",
    defaultDays: 30,
    description: "Maternity protection granted upon official medical certificate from licensed healthcare provider.",
  },
];

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
  remark: "",
  category_law: "",
  attachment_url: null,
  attachment_file: null,
};
