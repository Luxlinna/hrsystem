import type { CandidateDocument } from "../types";

export interface DocumentSlotConfig {
  key: string;
  title: string;
  subtitle: string;
  required: boolean;
  accept: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

export const REQUIRED_DOCUMENT_SLOTS: DocumentSlotConfig[] = [
  {
    key: "national_id_front",
    title: "National ID — Front",
    subtitle: "Clear color scan or photo of ID card front",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg,.webp",
    icon: "ri-id-card-line",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    key: "national_id_back",
    title: "National ID — Back",
    subtitle: "Clear color scan or photo of ID card reverse side",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg,.webp",
    icon: "ri-id-card-line",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    key: "social_security_card",
    title: "Social Security Card",
    subtitle: "NSSF member card or registration (if available)",
    required: false,
    accept: ".pdf,.png,.jpg,.jpeg,.webp",
    icon: "ri-shield-user-line",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    key: "birth_certificate",
    title: "Birth Certificate",
    subtitle: "Official certified birth certificate copy",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg,.webp",
    icon: "ri-file-paper-2-line",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  {
    key: "family_book_cover",
    title: "Family Book — Cover",
    subtitle: "Front cover page of household / family book",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg,.webp",
    icon: "ri-book-2-line",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    key: "family_book_pages",
    title: "Family Book — Inside Pages",
    subtitle: "Member census pages containing candidate entry",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg,.webp,.zip",
    icon: "ri-book-open-line",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    key: "bank_account_proof",
    title: "Bank Account Proof",
    subtitle: "Bank passbook page or mobile statement with account #",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg,.webp",
    icon: "ri-bank-card-line",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    key: "photo_4x6",
    title: "4×6 Photo",
    subtitle: "Formal passport-style color photo (white background)",
    required: true,
    accept: ".png,.jpg,.jpeg,.webp",
    icon: "ri-user-smile-line",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    key: "academic_certificates",
    title: "Academic Certificate(s)",
    subtitle: "Degree, diploma, or highest qualification certificates",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg,.webp,.zip",
    icon: "ri-graduation-cap-line",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
];

export function findSlotDocument(
  slotKey: string,
  documents: CandidateDocument[] = []
): CandidateDocument | undefined {
  return documents.find((doc: any) => {
    if (doc.doc_slot_key === slotKey) return true;
    const name = (doc.name || "").toLowerCase();
    switch (slotKey) {
      case "national_id_front":
        return (name.includes("national id") || name.includes("id card") || name.includes("nid")) && name.includes("front");
      case "national_id_back":
        return (name.includes("national id") || name.includes("id card") || name.includes("nid")) && name.includes("back");
      case "social_security_card":
        return name.includes("social security") || name.includes("nssf");
      case "birth_certificate":
        return name.includes("birth certificate") || name.includes("birth cert");
      case "family_book_cover":
        return (name.includes("family book") || name.includes("household")) && name.includes("cover");
      case "family_book_pages":
        return (name.includes("family book") || name.includes("household")) && (name.includes("page") || name.includes("inside"));
      case "bank_account_proof":
        return name.includes("bank") || name.includes("account proof") || name.includes("passbook");
      case "photo_4x6":
        return name.includes("4x6") || name.includes("photo") || name.includes("portrait");
      case "academic_certificates":
        return name.includes("degree") || name.includes("diploma") || name.includes("certificate") || name.includes("academic");
      default:
        return false;
    }
  });
}

export function getPortalCompletionStats(documents: CandidateDocument[] = []) {
  const totalRequired = REQUIRED_DOCUMENT_SLOTS.filter((s) => s.required).length;
  let verifiedRequired = 0;
  let totalUploaded = 0;
  let totalRejected = 0;

  REQUIRED_DOCUMENT_SLOTS.forEach((slot) => {
    const doc = findSlotDocument(slot.key, documents);
    if (doc) {
      totalUploaded++;
      if (doc.verification_status === "rejected") {
        totalRejected++;
      } else if (slot.required && (doc.verification_status === "verified" || !doc.verification_status)) {
        verifiedRequired++;
      }
    }
  });

  const percentage = Math.round((verifiedRequired / totalRequired) * 100);
  const isAllComplete = verifiedRequired === totalRequired;

  return {
    totalRequired,
    verifiedRequired,
    totalUploaded,
    totalRejected,
    totalSlots: REQUIRED_DOCUMENT_SLOTS.length,
    percentage,
    isAllComplete,
  };
}
