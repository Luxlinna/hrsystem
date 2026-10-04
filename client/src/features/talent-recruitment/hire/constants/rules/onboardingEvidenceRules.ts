import type { StageEvidenceRule } from "../evidenceTypes";
import { getPortalCompletionStats } from "../documentPortalConfig";
import { getLocalContracts } from "../../services/contractService";

export const onboardingEvidenceRules: StageEvidenceRule[] = [
  {
    order: 10,
    stageKey: "accepted",
    stageName: "Accepted",
    responsibleRole: "Candidate & Recruiter",
    requiredEvidence: [
      "Signed Offer Letter by Candidate",
      "Or written acceptance confirmation",
      "Confirmed onboarding start date",
    ],
    formOfEvidence: "Uploaded signed offer PDF, acceptance timestamp",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Signed Offer Acceptance PDF",
    checkEvidence: (candidate) => {
      const acceptedDocs = (candidate.documents || []).filter(
        (d) => d.stage_key === "accepted" || /signed\s*offer/i.test(d.name) || /acceptance/i.test(d.name)
      );
      const isVerified = acceptedDocs.length > 0;
      return {
        isVerified,
        summary: isVerified
          ? `Verified: Signed Offer Letter / Acceptance confirmed (${acceptedDocs[0]?.name}).`
          : "Pending: Candidate's countersigned offer letter required.",
        attachedDocs: acceptedDocs,
      };
    },
  },
  {
    order: 11,
    stageKey: "documents",
    stageName: "Documents",
    responsibleRole: "Candidate & Onboarding HR",
    requiredEvidence: [
      "10.1 Pre-boarding Required Documents:",
      "• National ID — front",
      "• National ID — back",
      "• Social Security Card, if available",
      "• Birth certificate",
      "• Family book — cover",
      "• Family book — inside pages",
      "• Bank account proof",
      "• 4×6 photo",
      "• Academic certificate(s)",
    ],
    formOfEvidence: "Employee Document Portal (candidates.documents array in Storage)",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Compliance Pre-boarding Document",
    checkEvidence: (candidate) => {
      const stats = getPortalCompletionStats(candidate.documents || []);
      const complianceDocs = candidate.documents || [];
      const isVerified = stats.verifiedRequired >= 1;
      return {
        isVerified,
        summary: stats.isAllComplete
          ? `Verified: All ${stats.totalRequired} required pre-boarding documents verified.`
          : stats.verifiedRequired > 0
          ? `In Progress: ${stats.verifiedRequired} of ${stats.totalRequired} required documents uploaded (${stats.percentage}%).`
          : `Pending: Pre-boarding compliance documents required (0/${stats.totalRequired} uploaded).`,
        attachedDocs: complianceDocs,
      };
    },
  },
  {
    order: 12,
    stageKey: "contract",
    stageName: "Contract",
    responsibleRole: "HR Division / HR Director & Candidate",
    requiredEvidence: [
      "Official Employment Contract (7-Stage Governance):",
      "1. Generate Contract (from accepted offer & BU)",
      "2. HR Division Review & Endorsement",
      "3. HR Director Approval",
      "4. Chairwoman Authorization",
      "5. Contract Issued to Candidate",
      "6. Dual Countersignatures (Candidate & Company)",
      "7. Completed & Archived to AWS S3",
    ],
    formOfEvidence: "Employment Contract Record & Signed PDF (AWS S3)",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Signed Employment Contract PDF",
    checkEvidence: (candidate) => {
      const contract = getLocalContracts().find((c) => c.candidate_id === candidate.id && !c.deleted_at);
      const contractDocs = (candidate.documents || []).filter(
        (d) => d.stage_key === "contract" || /contract/i.test(d.name)
      );
      const isCompleted = contract?.status === "completed" || contractDocs.length > 0;
      return {
        isVerified: isCompleted,
        summary: contract?.status === "completed"
          ? `Verified: Contract #${contract.contract_number} completed and dual-signed.`
          : contract
          ? `In Progress: Contract #${contract.contract_number} is at "${contract.status.replace("_", " ")}".`
          : contractDocs.length > 0
          ? `Verified: Signed employment contract archived (${contractDocs[0]?.name}).`
          : "Pending: 7-stage contract governance and countersignature required.",
        attachedDocs: contractDocs,
      };
    },
  },
  {
    order: 13,
    stageKey: "hired",
    stageName: "Hired",
    responsibleRole: "HR Operations / Onboarding",
    requiredEvidence: [
      "System Transition to Active Employee",
      "Employee ID generated (EMP-XXXXXX)",
      "Automated enrollment into Onboarding Checklist (onboarding_records)",
    ],
    formOfEvidence: "Active Employee Directory record, Requisition Headcount marked fulfilled",
    allowsUpload: false,
    checkEvidence: (candidate) => {
      const isHired = candidate.stage === "hired";
      return {
        isVerified: isHired,
        summary: isHired
          ? "Verified: Candidate transitioned to active employee and enrolled in onboarding."
          : "Pending: Final hire transition and onboarding enrollment.",
        attachedDocs: [],
      };
    },
  },
];
