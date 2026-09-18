import type { StageEvidenceRule } from "./evidenceTypes";
import { sourcingEvidenceRules } from "./rules/sourcingEvidenceRules";
import { interviewEvidenceRules } from "./rules/interviewEvidenceRules";
import { selectionEvidenceRules } from "./rules/selectionEvidenceRules";
import { onboardingEvidenceRules } from "./rules/onboardingEvidenceRules";

export type { StageEvidenceRule };

export {
  getStageInterview,
  isStageInterviewScheduled,
  isStageInterviewEvaluated,
  isCandidateApprovalVerified,
} from "./interviewEvidenceHelpers";

export { checkInterviewStageProgressionGate } from "./progressionGateHelper";

export const STAGE_EVIDENCE_RULES: StageEvidenceRule[] = [
  ...sourcingEvidenceRules,
  ...interviewEvidenceRules,
  ...selectionEvidenceRules,
  ...onboardingEvidenceRules,
];
