import { memo, useMemo } from "react";
import type { Candidate, OfferLetter, OfferStatus } from "../../types";
import type { WorkflowModalType } from "../../hooks/useOfferLetters";
import { getOfferSignatories } from "../../services/offerLetterService";
import { useBranchScope } from "@/context/BranchContext";
import { isHrDivisionScope } from "@/services/formLogoService";
import { OfferLifecycleHeader } from "./OfferLifecycleHeader";
import { OfferTimelineStepGrid, type OfferStepItem } from "./OfferTimelineStepGrid";
import { OfferCurrentActionCallout } from "./OfferCurrentActionCallout";

interface CandidateOfferLifecycleCardProps {
  candidate: Candidate;
  offer: OfferLetter | null;
  onOpenCreateProposal: () => void;
  onGenerateDraft: (offer: OfferLetter) => Promise<void>;
  onOpenWorkflowModal: (offer: OfferLetter, type: WorkflowModalType) => void;
  onExportPdf: (offer: OfferLetter) => void;
  onExportWord?: (offer: OfferLetter) => void;
}

export const CandidateOfferLifecycleCard = memo(function CandidateOfferLifecycleCard({
  candidate: _candidate,
  offer,
  onOpenCreateProposal,
  onOpenWorkflowModal,
  onExportPdf,
  onExportWord,
}: CandidateOfferLifecycleCardProps) {
  const { effectiveBranchName, branches, setSelectedBranchId, isSuperAdmin, isHrDivision } = useBranchScope();
  const isCurrentScopeHr = isHrDivisionScope(effectiveBranchName);
  const canSwitchToHr = isSuperAdmin || isHrDivision;

  const handleSwitchToHr = () => {
    const hrBranch = branches.find((b) => isHrDivisionScope(b.name));
    if (hrBranch) {
      setSelectedBranchId(hrBranch.id);
    } else {
      setSelectedBranchId("all");
    }
  };

  const isQualificationBased = useMemo(() => {
    if (!offer) return false;
    const text = `${offer.special_terms || ""} ${offer.proposal_notes || ""}`.toLowerCase();
    return text.includes("qualification");
  }, [offer]);

  const totalAllowances = useMemo(() => {
    return (offer?.allowances || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [offer]);

  const totalPackage = (offer?.base_salary || 0) + totalAllowances;
  const sigs = useMemo(() => (offer ? getOfferSignatories(offer) : null), [offer]);

  // Determine active step (1 to 7)
  const currentStepNumber = useMemo(() => {
    if (!offer) return 1;
    switch (offer.status as OfferStatus) {
      case "salary_proposal":
      case "pending_bu_ceo":
        return 2;
      case "pending_hr_manager":
      case "draft_letter":
      case "hr_review":
        return 3;
      case "pending_hr_director":
        return 4;
      case "pending_chairwoman":
      case "management_approval":
        return 5;
      case "approved":
      case "salary_approved":
        return 6;
      case "issued":
        return 7;
      case "accepted":
      case "rejected":
        return 8;
      default:
        return 2;
    }
  }, [offer]);

  const steps: OfferStepItem[] = useMemo(() => {
    const hasOffer = Boolean(offer);
    const s = offer?.status;

    return [
      {
        id: 1,
        key: "proposal",
        name: "Salary Proposal",
        subtitle: hasOffer ? `$${offer?.base_salary.toLocaleString()}/mo` : "Define salary & terms",
        icon: "ri-money-dollar-circle-line",
        isDone: hasOffer,
        isCurrent: !hasOffer,
        details: hasOffer
          ? `Proposed by ${offer?.proposed_by_name || "Manager"} on ${
              offer?.proposed_at ? new Date(offer.proposed_at).toLocaleDateString() : "Record"
            }`
          : null,
      },
      {
        id: 2,
        key: "bu_ceo",
        name: "BU CEO Approval",
        subtitle: sigs?.bu_ceo.name ? "BU CEO Approved" : "Sign-off by BU CEO",
        icon: "ri-user-star-line",
        isDone: sigs?.bu_ceo.status === "approved",
        isCurrent: hasOffer && (s === "pending_bu_ceo" || (s === "salary_proposal" && sigs?.bu_ceo.status !== "approved")),
        details: sigs?.bu_ceo.name ? `Approved by ${sigs.bu_ceo.name}` : `Actionable in ${offer?.business_unit || "BU"}`,
      },
      {
        id: 3,
        key: "hr_manager",
        name: "HR Manager Review",
        subtitle: sigs?.hr_manager.name ? "HR Manager Approved" : "Compliance & terms",
        icon: "ri-shield-check-line",
        isDone: sigs?.hr_manager.status === "approved",
        isCurrent: hasOffer && (s === "pending_hr_manager" || s === "draft_letter" || s === "hr_review"),
        details: sigs?.hr_manager.name ? `Endorsed by ${sigs.hr_manager.name}` : "Gated to HR Division",
      },
      {
        id: 4,
        key: "hr_director",
        name: "HR Admin Director",
        subtitle: sigs?.hr_director.name ? "Director Authorized" : "Division Director sign-off",
        icon: "ri-shield-user-line",
        isDone: sigs?.hr_director.status === "approved",
        isCurrent: hasOffer && s === "pending_hr_director",
        details: sigs?.hr_director.name ? `Authorized by ${sigs.hr_director.name}` : "Gated to HR Division",
      },
      {
        id: 5,
        key: "chairwoman",
        name: "Chairwoman",
        subtitle: sigs?.chairwoman.name ? "Supreme Authorization" : "Corporate executive sign-off",
        icon: "ri-vip-crown-line",
        isDone: sigs?.chairwoman.status === "approved",
        isCurrent: hasOffer && (s === "pending_chairwoman" || s === "management_approval"),
        details: sigs?.chairwoman.name ? `Authorized by ${sigs.chairwoman.name}` : "Gated to HR Division",
      },
      {
        id: 6,
        key: "issue",
        name: "Issue Offer",
        subtitle: "Official PDF & transmit",
        icon: "ri-mail-send-line",
        isDone: ["issued", "accepted", "rejected"].includes(s || ""),
        isCurrent: hasOffer && s === "approved",
        details: offer?.issued_at
          ? `Issued by ${offer.issued_by || "HR"} (Expires: ${offer.expiry_date || "—"})`
          : "Gated to HR Division",
      },
      {
        id: 7,
        key: "decision",
        name: "Candidate Response",
        subtitle: s === "accepted" ? "Candidate Accepted!" : s === "rejected" ? "Candidate Declined" : "Awaiting response",
        icon:
          s === "accepted"
            ? "ri-checkbox-circle-fill text-emerald-600"
            : s === "rejected"
            ? "ri-close-circle-fill text-rose-600"
            : "ri-question-answer-line",
        isDone: s === "accepted" || s === "rejected",
        isCurrent: hasOffer && s === "issued",
        details:
          s === "accepted"
            ? `Accepted on ${offer?.decision_at ? new Date(offer.decision_at).toLocaleDateString() : "Record"}`
            : s === "rejected"
            ? `Declined: ${offer?.rejection_reason || "Candidate decline"}`
            : null,
      },
    ];
  }, [offer, sigs]);

  return (
    <div id="candidate-offer-lifecycle-card" className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden transition-all">
      <OfferLifecycleHeader
        offer={offer}
        isQualificationBased={isQualificationBased}
        totalAllowances={totalAllowances}
        totalPackage={totalPackage}
        onOpenCreateProposal={onOpenCreateProposal}
        onExportPdf={onExportPdf}
        onExportWord={onExportWord}
      />

      <div className="p-6">
        <OfferTimelineStepGrid steps={steps} />

        <OfferCurrentActionCallout
          offer={offer}
          currentStepNumber={currentStepNumber}
          sigs={sigs}
          isCurrentScopeHr={isCurrentScopeHr}
          canSwitchToHr={canSwitchToHr}
          handleSwitchToHr={handleSwitchToHr}
          isSuperAdmin={isSuperAdmin}
          onOpenCreateProposal={onOpenCreateProposal}
          onOpenWorkflowModal={onOpenWorkflowModal}
          onExportPdf={onExportPdf}
          onExportWord={onExportWord}
        />
      </div>
    </div>
  );
});
