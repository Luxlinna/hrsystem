import type { OfferLetter } from "../types";
import {
  approveSalary,
  generateOfferLetterDraft,
  endorseHrReview,
  approveOfferManagement,
  approveByBuCeo,
  approveByHrManager,
  approveByHrDirector,
  authorizeByChairwoman,
  issueOffer,
  recordCandidateDecision,
  softDeleteOfferLetter,
} from "../services/offerLetterService";
import { executeExportOfferPdf } from "./offerLetterExportHelper";

export async function executeApproveSalary(offer: OfferLetter, currentUserName: string, notes?: string) {
  return await approveSalary(offer, currentUserName, notes);
}

export async function executeGenerateDraft(offer: OfferLetter) {
  return await generateOfferLetterDraft(offer);
}

export async function executeEndorseHrReview(offer: OfferLetter, currentUserName: string, notes?: string) {
  return await endorseHrReview(offer, currentUserName, notes);
}

export async function executeApproveManagement(offer: OfferLetter, currentUserName: string, notes?: string) {
  return await approveOfferManagement(offer, currentUserName, notes);
}

export async function executeApproveBuCeo(offer: OfferLetter, currentUserName: string, notes?: string) {
  return await approveByBuCeo(offer, currentUserName, notes);
}

export async function executeApproveHrManager(offer: OfferLetter, currentUserName: string, notes?: string) {
  return await approveByHrManager(offer, currentUserName, notes);
}

export async function executeApproveHrDirector(offer: OfferLetter, currentUserName: string, notes?: string) {
  return await approveByHrDirector(offer, currentUserName, notes);
}

export async function executeAuthorizeChairwoman(offer: OfferLetter, currentUserName: string, notes?: string) {
  return await authorizeByChairwoman(offer, currentUserName, notes);
}

export async function executeIssueOffer(
  offer: OfferLetter,
  currentUserName: string,
  expiryDate?: string
) {
  const updated = await issueOffer(offer, currentUserName, expiryDate);
  executeExportOfferPdf(updated);
  return updated;
}

export async function executeRecordCandidateDecision(
  offer: OfferLetter,
  decision: "accepted" | "rejected",
  notes?: string,
  rejectionReason?: string,
  signedDoc?: { name: string; url: string; size?: number; type?: string }
) {
  return await recordCandidateDecision(offer, decision, notes, rejectionReason, signedDoc);
}

export async function executeSoftDeleteOffer(offerId: string, currentUserName: string) {
  await softDeleteOfferLetter(offerId, currentUserName);
}
