export const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "ri-draft-line",
  },
  pending_approval: {
    label: "Pending Approval",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-fill",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-close-circle-fill",
  },
  processed: {
    label: "Processed & Paid",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    icon: "ri-bank-card-line",
  },
};

export const DEPARTMENTS = [
  "All Departments",
  "Engineering",
  "Sales",
  "Operations",
  "Marketing",
  "Finance",
  "HR",
  "IT",
  "Legal",
  "Executive",
];
