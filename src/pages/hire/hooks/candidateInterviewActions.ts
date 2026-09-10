import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Interview, Candidate, Job } from "../types";
import { notifyInterviewScheduledOrCompleted } from "../services/notifications/recruitmentEventTriggers";

const isUuid = (str?: string | null) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export async function executeSaveInterview(params: {
  interviewForm: any;
  editingInterview: Interview | null;
  myEmployeeId?: string;
  actorName: string;
  candidates?: Candidate[];
  jobs?: Job[];
}): Promise<boolean> {
  const { interviewForm, editingInterview, myEmployeeId, actorName, candidates = [], jobs = [] } = params;

  if (!interviewForm.candidate_id || !interviewForm.scheduled_at) {
    toast("Validation Error", "Candidate and date/time are required.", "error");
    return false;
  }

  const dbType = ["video", "in-person", "phone"].includes(interviewForm.type)
    ? interviewForm.type
    : "video";

  const payload = {
    candidate_id: interviewForm.candidate_id,
    scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
    duration_minutes: Number(interviewForm.duration_minutes) || 60,
    type: dbType,
    notes: interviewForm.notes || null,
  };

  if (editingInterview) {
    const { error } = await supabase.from("interviews").update(payload).eq("id", editingInterview.id);
    if (error) throw error;
    toast("Interview Updated", "Interview details saved.", "success");
  } else {
    const { error } = await supabase.from("interviews").insert({
      ...payload,
      interviewer_id: isUuid(myEmployeeId) ? myEmployeeId : null,
      status: "scheduled",
    });
    if (error) throw error;
    toast("Interview Scheduled", "Interview scheduled successfully.", "success");
  }

  // Dual standing notification: Interviewer / Hiring Manager + Assigned Recruiter
  const matchedCand = candidates.find((c) => c.id === interviewForm.candidate_id);
  const matchedJob = jobs.find((j) => j.id === matchedCand?.job_posting_id);
  const recruiterId = matchedCand?.assigned_recruiter_id || null;
  const recruiterName = matchedCand?.assigned_recruiter
    ? `${matchedCand.assigned_recruiter.first_name} ${matchedCand.assigned_recruiter.last_name}`
    : null;

  await notifyInterviewScheduledOrCompleted({
    isCompleted: false,
    candidateName: matchedCand?.full_name || "Candidate",
    candidateId: interviewForm.candidate_id,
    jobTitle: matchedJob?.title || "Role",
    interviewType: dbType,
    actorName,
    scheduledAt: payload.scheduled_at,
    recruiterEmployeeId: recruiterId,
    recruiterName,
  });

  return true;
}

export async function executeSaveFeedback(params: {
  interview: Interview;
  score: number;
  notes: string;
  actorName: string;
  candidates?: Candidate[];
  jobs?: Job[];
}): Promise<boolean> {
  const { interview, score, notes, actorName, candidates = [], jobs = [] } = params;

  const { error } = await supabase
    .from("interviews")
    .update({ score, feedback: notes || null, status: "completed" })
    .eq("id", interview.id);
  if (error) throw error;

  toast("Feedback Submitted", "Interview feedback recorded.", "success");

  // Dual standing notification: Hiring Manager / Evaluator + Assigned Recruiter
  const matchedCand = candidates.find((c) => c.id === interview.candidate_id);
  const matchedJob = jobs.find((j) => j.id === matchedCand?.job_posting_id);
  const recruiterId = matchedCand?.assigned_recruiter_id || null;
  const recruiterName = matchedCand?.assigned_recruiter
    ? `${matchedCand.assigned_recruiter.first_name} ${matchedCand.assigned_recruiter.last_name}`
    : null;

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
  });

  return true;
}
