import type { Candidate, Interview, CandidateDocument } from "../types";
import { STAGE_TIMELINE_ORDER, STAGE_CONFIG } from "../constants";

export function getStageInterview(stageKey: string, interviews: Interview[]): Interview | undefined {
  if (!interviews || interviews.length === 0) return undefined;

  // 1. Check notes for explicit stage tag [Stage: stageKey]
  const explicit = interviews.find((i) => {
    const n = (i.notes || "").toLowerCase();
    return n.includes(`stage: ${stageKey}`) || n.includes(stageKey);
  });
  if (explicit) return explicit;

  // 2. Check legacy type matching
  const legacyType = interviews.find((i) => {
    const t = (i.type || "").toLowerCase();
    if (stageKey === "hr_interview") {
      return t.includes("hr") || t.includes("screening");
    }
    if (stageKey === "hiring_manager_interview") {
      return (
        t.includes("hiring") ||
        t.includes("technical") ||
        t.includes("manager")
      );
    }
    if (stageKey === "final_interview") {
      return (
        t.includes("final") ||
        t.includes("executive") ||
        t.includes("director")
      );
    }
    return false;
  });
  if (legacyType) return legacyType;

  // 3. Chronological fallback for interviews without conflicting stage tags
  const stageIndex = ["hr_interview", "hiring_manager_interview", "final_interview"].indexOf(stageKey);
  if (stageIndex >= 0) {
    const sorted = [...interviews].sort(
      (a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()
    );
    if (sorted[stageIndex]) {
      return sorted[stageIndex];
    }
    // If only 1 interview exists and stageKey is hr_interview, assign it
    if (stageIndex === 0 && sorted.length > 0) {
      return sorted[0];
    }
  }

  // 4. Fallback to any interview that already has feedback or score
  return interviews.find((i) => Boolean(i.feedback || (i.score && i.score > 0)));
}

export function isStageInterviewScheduled(stageKey: string, interviews: Interview[]): boolean {
  return Boolean(getStageInterview(stageKey, interviews));
}

export function isStageInterviewEvaluated(
  stageKey: string,
  candidate: Candidate,
  interviews: Interview[]
): boolean {
  const hasDoc = (candidate.documents || []).some((d) => d.stage_key === stageKey);
  if (hasDoc) return true;

  const iv = getStageInterview(stageKey, interviews);
  if (iv && ((iv.score && iv.score > 0) || (iv.feedback && iv.feedback.trim().length > 0))) {
    return true;
  }

  // Also check if any interview for this candidate has feedback/score when in hr_interview
  if (stageKey === "hr_interview" && interviews.length > 0) {
    const anyEvaluated = interviews.some(
      (i) => (i.score && i.score > 0) || (i.feedback && i.feedback.trim().length > 0)
    );
    if (anyEvaluated) return true;
  }

  return false;
}

export function checkInterviewStageProgressionGate(
  currentStage: string,
  targetStage: string,
  candidate: Candidate,
  interviews: Interview[]
): {
  allowed: boolean;
  reason?: string;
  blockingStage?: string;
  missingForm?: "schedule" | "evaluation" | "both";
} {
  if (targetStage === "rejected") {
    return { allowed: true };
  }

  const normCurrent =
    currentStage === "applied" ? "cv_received" : currentStage === "interview" ? "hr_interview" : currentStage;
  const normTarget =
    targetStage === "applied" ? "cv_received" : targetStage === "interview" ? "hr_interview" : targetStage;

  const currentIdx = STAGE_TIMELINE_ORDER.indexOf(normCurrent);
  const targetIdx = STAGE_TIMELINE_ORDER.indexOf(normTarget);

  if (targetIdx <= currentIdx) {
    return { allowed: true };
  }

  // 1. Prevent skipping stages ahead: candidate must proceed sequentially
  if (targetIdx > currentIdx + 1 && targetStage !== "hired") {
    const nextStage = STAGE_TIMELINE_ORDER[currentIdx + 1];
    const nextLabel = STAGE_CONFIG[nextStage]?.label || nextStage;
    const targetLabel = STAGE_CONFIG[normTarget]?.label || normTarget;
    return {
      allowed: false,
      reason: `Cannot skip stages: Cannot jump directly to "${targetLabel}". You must advance sequentially through Stage ${currentIdx + 2}: "${nextLabel}".`,
      blockingStage: nextStage,
    };
  }

  // 2. Check all required interview stages that come before the target stage
  const interviewStages = ["hr_interview", "hiring_manager_interview", "final_interview"];

  for (const stg of interviewStages) {
    const stgIdx = STAGE_TIMELINE_ORDER.indexOf(stg);
    // If target is past this interview stage, both forms MUST be completed
    if (targetIdx > stgIdx) {
      const scheduled = isStageInterviewScheduled(stg, interviews);
      const evaluated = isStageInterviewEvaluated(stg, candidate, interviews);

      if (!scheduled || !evaluated) {
        const stageName = STAGE_CONFIG[stg]?.label || stg;
        let missingForm: "schedule" | "evaluation" | "both" = "both";
        let reason = `Cannot advance past "${stageName}": Both Interview Schedule Form and Evaluation Form must be completed.`;
        if (!scheduled) {
          missingForm = "schedule";
          reason = `Cannot advance past "${stageName}": Interview Schedule Form must be completed first.`;
        } else if (!evaluated) {
          missingForm = "evaluation";
          reason = `Cannot advance past "${stageName}": Interview Evaluation Form must be completed.`;
        }

        return {
          allowed: false,
          reason,
          blockingStage: stg,
          missingForm,
        };
      }
    }
  }

  // 3. Check candidate approval stage progression gate
  const approvalIdx = STAGE_TIMELINE_ORDER.indexOf("candidate_approval");
  if (approvalIdx >= 0 && targetIdx > approvalIdx) {
    const isApproved = isCandidateApprovalVerified(candidate);
    if (!isApproved) {
      return {
        allowed: false,
        reason: 'Cannot advance past "Candidate Approval": The Candidate Approval Form (CAF) must be signed and approved first.',
        blockingStage: "candidate_approval",
        missingForm: "evaluation",
      };
    }
  }

  return { allowed: true };
}

export function isCandidateApprovalVerified(candidate: Candidate): boolean {
  const hasDoc = (candidate.documents || []).some(
    (d) =>
      d.stage_key === "candidate_approval" ||
      (d.name || "").toLowerCase().includes("candidate approval")
  );
  if (hasDoc) return true;

  try {
    const raw = localStorage.getItem("hrm_candidate_approvals_store");
    if (raw) {
      const list = JSON.parse(raw);
      const found = list.find((a: any) => a.candidate_id === candidate.id);
      if (
        found &&
        (found.status === "approved" ||
          (found.signatories &&
            (found.signatories.ceo?.status === "approved" ||
              found.signatories.chairwoman?.status === "approved")))
      ) {
        return true;
      }
    }
  } catch {}

  return false;
}

export interface StageEvidenceRule {
  order: number;
  stageKey: string;
  stageName: string;
  responsibleRole: string;
  requiredEvidence: string[];
  formOfEvidence: string;
  allowsUpload: boolean;
  uploadCategoryLabel?: string;
  checkEvidence: (
    candidate: Candidate,
    interviews: Interview[]
  ) => {
    isVerified: boolean;
    summary: string;
    attachedDocs: CandidateDocument[];
    linkedInterview?: Interview | null;
    scheduled?: boolean;
    evaluated?: boolean;
  };
}

export const STAGE_EVIDENCE_RULES: StageEvidenceRule[] = [
  {
    order: 1,
    stageKey: "cv_received",
    stageName: "CV Received",
    responsibleRole: "Recruiter / Sourcing",
    requiredEvidence: [
      "Uploaded Resume/CV Document",
      "Sourcing Channel record",
      "Contact verification (Name, Email, Phone)",
    ],
    formOfEvidence: "PDF/Doc stored in Storage (resume_url), application source timestamp",
    allowsUpload: true,
    uploadCategoryLabel: "Upload CV / Resume",
    checkEvidence: (candidate) => {
      const hasResume = Boolean(candidate.resume_url);
      const cvDocs = (candidate.documents || []).filter(
        (d) => d.stage_key === "cv_received" || d.url === candidate.resume_url
      );
      const isVerified = hasResume && Boolean(candidate.email) && Boolean(candidate.phone);
      return {
        isVerified,
        summary: isVerified
          ? `Verified: Resume file attached with validated contact info (via ${candidate.source || "Direct"}).`
          : "Pending: Resume document or verified contact missing.",
        attachedDocs: cvDocs.length > 0 ? cvDocs : candidate.resume_url ? [{ name: candidate.resume_name || "Candidate CV", url: candidate.resume_url }] : [],
      };
    },
  },
  {
    order: 2,
    stageKey: "screening",
    stageName: "Screening",
    responsibleRole: "Recruiter",
    requiredEvidence: [
      "Recruiter Phone Screening Notes",
      "Basic qualification criteria match (Experience, Education)",
      "Initial Rating (1–5 Stars)",
    ],
    formOfEvidence: "Screening assessment notes, recruiter ID, candidate rating",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Screening Sheet",
    checkEvidence: (candidate) => {
      const hasRating = Boolean(candidate.rating && candidate.rating > 0);
      const hasNotes = Boolean(candidate.notes && candidate.notes.trim().length > 0);
      const screeningDocs = (candidate.documents || []).filter((d) => d.stage_key === "screening");
      const isVerified = (hasRating || hasNotes) || screeningDocs.length > 0;
      return {
        isVerified,
        summary: isVerified
          ? `Verified: Screening evaluation recorded (${candidate.rating || "—"}/5 Stars, Notes verified).`
          : "Pending: Recruiter screening rating and qualification notes required.",
        attachedDocs: screeningDocs,
      };
    },
  },
  {
    order: 3,
    stageKey: "shortlisted",
    stageName: "Shortlisted",
    responsibleRole: "HR Manager & Recruiter",
    requiredEvidence: [
      "Recruiter Shortlist Recommendation",
      "Hiring Manager review clearance to invite for interview",
    ],
    formOfEvidence: "Shortlist timestamp, Hiring Manager endorsement sign-off",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Shortlist Endorsement",
    checkEvidence: (candidate) => {
      const normStage = candidate.stage === "applied" ? "cv_received" : candidate.stage;
      const stageIdx = STAGE_TIMELINE_ORDER.indexOf(normStage);
      const isPassedStage = stageIdx >= STAGE_TIMELINE_ORDER.indexOf("shortlisted") && normStage !== "rejected";
      const shortlistDocs = (candidate.documents || []).filter((d) => d.stage_key === "shortlisted");
      const isVerified = isPassedStage || shortlistDocs.length > 0;
      return {
        isVerified,
        summary: isVerified
          ? "Verified: Candidate shortlisted and cleared by Hiring Manager for interview rounds."
          : "Pending: Shortlist clearance and invitation confirmation pending.",
        attachedDocs: shortlistDocs,
      };
    },
  },
  {
    order: 4,
    stageKey: "hr_interview",
    stageName: "HR Interview",
    responsibleRole: "HR Manager / Recruiter",
    requiredEvidence: [
      "1. Interview Schedule Form (Date, Time, Link/Room)",
      "2. HR Interview Evaluation & Scorecard Form",
      "Cultural Fit, Motivation & Expected Salary check",
    ],
    formOfEvidence: "Scheduled interview record + Completed digital evaluation form",
    allowsUpload: true,
    uploadCategoryLabel: "Upload HR Interview Scorecard",
    checkEvidence: (candidate, interviews) => {
      const scheduled = isStageInterviewScheduled("hr_interview", interviews);
      const evaluated = isStageInterviewEvaluated("hr_interview", candidate, interviews);
      const stageIv = getStageInterview("hr_interview", interviews);
      const hrDocs = (candidate.documents || []).filter((d) => d.stage_key === "hr_interview");

      const isVerified = scheduled && evaluated;
      let summary = "";
      if (isVerified) {
        summary = `Verified (2/2 Done): Interview scheduled & Evaluation Form submitted (${hrDocs[0]?.notes || (stageIv?.score ? `Score: ${stageIv.score}/5` : "Scorecard on file")}).`;
      } else if (!scheduled) {
        summary = "Pending Step 1: Interview Schedule Form must be completed first.";
      } else {
        summary = "Pending Step 2: Interview scheduled. Recruiter Evaluation Form must be completed.";
      }

      return {
        isVerified,
        summary,
        attachedDocs: hrDocs,
        linkedInterview: stageIv || null,
        scheduled,
        evaluated,
      };
    },
  },
  {
    order: 5,
    stageKey: "hiring_manager_interview",
    stageName: "Hiring Manager Interview",
    responsibleRole: "Hiring Manager",
    requiredEvidence: [
      "1. Technical Interview Schedule Form",
      "2. Technical / Functional Competency Scorecard Form",
      "Hiring Manager Recommendation (Proceed/Hold/Reject)",
    ],
    formOfEvidence: "Scheduled interview record + Completed technical evaluation form",
    allowsUpload: true,
    uploadCategoryLabel: "Upload HM Technical Evaluation",
    checkEvidence: (candidate, interviews) => {
      const scheduled = isStageInterviewScheduled("hiring_manager_interview", interviews);
      const evaluated = isStageInterviewEvaluated("hiring_manager_interview", candidate, interviews);
      const stageIv = getStageInterview("hiring_manager_interview", interviews);
      const hmDocs = (candidate.documents || []).filter((d) => d.stage_key === "hiring_manager_interview");

      const isVerified = scheduled && evaluated;
      let summary = "";
      if (isVerified) {
        summary = `Verified (2/2 Done): Technical interview scheduled & Evaluation recorded (${hmDocs[0]?.notes || (stageIv?.score ? `Score: ${stageIv.score}/5` : "Scorecard on file")}).`;
      } else if (!scheduled) {
        summary = "Pending Step 1: Technical Interview Schedule Form must be completed first.";
      } else {
        summary = "Pending Step 2: Interview scheduled. Technical Evaluation Form must be completed.";
      }

      return {
        isVerified,
        summary,
        attachedDocs: hmDocs,
        linkedInterview: stageIv || null,
        scheduled,
        evaluated,
      };
    },
  },
  {
    order: 6,
    stageKey: "final_interview",
    stageName: "Final Interview",
    responsibleRole: "CEO / Division Director",
    requiredEvidence: [
      "1. Executive Interview Schedule Form",
      "2. Executive Panel / Leadership Appraisal Form",
      "Executive Decision Recommendation",
    ],
    formOfEvidence: "Scheduled interview record + Completed executive evaluation form",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Final Executive Appraisal",
    checkEvidence: (candidate, interviews) => {
      const scheduled = isStageInterviewScheduled("final_interview", interviews);
      const evaluated = isStageInterviewEvaluated("final_interview", candidate, interviews);
      const stageIv = getStageInterview("final_interview", interviews);
      const finalDocs = (candidate.documents || []).filter((d) => d.stage_key === "final_interview");

      const isVerified = scheduled && evaluated;
      let summary = "";
      if (isVerified) {
        summary = `Verified (2/2 Done): Executive interview scheduled & Appraisal signed off (${finalDocs[0]?.notes || (stageIv?.score ? `Score: ${stageIv.score}/5` : "Scorecard on file")}).`;
      } else if (!scheduled) {
        summary = "Pending Step 1: Executive Interview Schedule Form must be completed first.";
      } else {
        summary = "Pending Step 2: Interview scheduled. Executive Appraisal Form must be completed.";
      }

      return {
        isVerified,
        summary,
        attachedDocs: finalDocs,
        linkedInterview: stageIv || null,
        scheduled,
        evaluated,
      };
    },
  },
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
      "Compliance Pre-boarding Document Checklist:",
      "1. National ID / Passport copy",
      "2. Degree & Academic Certificates",
      "3. Medical Checkup Certificate",
      "4. Police / Criminal Clearance",
      "5. Bank Details & Tax Number",
      "6. Passport Photo",
    ],
    formOfEvidence: "Multi-file document attachments (candidates.documents array in Storage)",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Compliance Pre-boarding Document",
    checkEvidence: (candidate) => {
      const complianceDocs = (candidate.documents || []).filter(
        (d) => d.stage_key === "documents" || /id|passport|degree|medical|police|tax|bank/i.test(d.name)
      );
      const isVerified = complianceDocs.length >= 1;
      return {
        isVerified,
        summary: isVerified
          ? `Verified: ${complianceDocs.length} compliance document(s) uploaded and archived.`
          : "Pending: Pre-boarding compliance documents required (ID, Degree, Medical, etc.).",
        attachedDocs: complianceDocs,
      };
    },
  },
  {
    order: 12,
    stageKey: "contract",
    stageName: "Contract",
    responsibleRole: "Legal / HR Director & Candidate",
    requiredEvidence: [
      "Official Employment Contract (Legal Standard)",
      "Dual Signatures: Company Authorized Signatory & Candidate",
      "Probation duration & terms",
    ],
    formOfEvidence: "Signed Employment Contract PDF (contract_url)",
    allowsUpload: true,
    uploadCategoryLabel: "Upload Signed Employment Contract PDF",
    checkEvidence: (candidate) => {
      const contractDocs = (candidate.documents || []).filter(
        (d) => d.stage_key === "contract" || /contract/i.test(d.name)
      );
      const isVerified = contractDocs.length > 0;
      return {
        isVerified,
        summary: isVerified
          ? `Verified: Signed employment contract archived (${contractDocs[0]?.name}).`
          : "Pending: Countersigned official employment contract PDF required.",
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
