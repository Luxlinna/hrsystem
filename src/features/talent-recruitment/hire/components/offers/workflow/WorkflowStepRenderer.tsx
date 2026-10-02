import { memo } from "react";
import type { OfferLetter } from "../../../types";
import type { WorkflowModalType } from "../../../hooks/useOfferLetters";
import {
  BuCeoApprovalPanel,
  GenerateDraftPanel,
  HrManagerApprovalPanel,
  HrDirectorApprovalPanel,
  ChairwomanApprovalPanel,
  IssueOfferPanel,
  CandidateDecisionPanel,
} from "./WorkflowStepPanels";

interface WorkflowStepRendererProps {
  modalType: WorkflowModalType;
  offer: OfferLetter;
  onExportPdf: (offer: OfferLetter) => void;
  onExportWord?: (offer: OfferLetter) => void;
  checkTerms: boolean;
  setCheckTerms: (v: boolean) => void;
  checkRemuneration: boolean;
  setCheckRemuneration: (v: boolean) => void;
  checkProbation: boolean;
  setCheckProbation: (v: boolean) => void;
  checkCompliance: boolean;
  setCheckCompliance: (v: boolean) => void;
  hrReviewer: string;
  setHrReviewer: (v: string) => void;
  expiryDate: string;
  setExpiryDate: (v: string) => void;
  decision: "accepted" | "rejected";
  setDecision: (v: "accepted" | "rejected") => void;
  rejectionReason: string;
  setRejectionReason: (v: string) => void;
  otherReason: string;
  setOtherReason: (v: string) => void;
  signedFile: File | null;
  setSignedFile: (f: File | null) => void;
}

export const WorkflowStepRenderer = memo(function WorkflowStepRenderer({
  modalType,
  offer,
  onExportPdf,
  onExportWord,
  checkTerms,
  setCheckTerms,
  checkRemuneration,
  setCheckRemuneration,
  checkProbation,
  setCheckProbation,
  checkCompliance,
  setCheckCompliance,
  hrReviewer,
  setHrReviewer,
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
}: WorkflowStepRendererProps) {
  switch (modalType) {
    case "bu_ceo_approval":
      return (
        <BuCeoApprovalPanel
          offer={offer}
          checkTerms={checkTerms}
          setCheckTerms={setCheckTerms}
          checkRemuneration={checkRemuneration}
          setCheckRemuneration={setCheckRemuneration}
          checkCompliance={checkCompliance}
          setCheckCompliance={setCheckCompliance}
        />
      );

    case "generate_draft":
      return <GenerateDraftPanel offer={offer} />;

    case "hr_manager_approval":
    case "hr_review":
      return (
        <HrManagerApprovalPanel
          offer={offer}
          onExportPdf={onExportPdf}
          onExportWord={onExportWord}
          checkTerms={checkTerms}
          setCheckTerms={setCheckTerms}
          checkRemuneration={checkRemuneration}
          setCheckRemuneration={setCheckRemuneration}
          checkProbation={checkProbation}
          setCheckProbation={setCheckProbation}
          checkCompliance={checkCompliance}
          setCheckCompliance={setCheckCompliance}
          hrReviewer={hrReviewer}
          setHrReviewer={setHrReviewer}
        />
      );

    case "hr_director_approval":
      return (
        <HrDirectorApprovalPanel
          offer={offer}
          onExportPdf={onExportPdf}
          onExportWord={onExportWord}
          checkCompliance={checkCompliance}
          setCheckCompliance={setCheckCompliance}
          checkTerms={checkTerms}
          setCheckTerms={setCheckTerms}
        />
      );

    case "chairwoman_approval":
    case "management_approval":
      return (
        <ChairwomanApprovalPanel
          offer={offer}
          onExportPdf={onExportPdf}
          onExportWord={onExportWord}
        />
      );

    case "issue_offer":
      return <IssueOfferPanel expiryDate={expiryDate} setExpiryDate={setExpiryDate} />;

    case "decision":
      return (
        <CandidateDecisionPanel
          decision={decision}
          setDecision={setDecision}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          otherReason={otherReason}
          setOtherReason={setOtherReason}
          signedFile={signedFile}
          setSignedFile={setSignedFile}
        />
      );

    default:
      return null;
  }
});
