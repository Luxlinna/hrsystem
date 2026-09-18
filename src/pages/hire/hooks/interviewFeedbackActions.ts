import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Interview, Candidate, Job } from "../types";
import { notifyInterviewScheduledOrCompleted } from "../services/notifications/recruitmentEventTriggers";
import { isUserInvitedToInterview } from "../utils/interviewPanelHelper";

export async function executeSaveFeedback(params: {
  interview: Interview;
  score: number;
  notes: string;
  actorName: string;
  myEmployeeId?: string | null;
  isAdminOrRecruiter?: boolean;
  candidates?: Candidate[];
  jobs?: Job[];
}): Promise<boolean> {
  const { interview, score, notes, actorName, myEmployeeId, isAdminOrRecruiter, candidates = [], jobs = [] } = params;

  // Enforce: Interviewer can feedback ONLY candidates that the recruiter invited them to interview
  const matchedCand = candidates.find((c) => c.id === interview.candidate_id);
  const canFeedback = isUserInvitedToInterview({
    interview,
    candidate: matchedCand,
    myEmployeeId,
    actorName,
    isAdminOrRecruiter,
  });

  if (!canFeedback) {
    throw new Error("Access Restricted: You can only submit feedback for candidates you were invited to interview by the recruiter.");
  }

  const { error } = await supabase
    .from("interviews")
    .update({ score, feedback: notes || null, status: "completed" })
    .eq("id", interview.id);
  if (error) throw error;

  toast("Feedback Submitted", "Interview feedback recorded.", "success");

  // Dual standing notification: Hiring Manager / Evaluator + Assigned Recruiter
  const matchedJob = jobs.find((j) => j.id === matchedCand?.job_posting_id);
  const recruiterId = matchedCand?.assigned_recruiter_id || null;
  const recruiterName = matchedCand?.assigned_recruiter
    ? `${matchedCand.assigned_recruiter.first_name} ${matchedCand.assigned_recruiter.last_name}`
    : null;

  // Extract panel interviewers from interview notes if present
  const panelMatch = (interview.notes || "").match(/\[Panel:\s*(.*?)\]/i);
  const feedbackPanelNames = panelMatch
    ? panelMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    : interview.employees
    ? [`${interview.employees.first_name} ${interview.employees.last_name}`.trim()]
    : [];

  const panelIdsMatch = (interview.notes || "").match(/\[PanelIds:\s*(.*?)\]/i);
  const feedbackPanelIds = panelIdsMatch
    ? panelIdsMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
    : interview.interviewer_id
    ? [interview.interviewer_id]
    : [];

  await notifyInterviewScheduledOrCompleted({
    isCompleted: true,
    candidateName: matchedCand?.full_name || interview.candidates?.full_name || "Candidate",
    candidateId: interview.candidate_id,
    jobTitle: matchedJob?.title || interview.candidates?.job_postings?.title || "Role",
    interviewType: interview.type || "Interview",
    actorName,
    score,
    recruiterEmployeeId: recruiterId,
    recruiterName,
    interviewerEmployeeId: interview.interviewer_id || null,
    interviewerName: feedbackPanelNames[0] || null,
    interviewerEmployeeIds: feedbackPanelIds,
    interviewerNames: feedbackPanelNames,
  });

  return true;
}
