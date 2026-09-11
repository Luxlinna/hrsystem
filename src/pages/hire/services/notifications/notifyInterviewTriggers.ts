import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { sendDualRecruitmentNotification } from "./recruitmentNotifyEngine";
import { resolveUserIdForEmployee } from "./recruitmentRecipients";
import { notify } from "@/lib/notify";

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
  interviewerEmployeeId?: string | null;
  interviewerName?: string | null;
  interviewerEmployeeIds?: string[];
  interviewerNames?: string[];
}

/**
 * Event 4: Interview scheduled or completed (including multiple invited interviewers from candidate's BU)
 */
export async function notifyInterviewScheduledOrCompleted(params: InterviewNotifyParams): Promise<void> {
  const {
    isCompleted,
    candidateName,
    candidateId,
    jobTitle,
    interviewType,
    actorName,
    scheduledAt,
    score,
    recruiterEmployeeId,
    recruiterName,
    interviewerUserId,
    interviewerEmployeeId,
    interviewerName,
    interviewerEmployeeIds = [],
    interviewerNames = [],
  } = params;

  // Aggregate all employee IDs & names without duplicates
  const allEmpIds = Array.from(
    new Set([
      ...interviewerEmployeeIds,
      ...(interviewerEmployeeId ? [interviewerEmployeeId] : []),
    ])
  ).filter(Boolean);

  const allNames = Array.from(
    new Set([
      ...interviewerNames,
      ...(interviewerName ? [interviewerName] : []),
    ])
  ).filter(Boolean);

  // Resolve user IDs for all invited employees
  const resolvedUserIds: string[] = [];
  if (interviewerUserId && !resolvedUserIds.includes(interviewerUserId)) {
    resolvedUserIds.push(interviewerUserId);
  }

  for (const empId of allEmpIds) {
    try {
      const uId = await resolveUserIdForEmployee({ employeeId: empId });
      if (uId && !resolvedUserIds.includes(uId)) {
        resolvedUserIds.push(uId);
      }
    } catch (e) {
      console.warn("Could not resolve user ID for invited employee:", empId, e);
    }
  }

  const primaryInterviewerUserId = resolvedUserIds[0] || null;

  const dateStr = scheduledAt ? new Date(scheduledAt).toLocaleString() : "";
  const title = isCompleted
    ? `📝 Interview Completed: ${candidateName}`
    : `📅 Interview Scheduled: ${candidateName}`;

  const approverMsg = isCompleted
    ? `${actorName} completed interview for ${candidateName} (${jobTitle}) with rating ${score || "n/a"}/5.`
    : `Interview (${interviewType}) scheduled with ${candidateName} for ${jobTitle} on ${dateStr}. You are invited to join the interview panel.`;

  const recruiterMsg = isCompleted
    ? `Evaluation ready: ${candidateName} interview was completed by ${actorName}. Score: ${score || "n/a"}/5.`
    : `Interview booked: ${candidateName} (${jobTitle}) scheduled for ${dateStr} by ${actorName}.`;

  // 1. Send primary dual notification (interviewer #1 + recruiter)
  await sendDualRecruitmentNotification({
    title,
    approverMessage: approverMsg,
    recruiterMessage: recruiterMsg,
    type: isCompleted ? "success" : "info",
    entityId: candidateId,
    approverUserId: primaryInterviewerUserId,
    recruiterEmployeeId: recruiterEmployeeId || null,
    recruiterName: recruiterName || null,
    telegramHtml:
      (isCompleted ? `✅ <b>Interview Evaluation Completed</b>\n` : `📅 <b>Interview Scheduled</b>\n`) +
      `👤 <b>Candidate:</b> ${escapeTelegramHtml(candidateName)}\n` +
      `💼 <b>Role:</b> ${escapeTelegramHtml(jobTitle)}\n` +
      (allNames.length > 1
        ? `👥 <b>Invited BU Panel (${allNames.length}):</b> ${allNames.map((n) => escapeTelegramHtml(n)).join(", ")}\n`
        : allNames.length === 1
        ? `👔 <b>BU Interviewer:</b> ${escapeTelegramHtml(allNames[0])}\n`
        : `👔 <b>Interviewer:</b> ${escapeTelegramHtml(actorName)}\n`) +
      (recruiterName ? `🤝 <b>Recruiter / Co-Host:</b> ${escapeTelegramHtml(recruiterName)}\n` : "") +
      (scheduledAt ? `🕒 <b>Time:</b> ${escapeTelegramHtml(dateStr)}\n` : "") +
      (score !== undefined ? `⭐ <b>Score:</b> ${score}/5\n` : ""),
    telegramButtonText: "View Candidate Details",
    telegramUrl: hrNexusUrl(`/hire/candidate/${candidateId}`),
  });

  // 2. Alert all additional invited employees in the system
  for (let i = 1; i < resolvedUserIds.length; i++) {
    const additionalUserId = resolvedUserIds[i];
    if (additionalUserId) {
      await notify({
        title,
        message: approverMsg,
        type: isCompleted ? "success" : "info",
        source: "hire",
        entityId: candidateId || null,
        recipientUserId: additionalUserId,
        skipTelegram: true,
      });
    }
  }
}

