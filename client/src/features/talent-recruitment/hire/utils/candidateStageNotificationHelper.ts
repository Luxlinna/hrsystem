import { supabase } from "@/lib/supabase";
import {
  notifyCandidateShortlisted,
  notifyCandidateSelected,
  notifyRejected,
} from "@/services/notifications/recruitmentNotificationTriggers";

export async function dispatchCandidateStageNotification(params: {
  candidateId: string;
  stage: string;
  actorName: string;
  actorRole: string;
}) {
  const { candidateId, stage, actorName, actorRole } = params;

  if (stage !== "shortlisted" && stage !== "selected" && stage !== "rejected") {
    return;
  }

  try {
    const { data: cand } = await supabase
      .from("candidates")
      .select("*, job_postings(*, branches(name))")
      .eq("id", candidateId)
      .maybeSingle();

    if (cand) {
      if (stage === "shortlisted") {
        void notifyCandidateShortlisted({
          candidate: cand,
          jobTitle: cand.job_postings?.title || "Specialist",
          actorName,
          businessUnit: cand.job_postings?.branches?.name,
        }).catch((e) => console.error("[notifyCandidateShortlisted] error:", e));
      } else if (stage === "selected") {
        void notifyCandidateSelected({
          candidate: cand,
          jobTitle: cand.job_postings?.title || "Specialist",
          selectedBy: actorName,
          businessUnit: cand.job_postings?.branches?.name,
        }).catch((e) => console.error("[notifyCandidateSelected] error:", e));
      } else if (stage === "rejected") {
        void notifyRejected({
          entityType: "candidate",
          entityId: candidateId,
          entityCode: cand.full_name,
          entityTitle: `Candidate: ${cand.full_name}`,
          rejectedBy: actorName,
          rejectorRole: actorRole || "HR Manager",
          reason: "Candidate stage updated to Rejected",
          businessUnit: cand.job_postings?.branches?.name,
        }).catch((e) => console.error("[notifyRejected candidate] error:", e));
      }
    }
  } catch (err) {
    console.warn("Could not dispatch stage transition notification:", err);
  }
}
