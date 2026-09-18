import type { ComplaintType, ComplaintStatus } from "./types";

export const COMPLAINT_TYPE_CONFIG: Record<
  ComplaintType,
  { label: string; icon: string; bg: string; text: string; border: string; hex: string }
> = {
  complaint: {
    label: "Complaint",
    icon: "ri-alarm-warning-line",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    hex: "#E11D48",
  },
  suggestion: {
    label: "Suggestion",
    icon: "ri-lightbulb-line",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    hex: "#D97706",
  },
  grievance: {
    label: "Grievance",
    icon: "ri-shield-user-line",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    hex: "#7C3AED",
  },
};

export const COMPLAINT_STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Pending Review",
    icon: "ri-time-line",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  in_review: {
    label: "Under Review",
    icon: "ri-search-eye-line",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  resolved: {
    label: "Resolved",
    icon: "ri-checkbox-circle-line",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  dismissed: {
    label: "Dismissed",
    icon: "ri-close-circle-line",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

export const COMMON_TARGET_RECIPIENTS = [
  "Human Resources Department",
  "Operations Management",
  "Direct Line Manager",
  "General Management / CEO",
  "Facilities & Administration",
  "Safety & Compliance Officer",
];

export const COMPLAINT_TYPE_ORDER: ComplaintType[] = ["complaint", "suggestion", "grievance"];
export const COMPLAINT_STATUS_ORDER: ComplaintStatus[] = ["pending", "in_review", "resolved", "dismissed"];
