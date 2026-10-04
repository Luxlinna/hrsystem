import type { OfferLetter } from "../../types";

export function getOfferSignatories(offer: OfferLetter) {
  if (offer.signatories) return offer.signatories;
  return {
    bu_ceo: {
      role_key: "bu_ceo" as const,
      title: `CEO (${offer.business_unit || "BU"})`,
      name: offer.salary_approved_by || null,
      status: offer.salary_approved_by ? ("approved" as const) : ("pending" as const),
      comment: offer.salary_approval_notes || null,
      signed_at: offer.salary_approved_at || null,
    },
    hr_manager: {
      role_key: "hr_manager" as const,
      title: "HR Manager (HR Division)",
      name: offer.hr_reviewed_by || null,
      status: offer.hr_reviewed_by ? ("approved" as const) : ("pending" as const),
      comment: offer.hr_review_notes || null,
      signed_at: offer.hr_reviewed_at || null,
    },
    hr_director: {
      role_key: "hr_director" as const,
      title: "HR Admin Director (HR Division)",
      name: null,
      status: "pending" as const,
      comment: null,
      signed_at: null,
    },
    chairwoman: {
      role_key: "chairwoman" as const,
      title: "Chairwoman (Supreme Authorization)",
      name: offer.management_approved_by || null,
      status: offer.management_approved_by ? ("approved" as const) : ("pending" as const),
      comment: offer.management_approval_notes || null,
      signed_at: offer.management_approved_at || null,
    },
  };
}
