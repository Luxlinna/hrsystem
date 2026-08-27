import type { ExpenseStatus, ExpenseFormState } from "./types";

export const STATUS_CONFIG: Record<
  ExpenseStatus,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  pending: {
    label: "Pending Review",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
  },
  approved: {
    label: "Approved",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    icon: "ri-checkbox-circle-line",
  },
  paid: {
    label: "Paid / Disbursed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-check-double-line",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-close-circle-line",
  },
};

export const CATEGORIES = [
  "All Categories",
  "Office Rent",
  "IT Equipment",
  "Travel",
  "Training",
  "Marketing",
  "Utilities",
  "Software",
  "Catering",
  "Office Supplies",
  "Legal",
  "Other",
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Office Rent": "#253C7D",
  "IT Equipment": "#33518F",
  Travel: "#4266A1",
  Training: "#527CB3",
  Marketing: "#6592C4",
  Utilities: "#7FA6D0",
  Software: "#9BBADC",
  Catering: "#B7CDE7",
  "Office Supplies": "#64748B",
  Legal: "#94A3B8",
  Other: "#CBD5E1",
};

export const INITIAL_EXPENSE_FORM: ExpenseFormState = {
  category: "Office Supplies",
  branch_id: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
  submitted_by: "",
};
