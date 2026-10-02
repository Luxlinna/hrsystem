import { useState, useMemo } from "react";
import type { OfferLetter } from "../../../types";
import type { WorkflowModalType } from "../../../hooks/useOfferLetters";
import { useBranchScope } from "@/context/BranchContext";
import { isHrDivisionScope } from "@/services/formLogoService";
import { usePermissions } from "@/hooks/usePermissions";
import { uploadFileToS3 } from "@/lib/s3-storage";

export interface UseOfferWorkflowStateProps {
  offer: OfferLetter | null;
  modalType: WorkflowModalType;
  actorName?: string;
  onClose: () => void;
  onApproveSalary?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onApproveBuCeo?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onApproveHrManager?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onApproveHrDirector?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onAuthorizeChairwoman?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onGenerateDraft?: (offer: OfferLetter) => Promise<void>;
  onEndorseHrReview?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onApproveManagement?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onIssueOffer?: (offer: OfferLetter, expiryDate?: string) => Promise<void>;
  onRecordDecision?: (
    offer: OfferLetter,
    decision: "accepted" | "rejected",
    notes?: string,
    rejectionReason?: string,
    signedDoc?: { name: string; url: string; size?: number; type?: string }
  ) => Promise<void>;
}

export function useOfferWorkflowState(props: UseOfferWorkflowStateProps) {
  const {
    offer,
    modalType,
    actorName,
    onClose,
    onApproveSalary,
    onApproveBuCeo,
    onApproveHrManager,
    onApproveHrDirector,
    onAuthorizeChairwoman,
    onGenerateDraft,
    onEndorseHrReview,
    onApproveManagement,
    onIssueOffer,
    onRecordDecision,
  } = props;

  const { effectiveBranchName, branches, setSelectedBranchId, isSuperAdmin, isHrDivision, isBranchAdmin } =
    useBranchScope();
  const { role } = usePermissions();
  const isCurrentScopeHr = isHrDivisionScope(effectiveBranchName);
  const canSwitchToHr = isSuperAdmin || isHrDivision;

  const [notes, setNotes] = useState("");
  const [hrReviewer, setHrReviewer] = useState(actorName || "");
  const [checkTerms, setCheckTerms] = useState(false);
  const [checkRemuneration, setCheckRemuneration] = useState(false);
  const [checkProbation, setCheckProbation] = useState(false);
  const [checkCompliance, setCheckCompliance] = useState(false);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [decision, setDecision] = useState<"accepted" | "rejected">("accepted");
  const [rejectionReason, setRejectionReason] = useState("Accepted competing offer");
  const [otherReason, setOtherReason] = useState("");
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadingSignedFile, setUploadingSignedFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canActOnStep = useMemo(() => {
    if (isSuperAdmin) return true;
    switch (modalType) {
      case "bu_ceo_approval":
      case "salary_approval":
        return Boolean(
          isSuperAdmin ||
            (!isCurrentScopeHr &&
              (isBranchAdmin ||
                role?.candidate_approval_ceo_sign ||
                role?.hiring_requests_branch_approve ||
                /(ceo|director|general manager|president|branch admin|bu admin)/i.test(role?.name || "")))
        );
      case "hr_manager_approval":
      case "hr_review":
        return isCurrentScopeHr;
      case "hr_director_approval":
        return (
          isCurrentScopeHr &&
          Boolean(isSuperAdmin || /(director|head|admin director)/i.test(role?.name || ""))
        );
      case "chairwoman_approval":
      case "management_approval":
        return (
          isCurrentScopeHr &&
          Boolean(isSuperAdmin || /(chairwoman|president|supreme|executive)/i.test(role?.name || ""))
        );
      case "generate_draft":
      case "issue_offer":
      case "decision":
      default:
        return true;
    }
  }, [modalType, isSuperAdmin, isCurrentScopeHr, isBranchAdmin, role]);

  const handleAction = async () => {
    if (!offer) return;
    setSubmitting(true);
    try {
      if (modalType === "bu_ceo_approval") {
        if (onApproveBuCeo) await onApproveBuCeo(offer, notes);
        else if (onApproveSalary) await onApproveSalary(offer, notes);
      } else if (modalType === "hr_manager_approval") {
        if (onApproveHrManager) await onApproveHrManager(offer, notes);
        else if (onEndorseHrReview) await onEndorseHrReview(offer, notes);
      } else if (modalType === "hr_director_approval") {
        if (onApproveHrDirector) await onApproveHrDirector(offer, notes);
      } else if (modalType === "chairwoman_approval") {
        if (onAuthorizeChairwoman) await onAuthorizeChairwoman(offer, notes);
        else if (onApproveManagement) await onApproveManagement(offer, notes);
      } else if (modalType === "salary_approval" && onApproveSalary) {
        await onApproveSalary(offer, notes);
      } else if (modalType === "generate_draft" && onGenerateDraft) {
        await onGenerateDraft(offer);
      } else if (modalType === "hr_review" && onEndorseHrReview) {
        const reviewNotes = notes
          ? `[HR Reviewer: ${hrReviewer.trim() || actorName || "HR Manager"}] ${notes}`
          : `[HR Reviewer: ${hrReviewer.trim() || actorName || "HR Manager"}] Endorsed compliance and verified terms.`;
        await onEndorseHrReview(offer, reviewNotes);
      } else if (modalType === "management_approval" && onApproveManagement) {
        await onApproveManagement(offer, notes);
      } else if (modalType === "issue_offer" && onIssueOffer) {
        await onIssueOffer(offer, expiryDate);
      } else if (modalType === "decision" && onRecordDecision) {
        const finalReason = rejectionReason === "Other" ? otherReason : rejectionReason;
        let signedDoc: { name: string; url: string; size?: number; type?: string } | undefined;
        if (decision === "accepted" && signedFile) {
          setUploadingSignedFile(true);
          try {
            const uploaded = await uploadFileToS3(signedFile, "candidates/offers/signed");
            signedDoc = {
              name: signedFile.name,
              url: uploaded.url,
              size: uploaded.size,
              type: uploaded.type || signedFile.type,
            };
          } catch (uploadErr) {
            console.warn("Could not upload signed file to S3:", uploadErr);
          } finally {
            setUploadingSignedFile(false);
          }
        }
        await onRecordDecision(offer, decision, notes, finalReason, signedDoc);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return {
    effectiveBranchName,
    branches,
    setSelectedBranchId,
    role,
    isCurrentScopeHr,
    canSwitchToHr,
    notes,
    setNotes,
    hrReviewer,
    setHrReviewer,
    checkTerms,
    setCheckTerms,
    checkRemuneration,
    setCheckRemuneration,
    checkProbation,
    setCheckProbation,
    checkCompliance,
    setCheckCompliance,
    expiryDate,
    setExpiryDate,
    decision,
    setDecision,
    rejectionReason,
    setRejectionReason,
    otherReason,
    setOtherReason,
    signedFile,
    setSignedFile,
    uploadingSignedFile,
    submitting,
    canActOnStep,
    handleAction,
  };
}
