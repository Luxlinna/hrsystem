import type { AssetFormState, TicketFormState } from "./types";

export const ASSET_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  Laptop: { label: "Laptop", icon: "ri-macbook-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Display: { label: "Monitor / Display", icon: "ri-tv-2-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Mobile: { label: "Mobile Device", icon: "ri-smartphone-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Phone: { label: "VoIP / Desk Phone", icon: "ri-phone-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Peripheral: { label: "Peripheral & Accessory", icon: "ri-keyboard-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Server: { label: "Server Infrastructure", icon: "ri-server-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Network: { label: "Network & Router", icon: "ri-wifi-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Power: { label: "Power & UPS", icon: "ri-flashlight-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Furniture: { label: "Office Equipment", icon: "ri-armchair-line", color: "text-slate-600", bg: "bg-slate-100" },
  Other: { label: "Other Asset", icon: "ri-box-3-line", color: "text-slate-600", bg: "bg-slate-100" },
};

export const ASSET_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  active: {
    label: "Active / Deployed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  inventory: {
    label: "In Stock / Ready",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
  },
  maintenance: {
    label: "Under Repair",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  retired: {
    label: "Retired / Decommissioned",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

export const TICKET_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  open: {
    label: "Open Request",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    icon: "ri-loader-2-line",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-fill",
  },
  closed: {
    label: "Closed",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: "ri-archive-line",
  },
};

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  low: {
    label: "Low",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "ri-arrow-down-line",
  },
  medium: {
    label: "Medium",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    icon: "ri-equal-line",
  },
  high: {
    label: "High Priority",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-arrow-up-line",
  },
  critical: {
    label: "Critical / Urgent",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-alarm-warning-line",
  },
};

export const TICKET_CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Access",
  "Account",
  "Security",
  "Email",
  "Other",
];

export const INITIAL_ASSET_FORM: AssetFormState = {
  name: "",
  asset_tag: "",
  type: "Laptop",
  serial_number: "",
  branch_id: "",
  employee_id: "",
  status: "active",
};

export const INITIAL_TICKET_FORM: TicketFormState = {
  title: "",
  requester_name: "",
  priority: "medium",
  category: "Hardware",
  description: "",
};
