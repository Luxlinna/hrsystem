import type { Candidate, Interview } from "../types";

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
  } catch (_e) { /* parsing errors are non-fatal; return false */ }

  return false;
}
