import type { ExitType, ReasonType } from "./types";

export const EXIT_TYPE_CONFIG: Record<
  ExitType,
  { label: string; icon: string; bg: string; text: string; border: string; hex: string }
> = {
  resignation: {
    label: "Resignation",
    icon: "ri-logout-box-r-line",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    hex: "#D97706",
  },
  termination: {
    label: "Termination",
    icon: "ri-user-unfollow-line",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    hex: "#DC2626",
  },
  retirement: {
    label: "Retirement",
    icon: "ri-medal-line",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    hex: "#059669",
  },
  contract_end: {
    label: "Contract End",
    icon: "ri-file-text-line",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    hex: "#0284C7",
  },
  abandonment: {
    label: "Abandonment",
    icon: "ri-door-open-line",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    hex: "#EA580C",
  },
  mutual_agreement: {
    label: "Mutual Agreement",
    icon: "ri-handshake-line",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    hex: "#7C3AED",
  },
  death: {
    label: "Deceased",
    icon: "ri-hearts-line",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    hex: "#6B7280",
  },
};

export const REASON_TYPE_CONFIG: Record<ReasonType, { label: string }> = {
  personal:           { label: "Personal Reasons" },
  better_opportunity: { label: "Better Opportunity" },
  health:             { label: "Health / Medical" },
  performance:        { label: "Performance Issue" },
  misconduct:         { label: "Misconduct" },
  restructuring:      { label: "Restructuring / Layoff" },
  relocation:         { label: "Relocation" },
  retirement:         { label: "Retirement" },
  contract_end:       { label: "Contract Expiration" },
  other:              { label: "Other" },
};

export const EXIT_TYPE_ORDER: ExitType[] = [
  "resignation", "termination", "retirement", "contract_end",
  "abandonment", "mutual_agreement", "death",
];

export const REASON_TYPE_ORDER: ReasonType[] = [
  "personal", "better_opportunity", "health", "performance",
  "misconduct", "restructuring", "relocation", "retirement",
  "contract_end", "other",
];

export const CONTRACT_TYPE_OPTIONS = [
  "Fixed Duration Contract (FDC)",
  "Undetermined Duration Contract (UDC)",
  "Probationary Contract",
  "Part-Time Contract",
  "Internship / Trainee Agreement",
  "Service / Consultant Agreement",
  "Other / Custom",
];

