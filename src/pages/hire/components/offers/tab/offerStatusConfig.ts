import type { OfferStatus } from "../../../types";

export interface StatusConfigItem {
  label: string;
  step: number;
  color: string;
  bg: string;
  border: string;
  icon: string;
}

export const STATUS_CONFIG: Record<OfferStatus, StatusConfigItem> = {
  salary_proposal: {
    label: "Salary Proposal Submitted",
    step: 1,
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "ri-time-line",
  },
  pending_bu_ceo: {
    label: "Pending BU CEO Approval",
    step: 2,
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "ri-user-star-line",
  },
  pending_hr_manager: {
    label: "Pending HR Manager Review",
    step: 3,
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "ri-shield-check-line",
  },
  pending_hr_director: {
    label: "Pending HR Admin Director",
    step: 4,
    color: "text-slate-800",
    bg: "bg-slate-100",
    border: "border-slate-300",
    icon: "ri-shield-user-line",
  },
  pending_chairwoman: {
    label: "Pending Chairwoman Approval",
    step: 5,
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "ri-vip-crown-line",
  },
  salary_approved: {
    label: "Salary Proposal Ready",
    step: 1,
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "ri-check-line",
  },
  draft_letter: {
    label: "Offer Letter Generated",
    step: 2,
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "ri-file-text-line",
  },
  hr_review: {
    label: "Pending HR Review",
    step: 3,
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "ri-shield-user-line",
  },
  management_approval: {
    label: "Pending Management Approval",
    step: 4,
    color: "text-purple-800",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "ri-award-line",
  },
  approved: {
    label: "Approved & Ready to Issue",
    step: 5,
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-line",
  },
  issued: {
    label: "Offer Issued to Candidate",
    step: 5,
    color: "text-sky-800",
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: "ri-mail-send-line",
  },
  accepted: {
    label: "Accepted by Candidate",
    step: 6,
    color: "text-teal-800",
    bg: "bg-teal-50",
    border: "border-teal-200",
    icon: "ri-thumb-up-line",
  },
  rejected: {
    label: "Offer Declined",
    step: 6,
    color: "text-rose-800",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: "ri-close-circle-line",
  },
};
