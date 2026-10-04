import { useCallback } from "react";
import type { OfferLetter } from "../types";
import { toast } from "@/components/Toast";
import {
  executeApproveSalary,
  executeGenerateDraft,
  executeEndorseHrReview,
  executeApproveManagement,
  executeApproveBuCeo,
  executeApproveHrManager,
  executeApproveHrDirector,
  executeAuthorizeChairwoman,
  executeIssueOffer,
  executeRecordCandidateDecision,
  executeSoftDeleteOffer,
} from "../utils/offerLetterApprovalActions";
import type { WorkflowModalType } from "./useOfferLetters";

interface UseOfferLetterWorkflowParams {
  currentUserName: string;
  setOffers: React.Dispatch<React.SetStateAction<OfferLetter[]>>;
  closeWorkflowModal: () => void;
  openWorkflowModal: (offer: OfferLetter, type: WorkflowModalType) => void;
  isCurrentScopeHr: boolean;
  onCandidateStageUpdated?: () => void;
}

export function useOfferLetterWorkflow({
  currentUserName,
  setOffers,
  closeWorkflowModal,
  openWorkflowModal,
  isCurrentScopeHr,
  onCandidateStageUpdated,
}: UseOfferLetterWorkflowParams) {
  const handleApproveSalary = useCallback(async (offer: OfferLetter, notes?: string) => {
    try {
      const updated = await executeApproveSalary(offer, currentUserName, notes);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeWorkflowModal();
      toast("Salary Package Approved", `Approved proposal for ${offer.candidate_name}. Ready to generate letter draft.`, "success");
    } catch {
      toast("Error", "Failed to approve salary proposal.", "error");
    }
  }, [currentUserName, closeWorkflowModal, setOffers]);

  const handleGenerateDraft = useCallback(async (offer: OfferLetter) => {
    try {
      const updated = await executeGenerateDraft(offer);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (isCurrentScopeHr) {
        openWorkflowModal(updated, "hr_review");
        toast("Offer Letter Generated", "Compiled directly from candidate and requisition records. Opening HR Manager Review...", "success");
      } else {
        closeWorkflowModal();
        toast("Sent to HR Division", "Offer Letter draft generated and forwarded to HR Division for review. Your BU action is complete.", "success");
      }
    } catch {
      toast("Error", "Failed to generate offer letter draft.", "error");
    }
  }, [openWorkflowModal, closeWorkflowModal, isCurrentScopeHr, setOffers]);

  const handleEndorseHrReview = useCallback(async (offer: OfferLetter, notes?: string) => {
    try {
      const updated = await executeEndorseHrReview(offer, currentUserName, notes);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeWorkflowModal();
      toast("HR Review Endorsed", "Offer letter endorsed and forwarded for final management approval.", "success");
    } catch {
      toast("Error", "Failed to endorse HR review.", "error");
    }
  }, [currentUserName, closeWorkflowModal, setOffers]);

  const handleApproveManagement = useCallback(async (offer: OfferLetter, notes?: string) => {
    try {
      const updated = await executeApproveManagement(offer, currentUserName, notes);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeWorkflowModal();
      toast("Offer Fully Approved", "Management sign-off completed. Offer is authorized to be issued.", "success");
    } catch {
      toast("Error", "Failed to approve offer letter.", "error");
    }
  }, [currentUserName, closeWorkflowModal, setOffers]);

  const handleApproveBuCeo = useCallback(async (offer: OfferLetter, notes?: string) => {
    try {
      const updated = await executeApproveBuCeo(offer, currentUserName, notes);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeWorkflowModal();
      toast("Approved by BU CEO", `Proposal for ${offer.candidate_name} approved by BU CEO and forwarded to HR Division.`, "success");
    } catch {
      toast("Error", "Failed to approve salary proposal as BU CEO.", "error");
    }
  }, [currentUserName, closeWorkflowModal, setOffers]);

  const handleApproveHrManager = useCallback(async (offer: OfferLetter, notes?: string) => {
    try {
      const updated = await executeApproveHrManager(offer, currentUserName, notes);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeWorkflowModal();
      toast("HR Manager Approved", "Offer review endorsed. Forwarded to HR Admin Director for authorization.", "success");
    } catch {
      toast("Error", "Failed to complete HR Manager review.", "error");
    }
  }, [currentUserName, closeWorkflowModal, setOffers]);

  const handleApproveHrDirector = useCallback(async (offer: OfferLetter, notes?: string) => {
    try {
      const updated = await executeApproveHrDirector(offer, currentUserName, notes);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeWorkflowModal();
      toast("HR Admin Director Authorized", "Offer authorized. Forwarded to Chairwoman for supreme sign-off.", "success");
    } catch {
      toast("Error", "Failed to authorize offer as HR Admin Director.", "error");
    }
  }, [currentUserName, closeWorkflowModal, setOffers]);

  const handleAuthorizeChairwoman = useCallback(async (offer: OfferLetter, notes?: string) => {
    try {
      const updated = await executeAuthorizeChairwoman(offer, currentUserName, notes);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeWorkflowModal();
      toast("Offer Fully Authorized", "Chairwoman supreme sign-off granted. Offer is authorized to be issued.", "success");
    } catch {
      toast("Error", "Failed to authorize offer as Chairwoman.", "error");
    }
  }, [currentUserName, closeWorkflowModal, setOffers]);

  const handleIssueOffer = useCallback(async (offer: OfferLetter, expiryDate?: string) => {
    try {
      const updated = await executeIssueOffer(offer, currentUserName, expiryDate);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeWorkflowModal();
      if (onCandidateStageUpdated) onCandidateStageUpdated();
      toast("Offer Officially Issued", `Offer has been issued to ${offer.candidate_name}. Candidate pipeline stage updated to Offer.`, "success");
    } catch {
      toast("Error", "Failed to issue offer letter.", "error");
    }
  }, [currentUserName, closeWorkflowModal, onCandidateStageUpdated, setOffers]);

  const handleRecordDecision = useCallback(async (
    offer: OfferLetter,
    decision: "accepted" | "rejected",
    notes?: string,
    rejectionReason?: string,
    signedDoc?: { name: string; url: string; size?: number; type?: string }
  ) => {
    try {
      const updated = await executeRecordCandidateDecision(offer, decision, notes, rejectionReason, signedDoc);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeWorkflowModal();
      if (onCandidateStageUpdated) onCandidateStageUpdated();
      toast(
        decision === "accepted" ? "Offer Accepted!" : "Offer Declined",
        decision === "accepted"
          ? `${offer.candidate_name} accepted the offer! Stage updated to Accepted.`
          : `Offer marked as rejected with reason: ${rejectionReason || "None"}.`,
        decision === "accepted" ? "success" : "info"
      );
    } catch {
      toast("Error", "Failed to record candidate decision.", "error");
    }
  }, [closeWorkflowModal, onCandidateStageUpdated, setOffers]);

  const handleDeleteOffer = useCallback(async (offer: OfferLetter) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete offer ${offer.offer_number} for ${offer.candidate_name}? It will be moved to the Recycle Bin and can be restored anytime.`
    );
    if (!confirmed) return;
    try {
      await executeSoftDeleteOffer(offer.id, currentUserName);
      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
      toast("Moved to Recycle Bin", `Offer ${offer.offer_number} has been moved to the Recycle Bin.`, "info");
    } catch {
      toast("Error", "Failed to delete offer letter.", "error");
    }
  }, [currentUserName, setOffers]);

  return {
    handleApproveSalary,
    handleGenerateDraft,
    handleEndorseHrReview,
    handleApproveManagement,
    handleApproveBuCeo,
    handleApproveHrManager,
    handleApproveHrDirector,
    handleAuthorizeChairwoman,
    handleIssueOffer,
    handleRecordDecision,
    handleDeleteOffer,
  };
}
