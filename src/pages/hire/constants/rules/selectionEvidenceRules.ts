import { STAGE_TIMELINE_ORDER } from "../../constants";
import type { StageEvidenceRule } from "../evidenceTypes";
import { isCandidateApprovalVerified } from "../interviewEvidenceHelpers";

export const selectionEvidenceRules: StageEvidenceRule[] = [
  {
    order: 7,
    stageKey: "selected",
    stageName: "Selected",
    responsibleRole: "Hiring Committee & HR Director",
    requiredEvidence: [
      "Formal Selection Sign-off",
      "Requisition Headcount allocation match",
    ],
    formOfEvidence: "Candidate selection record linked to approved requisition_id",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Selection Sign-off Memo",
    checkEvidence: (candidate) => {
      const normStage = candidate.stage;
      const stageIdx = STAGE_TIMELINE_ORDER.indexOf(normStage);
      const isPassedStage = stageIdx >= STAGE_TIMELINE_ORDER.indexOf("selected") && normStage !== "rejected";
      const selectDocs = (candidate.documents || []).filter((d) => d.stage_key === "selected");
      const isVerified = isPassedStage || selectDocs.length > 0;
      return {
        isVerified,
        summary: isVerified
          ? "Verified: Candidate confirmed as selected candidate for approved headcount."
          : "Pending: Formal selection sign-off required.",
        attachedDocs: selectDocs,
      };
    },
  },
  {
    order: 8,
    stageKey: "candidate_approval",
    stageName: "Candidate Approval",
    responsibleRole: "CEO, HR & Admin Manager, Division Director, Chairwoman",
    requiredEvidence: [
      "Candidate & Role Overview Record",
      "Candidate Evaluation Summary & Interview Panels Verification",
      "4-Step Executive Sign-offs (CEO, HR Manager, Division Director, Chairwoman)",
      "Official Candidate Approval Form (CAF) PDF",
    ],
    formOfEvidence: "Completed Candidate Approval Form (CAF) with 4-level signatures",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Signed Candidate Approval Form",
    checkEvidence: (candidate) => {
      const isVerified = isCandidateApprovalVerified(candidate);
      const cafDocs = (candidate.documents || []).filter(
        (d) =>
          d.stage_key === "candidate_approval" ||
          (d.name || "").toLowerCase().includes("candidate approval")
      );
      return {
        isVerified,
        summary: isVerified
          ? "Verified: Candidate Approval Form (CAF) approved with executive sign-offs."
          : "Pending: 4-step executive approval sign-off required on Candidate Approval Form.",
        attachedDocs: cafDocs,
      };
    },
  },
  {
    order: 9,
    stageKey: "salary_negotiation",
    stageName: "Salary Negotiation",
    responsibleRole: "HR Director & Finance",
    requiredEvidence: [
      "Compensation Proposal vs Expected Salary breakdown",
      "Agreed Monthly Salary & Allowances",
      "Budget compliance verification",
    ],
    formOfEvidence: "Compensation proposal record, HR Director / Finance budget clearance",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Compensation Proposal Sheet",
    checkEvidence: (candidate) => {
      const hasExpected = Boolean(candidate.expected_salary && candidate.expected_salary > 0);
      const salaryDocs = (candidate.documents || []).filter((d) => d.stage_key === "salary_negotiation");
      const normStage = candidate.stage;
      const stageIdx = STAGE_TIMELINE_ORDER.indexOf(normStage);
      const isPassedStage = stageIdx >= STAGE_TIMELINE_ORDER.indexOf("salary_negotiation") && normStage !== "rejected";
      const isVerified = (isPassedStage && hasExpected) || salaryDocs.length > 0;
      return {
        isVerified,
        summary: isVerified
          ? `Verified: Compensation package aligned (Expected: $${candidate.expected_salary?.toLocaleString() || "—"}/mo).`
          : "Pending: Agreed salary breakdown and budget verification required.",
        attachedDocs: salaryDocs,
      };
    },
  },
  {
    order: 9,
    stageKey: "offer",
    stageName: "Offer",
    responsibleRole: "HR Manager / Director",
    requiredEvidence: [
      "Formal Written Offer Letter document",
      "Offered compensation breakdown",
      "Proposed joining date & offer expiry date",
    ],
    formOfEvidence: "Generated or uploaded Offer Letter PDF (documents JSON attachment)",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Official Offer Letter PDF",
    checkEvidence: (candidate) => {
      const offerDocs = (candidate.documents || []).filter(
        (d) => d.stage_key === "offer" || /offer\s*letter/i.test(d.name)
      );
      const isVerified = offerDocs.length > 0;
      return {
        isVerified,
        summary: isVerified
          ? `Verified: Official Offer Letter document attached (${offerDocs[0]?.name}).`
          : "Pending: Formal written offer letter PDF required.",
        attachedDocs: offerDocs,
      };
    },
  },
];
