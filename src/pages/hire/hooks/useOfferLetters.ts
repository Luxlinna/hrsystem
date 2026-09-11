import { useState, useEffect, useCallback, useMemo } from "react";
import type { OfferLetter, Candidate, HiringRequest } from "../types";
import {
  fetchOfferLetters,
  createSalaryProposal,
  approveSalary,
  generateOfferLetterDraft,
  endorseHrReview,
  approveOfferManagement,
  issueOffer,
  recordCandidateDecision,
  type CreateProposalPayload,
} from "../services/offerLetterService";
import { exportOfferLetterPdf } from "../exports/exportOfferLetterPdf";
import { useToast } from "@/hooks/useToast";

export type WorkflowModalType =
  | "salary_approval"
  | "hr_review"
  | "management_approval"
  | "issue_offer"
  | "decision"
  | "preview"
  | null;

export function useOfferLetters(currentUserName = "HR Operations", onCandidateStageUpdated?: () => void) {
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [activeOffer, setActiveOffer] = useState<OfferLetter | null>(null);
  const [modalType, setModalType] = useState<WorkflowModalType>(null);

  const [isCreateProposalOpen, setIsCreateProposalOpen] = useState(false);
  const [targetCandidate, setTargetCandidate] = useState<Candidate | null>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOfferLetters();
      setOffers(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const openWorkflowModal = useCallback((offer: OfferLetter, type: WorkflowModalType) => {
    setActiveOffer(offer);
    setModalType(type);
  }, []);

  const closeWorkflowModal = useCallback(() => {
    setActiveOffer(null);
    setModalType(null);
  }, []);

  const openCreateProposal = useCallback((candidate?: Candidate | null) => {
    setTargetCandidate(candidate || null);
    setIsCreateProposalOpen(true);
  }, []);

  const closeCreateProposal = useCallback(() => {
    setTargetCandidate(null);
    setIsCreateProposalOpen(false);
  }, []);

  const handleCreateProposal = useCallback(
    async (payload: Omit<CreateProposalPayload, "proposed_by_name">) => {
      try {
        const created = await createSalaryProposal({
          ...payload,
          proposed_by_name: currentUserName,
        });
        setOffers((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
        closeCreateProposal();
        toast("Salary Proposal Created", `Proposal for ${created.candidate_name} submitted successfully.`, "success");
        return created;
      } catch (err) {
        toast("Error", "Could not create salary proposal.", "error");
        throw err;
      }
    },
    [currentUserName, closeCreateProposal, toast]
  );

  const handleApproveSalary = useCallback(
    async (offer: OfferLetter, notes?: string) => {
      try {
        const updated = await approveSalary(offer, currentUserName, notes);
        setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        closeWorkflowModal();
        toast("Salary Package Approved", `Approved proposal for ${offer.candidate_name}. Ready to generate letter draft.`, "success");
      } catch {
        toast("Error", "Failed to approve salary proposal.", "error");
      }
    },
    [currentUserName, closeWorkflowModal, toast]
  );

  const handleGenerateDraft = useCallback(
    async (offer: OfferLetter) => {
      try {
        const updated = await generateOfferLetterDraft(offer);
        setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        closeWorkflowModal();
        toast("Offer Letter Draft Generated", `Document compiled from candidate and requisition records. Ready for HR review.`, "success");
      } catch {
        toast("Error", "Failed to generate offer letter draft.", "error");
      }
    },
    [closeWorkflowModal, toast]
  );

  const handleEndorseHrReview = useCallback(
    async (offer: OfferLetter, notes?: string) => {
      try {
        const updated = await endorseHrReview(offer, currentUserName, notes);
        setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        closeWorkflowModal();
        toast("HR Review Endorsed", `Offer letter endorsed and forwarded for final management approval.`, "success");
      } catch {
        toast("Error", "Failed to endorse HR review.", "error");
      }
    },
    [currentUserName, closeWorkflowModal, toast]
  );

  const handleApproveManagement = useCallback(
    async (offer: OfferLetter, notes?: string) => {
      try {
        const updated = await approveOfferManagement(offer, currentUserName, notes);
        setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        closeWorkflowModal();
        toast("Offer Fully Approved", `Management sign-off completed. Offer is authorized to be issued.`, "success");
      } catch {
        toast("Error", "Failed to approve offer letter.", "error");
      }
    },
    [currentUserName, closeWorkflowModal, toast]
  );

  const handleIssueOffer = useCallback(
    async (offer: OfferLetter, expiryDate?: string) => {
      try {
        const updated = await issueOffer(offer, currentUserName, expiryDate);
        setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        closeWorkflowModal();
        if (onCandidateStageUpdated) onCandidateStageUpdated();
        toast("Offer Officially Issued", `Offer has been issued to ${offer.candidate_name}. Candidate pipeline stage updated to Offer.`, "success");
        // Trigger PDF export
        exportOfferLetterPdf(updated);
      } catch {
        toast("Error", "Failed to issue offer letter.", "error");
      }
    },
    [currentUserName, closeWorkflowModal, onCandidateStageUpdated, toast]
  );

  const handleRecordDecision = useCallback(
    async (offer: OfferLetter, decision: "accepted" | "rejected", notes?: string, rejectionReason?: string) => {
      try {
        const updated = await recordCandidateDecision(offer, decision, notes, rejectionReason);
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
    },
    [closeWorkflowModal, onCandidateStageUpdated, toast]
  );

  const handleExportPdf = useCallback((offer: OfferLetter) => {
    exportOfferLetterPdf(offer);
  }, []);

  const counts = useMemo(() => {
    const pendingAction = offers.filter((o) =>
      ["salary_proposal", "salary_approved", "draft_letter", "hr_review", "management_approval", "approved"].includes(o.status)
    ).length;
    const issued = offers.filter((o) => o.status === "issued").length;
    const accepted = offers.filter((o) => o.status === "accepted").length;
    const rejected = offers.filter((o) => o.status === "rejected").length;
    return {
      total: offers.length,
      pendingAction,
      issued,
      accepted,
      rejected,
    };
  }, [offers]);

  return {
    offers,
    loading,
    loadOffers,
    counts,

    // Modal controls
    activeOffer,
    modalType,
    openWorkflowModal,
    closeWorkflowModal,

    isCreateProposalOpen,
    targetCandidate,
    openCreateProposal,
    closeCreateProposal,

    // Workflow actions
    handleCreateProposal,
    handleApproveSalary,
    handleGenerateDraft,
    handleEndorseHrReview,
    handleApproveManagement,
    handleIssueOffer,
    handleRecordDecision,
    handleExportPdf,
  };
}
