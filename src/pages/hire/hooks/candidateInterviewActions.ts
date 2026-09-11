import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Interview, Candidate, Job, CandidateDocument } from "../types";
import { notifyInterviewScheduledOrCompleted } from "../services/notifications/recruitmentEventTriggers";
import { parseInterviewPanelFromNotes, isUserInvitedToInterview } from "../utils/interviewPanelHelper";

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

  const selectedInterviewerId = isUuid(interviewForm.interviewer_id)
    ? interviewForm.interviewer_id
    : isUuid(myEmployeeId)
    ? myEmployeeId
    : null;

  const payload = {
    candidate_id: interviewForm.candidate_id,
    scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
    duration_minutes: Number(interviewForm.duration_minutes) || 60,
    type: dbType,
    notes: interviewForm.notes || null,
    interviewer_id: selectedInterviewerId,
  };

  if (editingInterview) {
    const { error } = await supabase.from("interviews").update(payload).eq("id", editingInterview.id);
    if (error) throw error;
    toast("Interview Updated", "Interview details saved.", "success");
  } else {
    const { error } = await supabase.from("interviews").insert({
      ...payload,
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

  const panelIds = interviewForm.interviewer_ids || (selectedInterviewerId ? [selectedInterviewerId] : []);
  const panelNames = interviewForm.interviewer_names || (interviewForm.interviewer_name ? [interviewForm.interviewer_name] : []);

  await notifyInterviewScheduledOrCompleted({
    isCompleted: false,
    candidateName: matchedCand?.full_name || "Candidate",
    candidateId: interviewForm.candidate_id,
    jobTitle: matchedJob?.title || matchedCand?.job_postings?.title || "Role",
    interviewType: dbType,
    actorName,
    scheduledAt: payload.scheduled_at,
    recruiterEmployeeId: recruiterId,
    recruiterName,
    interviewerEmployeeId: selectedInterviewerId,
    interviewerName: interviewForm.interviewer_name || null,
    interviewerEmployeeIds: panelIds,
    interviewerNames: panelNames,
  });

  return true;
}

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
  const matchedCand = candidates.find((c) => c.id === interview.candidate_id);
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

export async function executeSaveInterviewEvaluation(params: {
  payload: {
    stageKey: string;
    evaluatorName: string;
    date: string;
    overallScore: number;
    recommendation: "strong_hire" | "advance" | "hold" | "reject";
    competencies: Record<string, number>;
    strengths: string;
    concerns: string;
    notes: string;
    interviewId?: string;
  };
  actorName: string;
  myEmployeeId?: string | null;
  isAdminOrRecruiter?: boolean;
  candidates?: Candidate[];
  jobs?: Job[];
  interview?: Interview | null;
}): Promise<boolean> {
  const { payload, actorName, myEmployeeId, isAdminOrRecruiter, candidates = [], jobs = [], interview } = params;

  const targetInterviewId = payload.interviewId || interview?.id;
  if (!targetInterviewId) {
    throw new Error("No target interview identified to record evaluation.");
  }

  // Match candidate to check authorization and attach audit evidence document
  const candidateId = interview?.candidate_id;
  let matchedCand = candidates.find((c) => c.id === candidateId);
  if (!matchedCand && candidateId) {
    const { data: cData } = await supabase
      .from("candidates")
      .select("*, job_postings(*, branches(*))")
      .eq("id", candidateId)
      .maybeSingle();
    if (cData) matchedCand = cData as Candidate;
  }

  // Enforce: Interviewer can feedback ONLY candidates that the recruiter invited them to interview
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

  const compSummary = Object.entries(payload.competencies || {})
    .map(([k, v]) => `${k}: ${v}/5`)
    .join(", ");

  const recLabel =
    {
      strong_hire: "Strong Hire",
      advance: "Advance to Next Round",
      hold: "On Hold / Re-evaluate",
      reject: "Do Not Proceed",
    }[payload.recommendation] || payload.recommendation;

  const stageMeta =
    {
      hr_interview: "Stage 4 • HR Interview",
      hiring_manager_interview: "Stage 5 • Technical Round",
      final_interview: "Stage 6 • Executive Round",
    }[payload.stageKey] || "Interview Evaluation";

  const formattedFeedback = [
    `[EVALUATION FORM: ${payload.stageKey.toUpperCase()}]`,
    `Evaluator: ${payload.evaluatorName}`,
    `Date: ${payload.date}`,
    `Recommendation: ${recLabel}`,
    `Score: ${payload.overallScore}/5`,
    `Competencies: ${compSummary}`,
    payload.strengths ? `Strengths: ${payload.strengths}` : null,
    payload.concerns ? `Concerns: ${payload.concerns}` : null,
    `Remarks: ${payload.notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Merge multiple evaluators' feedback if panel has multiple interviewers
  const existingFeedback = interview?.feedback || "";
  let finalFeedback = formattedFeedback;
  let finalScore = payload.overallScore;

  if (existingFeedback.includes("[EVALUATION FORM:")) {
    const existingBlocks = existingFeedback
      .split(/\n\s*---\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);
    const cleanCurrentEvaluator = payload.evaluatorName.trim().toLowerCase();

    // Preserve evaluations by other panelists, replace/update this evaluator's evaluation
    const otherBlocks = existingBlocks.filter((b) => {
      const evalLine = b.split("\n").find((l) => l.toLowerCase().startsWith("evaluator:"));
      if (!evalLine) return true;
      const evalName = evalLine.replace(/evaluator:\s*/i, "").trim().toLowerCase();
      return (
        evalName !== cleanCurrentEvaluator &&
        !evalName.includes(cleanCurrentEvaluator) &&
        !cleanCurrentEvaluator.includes(evalName)
      );
    });

    const allBlocks = [...otherBlocks, formattedFeedback];
    finalFeedback = allBlocks.join("\n\n---\n\n");

    // Average overall score across all submitted panelists
    const scores: number[] = [];
    allBlocks.forEach((b) => {
      const m = b.match(/Score:\s*(\d+(\.\d+)?)/);
      if (m) scores.push(parseFloat(m[1]));
    });
    if (scores.length > 0) {
      finalScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    }
  }

  const { error } = await supabase
    .from("interviews")
    .update({
      score: finalScore,
      feedback: finalFeedback,
      status: "completed",
    })
    .eq("id", targetInterviewId);

  if (error) throw error;

  if (matchedCand) {
    const newEvidenceDoc: CandidateDocument = {
      name: `${stageMeta} - Evaluation Form`,
      url: `#evaluation-${payload.stageKey}`,
      size: 1024,
      type: "application/pdf",
      uploaded_at: new Date().toISOString(),
      stage_key: payload.stageKey,
      notes: `Score: ${payload.overallScore}/5 • Rec: ${recLabel} • Evaluator: ${payload.evaluatorName}`,
    };

    const existingDocs = (matchedCand.documents || []).filter((d) => d.stage_key !== payload.stageKey);
    const updatedDocs = [...existingDocs, newEvidenceDoc];

    await supabase
      .from("candidates")
      .update({ documents: updatedDocs })
      .eq("id", matchedCand.id);
  }

  toast("Evaluation Form Recorded", `${stageMeta} verified and audit evidence attached.`, "success");

  // Notifications
  const matchedJob = jobs.find((j) => j.id === matchedCand?.job_posting_id);
  const recruiterId = matchedCand?.assigned_recruiter_id || null;
  const recruiterName = matchedCand?.assigned_recruiter
    ? `${matchedCand.assigned_recruiter.first_name} ${matchedCand.assigned_recruiter.last_name}`
    : null;

  const panelInfo = interview?.notes ? parseInterviewPanelFromNotes(interview.notes) : null;
  const panelNames = panelInfo?.panelMembers?.length
    ? panelInfo.panelMembers.map((m) => m.name)
    : interview?.employees
    ? [`${interview.employees.first_name} ${interview.employees.last_name}`.trim()]
    : [payload.evaluatorName];

  const panelIds = panelInfo?.panelIds?.length
    ? panelInfo.panelIds
    : interview?.interviewer_id
    ? [interview.interviewer_id]
    : [];

  await notifyInterviewScheduledOrCompleted({
    isCompleted: true,
    candidateName: matchedCand?.full_name || interview?.candidates?.full_name || "Candidate",
    candidateId: matchedCand?.id || interview?.candidate_id || "",
    jobTitle: matchedJob?.title || interview?.candidates?.job_postings?.title || "Role",
    interviewType: interview?.type || "Interview",
    actorName: payload.evaluatorName || actorName,
    score: payload.overallScore,
    recruiterEmployeeId: recruiterId,
    recruiterName,
    interviewerEmployeeId: interview?.interviewer_id || null,
    interviewerName: payload.evaluatorName,
    interviewerEmployeeIds: panelIds,
    interviewerNames: panelNames,
  });

  return true;
}

