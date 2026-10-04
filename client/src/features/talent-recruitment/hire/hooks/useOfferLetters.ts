import { useState, useEffect, useCallback, useMemo } from "react";
import type { OfferLetter, Candidate } from "../types";
import {
  fetchOfferLetters,
  createSalaryProposal,
  type CreateProposalPayload,
} from "../services/offerLetterService";
import { toast } from "@/components/Toast";
import { useBranchScope } from "@/context/BranchContext";
import { isHrDivisionScope } from "@/services/formLogoService";
import {
  executeExportOfferPdf,
  executeExportOfferWord,
} from "../utils/offerLetterExportHelper";
import { useOfferLetterWorkflow } from "./useOfferLetterWorkflow";

export type WorkflowModalType =
  | "bu_ceo_approval"
  | "hr_manager_approval"
  | "hr_director_approval"
  | "chairwoman_approval"
  | "salary_approval"
  | "generate_draft"
  | "hr_review"
  | "management_approval"
  | "issue_offer"
  | "decision"
  | "preview"
  | null;

export function useOfferLetters(currentUserName = "HR Operations", onCandidateStageUpdated?: () => void) {
  const { effectiveBranchName } = useBranchScope();
  const isCurrentScopeHr = isHrDivisionScope(effectiveBranchName);

  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOffer, setActiveOffer] = useState<OfferLetter | null>(null);
  const [modalType, setModalType] = useState<WorkflowModalType>(null);
  const [isCreateProposalOpen, setIsCreateProposalOpen] = useState(false);
  const [targetCandidate, setTargetCandidate] = useState<Candidate | null>(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      setOffers(await fetchOfferLetters());
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
    [currentUserName, closeCreateProposal]
  );

  const handleExportPdf = useCallback((offer: OfferLetter) => {
    executeExportOfferPdf(offer);
  }, []);

  const handleExportWord = useCallback(async (offer: OfferLetter) => {
    try {
      await executeExportOfferWord(offer);
      toast("Word Exported", `Offer letter for ${offer.candidate_name} downloaded as Word (.docx).`, "success");
    } catch {
      toast("Export Error", "Failed to generate Word document.", "error");
    }
  }, []);

  const workflowActions = useOfferLetterWorkflow({
    currentUserName,
    setOffers,
    closeWorkflowModal,
    openWorkflowModal,
    isCurrentScopeHr,
    onCandidateStageUpdated,
  });

  const counts = useMemo(() => {
    const pendingAction = offers.filter((o) =>
      [
        "salary_proposal",
        "pending_bu_ceo",
        "pending_hr_manager",
        "pending_hr_director",
        "pending_chairwoman",
        "approved",
        "salary_approved",
        "draft_letter",
        "hr_review",
        "management_approval",
      ].includes(o.status)
    ).length;
    return {
      total: offers.length,
      pendingAction,
      issued: offers.filter((o) => o.status === "issued").length,
      accepted: offers.filter((o) => o.status === "accepted").length,
      rejected: offers.filter((o) => o.status === "rejected").length,
    };
  }, [offers]);

  return {
    offers,
    loading,
    loadOffers,
    counts,
    activeOffer,
    modalType,
    openWorkflowModal,
    closeWorkflowModal,
    isCreateProposalOpen,
    targetCandidate,
    openCreateProposal,
    closeCreateProposal,
    handleCreateProposal,
    handleExportPdf,
    handleExportWord,
    ...workflowActions,
    currentUserName,
  };
}
