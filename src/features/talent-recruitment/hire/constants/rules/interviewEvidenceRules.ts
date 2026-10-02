import type { StageEvidenceRule } from "../evidenceTypes";
import {
  isStageInterviewScheduled,
  isStageInterviewEvaluated,
  getStageInterview,
} from "../interviewEvidenceHelpers";

export const interviewEvidenceRules: StageEvidenceRule[] = [
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
        summary = `Verified (2/2 Done): Interview scheduled & Evaluation Form submitted (${
          hrDocs[0]?.notes || (stageIv?.score ? `Score: ${stageIv.score}/5` : "Scorecard on file")
        }).`;
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
        summary = `Verified (2/2 Done): Technical interview scheduled & Evaluation recorded (${
          hmDocs[0]?.notes || (stageIv?.score ? `Score: ${stageIv.score}/5` : "Scorecard on file")
        }).`;
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
        summary = `Verified (2/2 Done): Executive interview scheduled & Appraisal signed off (${
          finalDocs[0]?.notes || (stageIv?.score ? `Score: ${stageIv.score}/5` : "Scorecard on file")
        }).`;
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
];
