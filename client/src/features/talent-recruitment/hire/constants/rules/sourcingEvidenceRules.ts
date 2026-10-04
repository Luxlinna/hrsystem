import { STAGE_TIMELINE_ORDER } from "../../constants";
import type { StageEvidenceRule } from "../evidenceTypes";

export const sourcingEvidenceRules: StageEvidenceRule[] = [
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
        attachedDocs:
          cvDocs.length > 0
            ? cvDocs
            : candidate.resume_url
            ? [{ name: candidate.resume_name || "Candidate CV", url: candidate.resume_url }]
            : [],
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
      const isVerified = hasRating || hasNotes || screeningDocs.length > 0;
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
];
