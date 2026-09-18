import type { Candidate, Interview } from "../types";
import { STAGE_TIMELINE_ORDER, STAGE_CONFIG } from "../constants";
import {
  isStageInterviewScheduled,
  isStageInterviewEvaluated,
  isCandidateApprovalVerified,
} from "./interviewEvidenceHelpers";

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
    // Only enforce interview gates if the candidate is CURRENTLY AT or BEFORE this stage and attempting to pass it
    if (currentIdx <= stgIdx && targetIdx > stgIdx) {
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

  // 3. Check candidate approval stage progression gate (only if currently at or before candidate_approval)
  const approvalIdx = STAGE_TIMELINE_ORDER.indexOf("candidate_approval");
  if (approvalIdx >= 0 && currentIdx <= approvalIdx && targetIdx > approvalIdx) {
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
