import type { OfferLetter } from "../../types";
import { saveOfferLetter } from "./offerStorage";
import { getOfferSignatories } from "./offerSignatories";
import {
  notifyBuCeoApproved,
  notifyHrManagerApproved,
  notifyHrDirectorApproved,
  notifyChairwomanAuthorized,
} from "./offerApprovalNotifications";

export { getOfferSignatories };

/** Step 1: BU CEO Approval */
export async function approveByBuCeo(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const currentSigs = getOfferSignatories(offer);

  const updated: OfferLetter = {
    ...offer,
    status: "pending_hr_manager",
    salary_approved_by: approverName,
    salary_approved_at: now,
    salary_approval_notes: notes || null,
    signatories: {
      ...currentSigs,
      bu_ceo: {
        ...currentSigs.bu_ceo,
        name: approverName,
        status: "approved",
        comment: notes || null,
        signed_at: now,
      },
    },
    updated_at: now,
  };

  await notifyBuCeoApproved(offer, approverName);
  return await saveOfferLetter(updated);
}

/** Step 2: HR Division HR Manager Review & Approval */
export async function approveByHrManager(
  offer: OfferLetter,
  reviewerName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const currentSigs = getOfferSignatories(offer);

  const updated: OfferLetter = {
    ...offer,
    status: "pending_hr_director",
    hr_reviewed_by: reviewerName,
    hr_reviewed_at: now,
    hr_review_notes: notes || null,
    signatories: {
      ...currentSigs,
      hr_manager: {
        ...currentSigs.hr_manager,
        name: reviewerName,
        status: "approved",
        comment: notes || null,
        signed_at: now,
      },
    },
    updated_at: now,
  };

  await notifyHrManagerApproved(offer, reviewerName);
  return await saveOfferLetter(updated);
}

/** Step 3: HR Admin Director Authorization */
export async function approveByHrDirector(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const currentSigs = getOfferSignatories(offer);

  const updated: OfferLetter = {
    ...offer,
    status: "pending_chairwoman",
    signatories: {
      ...currentSigs,
      hr_director: {
        ...currentSigs.hr_director,
        name: approverName,
        status: "approved",
        comment: notes || null,
        signed_at: now,
      },
    },
    updated_at: now,
  };

  await notifyHrDirectorApproved(offer, approverName);
  return await saveOfferLetter(updated);
}

/** Step 4: Chairwoman Supreme Authorization */
export async function authorizeByChairwoman(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const currentSigs = getOfferSignatories(offer);

  const updated: OfferLetter = {
    ...offer,
    status: "approved",
    management_approved_by: approverName,
    management_approved_at: now,
    management_approval_notes: notes || null,
    signatories: {
      ...currentSigs,
      chairwoman: {
        ...currentSigs.chairwoman,
        name: approverName,
        status: "approved",
        comment: notes || null,
        signed_at: now,
      },
    },
    updated_at: now,
  };

  await notifyChairwomanAuthorized(offer, approverName);
  return await saveOfferLetter(updated);
}

// Backward compatibility methods
export async function approveSalary(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  return approveByBuCeo(offer, approverName, notes);
}

export async function generateOfferLetterDraft(
  offer: OfferLetter
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const updated: OfferLetter = {
    ...offer,
    status: offer.status === "pending_bu_ceo" || offer.status === "salary_proposal" ? "pending_bu_ceo" : offer.status,
    updated_at: now,
  };
  return await saveOfferLetter(updated);
}

export async function endorseHrReview(
  offer: OfferLetter,
  reviewerName: string,
  notes?: string
): Promise<OfferLetter> {
  return approveByHrManager(offer, reviewerName, notes);
}

export async function approveOfferManagement(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  return authorizeByChairwoman(offer, approverName, notes);
}
