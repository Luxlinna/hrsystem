/**
 * Turnaround SLA benchmarks in hours for each recruitment stage
 */
export const REQUISITION_STAGE_SLA_HOURS: Record<string, number> = {
  pending: 48, // Branch Review
  pending_branch_review: 48,
  pending_hr_review: 48, // HR Manager Review
  pending_hr_admin_review: 48, // HR Admin Review
  pending_chairman_review: 72, // Chairwoman / Chairman Final Authorization
};

export const CANDIDATE_STAGE_SLA_HOURS: Record<string, number> = {
  cv_received: 48,
  applied: 48,
  screening: 72,
  shortlisted: 72,
  hr_interview: 120,
  interview: 120,
  hiring_manager_interview: 120,
  final_interview: 120,
  selected: 48,
  salary_negotiation: 72,
  offer: 72,
  accepted: 120,
  documents: 120,
  contract: 72,
};

export interface StageSlaEvaluation {
  isOverdue: boolean;
  hoursElapsed: number;
  allowedHours: number;
  remainingHours: number;
  overdueHours: number;
  badgeText: string;
  urgencyLevel: "normal" | "warning" | "breached";
}

export function evaluateStageSla(
  stageKey: string,
  stageEnteredAtStr?: string | null,
  isCandidate = false
): StageSlaEvaluation | null {
  if (!stageEnteredAtStr) return null;

  const allowedHours = isCandidate
    ? CANDIDATE_STAGE_SLA_HOURS[stageKey] || 72
    : REQUISITION_STAGE_SLA_HOURS[stageKey] || 48;

  const enteredMs = new Date(stageEnteredAtStr).getTime();
  if (isNaN(enteredMs)) return null;

  const nowMs = Date.now();
  const elapsedMs = Math.max(0, nowMs - enteredMs);
  const hoursElapsed = Math.floor(elapsedMs / (1000 * 60 * 60));
  const remainingHours = allowedHours - hoursElapsed;
  const isOverdue = remainingHours < 0;
  const overdueHours = isOverdue ? Math.abs(remainingHours) : 0;

  let urgencyLevel: "normal" | "warning" | "breached" = "normal";
  let badgeText = `${Math.ceil(remainingHours / 24)}d left`;

  if (isOverdue) {
    urgencyLevel = "breached";
    const daysOverdue = Math.max(1, Math.floor(overdueHours / 24));
    badgeText = `SLA Exceeded (+${daysOverdue}d)`;
  } else if (remainingHours <= 24) {
    urgencyLevel = "warning";
    badgeText = `SLA Due Soon (${remainingHours}h)`;
  }

  return {
    isOverdue,
    hoursElapsed,
    allowedHours,
    remainingHours,
    overdueHours,
    badgeText,
    urgencyLevel,
  };
}
