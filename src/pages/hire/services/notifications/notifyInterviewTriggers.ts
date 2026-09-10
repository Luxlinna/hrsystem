import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { sendDualRecruitmentNotification } from "./recruitmentNotifyEngine";

export interface InterviewNotifyParams {
  isCompleted: boolean;
  candidateName: string;
  candidateId: string;
  jobTitle: string;
  interviewType: string;
  actorName: string;
  scheduledAt?: string;
  score?: number;
  recruiterEmployeeId?: string | null;
  recruiterName?: string | null;
  interviewerUserId?: string | null;
}

/**
 * Event 4: Interview scheduled or completed (including booked directly by Hiring Manager)
 */
export async function notifyInterviewScheduledOrCompleted(params: InterviewNotifyParams): Promise<void> {
  const { isCompleted, candidateName, candidateId, jobTitle, interviewType, actorName, scheduledAt, score, recruiterEmployeeId, recruiterName, interviewerUserId } = params;

  const dateStr = scheduledAt ? new Date(scheduledAt).toLocaleString() : "";
  const title = isCompleted
    ? `📝 Interview Completed: ${candidateName}`
    : `📅 Interview Scheduled: ${candidateName}`;

  const approverMsg = isCompleted
    ? `${actorName} completed interview for ${candidateName} (${jobTitle}) with rating ${score || "n/a"}/5.`
    : `Interview (${interviewType}) scheduled with ${candidateName} for ${jobTitle} on ${dateStr}.`;

  const recruiterMsg = isCompleted
    ? `Evaluation ready: ${candidateName} interview was completed by ${actorName}. Score: ${score || "n/a"}/5.`
    : `Interview booked: ${candidateName} (${jobTitle}) scheduled for ${dateStr} by ${actorName}.`;

  await sendDualRecruitmentNotification({
    title,
    approverMessage: approverMsg,
    recruiterMessage: recruiterMsg,
    type: isCompleted ? "success" : "info",
    entityId: candidateId,
    approverUserId: interviewerUserId || null,
    recruiterEmployeeId: recruiterEmployeeId || null,
    recruiterName: recruiterName || null,
    telegramHtml:
      (isCompleted ? `✅ <b>Interview Evaluation Completed</b>\n` : `📅 <b>Interview Scheduled</b>\n`) +
      `👤 <b>Candidate:</b> ${escapeTelegramHtml(candidateName)}\n` +
      `💼 <b>Role:</b> ${escapeTelegramHtml(jobTitle)}\n` +
      `👔 <b>Interviewer / Scheduler:</b> ${escapeTelegramHtml(actorName)}\n` +
      (scheduledAt ? `🕒 <b>Time:</b> ${escapeTelegramHtml(dateStr)}\n` : "") +
      (score !== undefined ? `⭐ <b>Score:</b> ${score}/5\n` : "") +
      (recruiterName ? `🎯 <b>Assigned Recruiter:</b> ${escapeTelegramHtml(recruiterName)}` : ""),
    telegramButtonText: "View Candidate Details",
    telegramUrl: hrNexusUrl(`/hire/candidate/${candidateId}`),
  });
}
