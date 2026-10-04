import type { CandidateDocument, DocumentVerificationStatus } from "../types";

export interface DocumentStatusMeta {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  badgeBg: string;
}

export const DOCUMENT_STATUS_CONFIG: Record<DocumentVerificationStatus, DocumentStatusMeta> = {
  missing: {
    label: "Missing",
    icon: "ri-error-warning-line",
    color: "text-amber-700",
    bg: "bg-amber-50/70",
    border: "border-amber-200",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
  },
  uploaded: {
    label: "Uploaded",
    icon: "ri-upload-2-line",
    color: "text-blue-700",
    bg: "bg-blue-50/70",
    border: "border-blue-200",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  under_review: {
    label: "Under Review",
    icon: "ri-time-line",
    color: "text-purple-700",
    bg: "bg-purple-50/70",
    border: "border-purple-200",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
  },
  verified: {
    label: "Verified",
    icon: "ri-checkbox-circle-fill",
    color: "text-emerald-700",
    bg: "bg-emerald-50/70",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    icon: "ri-close-circle-fill",
    color: "text-rose-700",
    bg: "bg-rose-50/70",
    border: "border-rose-200",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const DEFAULT_REJECTION_REASONS = [
  "Image unclear / blurry",
  "Expired document",
  "Incorrect document type",
  "Missing inside pages / cut off",
  "Wrong candidate information / mismatch",
  "Low resolution / unreadable text",
];

export function getDocumentVerificationStatus(
  doc?: CandidateDocument
): DocumentVerificationStatus {
  if (!doc || !doc.url) return "missing";
  if (doc.verification_status) return doc.verification_status;
  return "uploaded";
}
