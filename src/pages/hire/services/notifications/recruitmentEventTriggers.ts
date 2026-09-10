import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { sendDualRecruitmentNotification } from "./recruitmentNotifyEngine";
import type { HiringRequest } from "../../types";

export { notifyInterviewScheduledOrCompleted } from "./notifyInterviewTriggers";
export type { InterviewNotifyParams } from "./notifyInterviewTriggers";

/**
 * Event 1: Stage transition on any requisition (Branch Review -> HR Review -> Chairman Review)
 */
export async function notifyStageTransition(
  req: HiringRequest,
  nextStageLabel: string,
  approverRoleLabel: string,
  actorName: string,
  actorRole: string,
  targetBranchId?: string | null
): Promise<void> {
  const reqCode = req.requisition_id ? `[${req.requisition_id}] ` : "";
  const recruiterId = req.assigned_recruiter_id || req.hr_assigned_to_id || null;
  const recruiterName = req.assigned_recruiter_name || req.hr_assigned_to_name || "Assigned Recruiter";

  await sendDualRecruitmentNotification({
    title: `📋 Stage Transition: ${reqCode}${req.title}`,
    approverMessage: `${actorName} advanced requisition ${reqCode}${req.title} to ${nextStageLabel}. Review required by ${approverRoleLabel}.`,
    recruiterMessage: `Requisition ${reqCode}${req.title} advanced to ${nextStageLabel} by ${actorName}. Reviewing authority: ${approverRoleLabel}.`,
    type: "info",
    entityId: req.id,
    approverBranchId: targetBranchId ?? null,
    recruiterEmployeeId: recruiterId,
    recruiterName,
    telegramHtml:
      `🔄 <b>Stage Transition: ${escapeTelegramHtml(reqCode)}${escapeTelegramHtml(req.title)}</b>\n` +
      `⏩ <b>New Stage:</b> ${escapeTelegramHtml(nextStageLabel)} (${escapeTelegramHtml(approverRoleLabel)})\n` +
      `👤 <b>Updated By:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
      `🎯 <b>Recruiter:</b> ${escapeTelegramHtml(recruiterName)}`,
    telegramButtonText: "Review Stage",
    auditAction: "stage_transition",
    actorName,
    actorRole,
    description: `Requisition ${reqCode}${req.title} advanced to ${nextStageLabel} by ${actorName}`,
  });
}

/**
 * Event 2: Full requisition approval (Recruiter's trigger to begin sourcing and post the job)
 */
export async function notifyFullRequisitionApproval(
  req: HiringRequest,
  actorName: string,
  actorRole: string,
  jobPostingId?: string | null
): Promise<void> {
  const reqCode = req.requisition_id ? `[${req.requisition_id}] ` : "";
  const recruiterId = req.assigned_recruiter_id || req.hr_assigned_to_id || null;
  const recruiterName = req.assigned_recruiter_name || req.hr_assigned_to_name || "Assigned Recruiter";

  await sendDualRecruitmentNotification({
    title: `🎉 Requisition Approved: ${reqCode}${req.title}`,
    approverMessage: `${actorName} fully authorized requisition ${reqCode}${req.title}. Job posting is now live!`,
    recruiterMessage: `🚀 Sourcing Trigger: Requisition ${reqCode}${req.title} is FULLY APPROVED! You can now begin active talent sourcing and publish postings.`,
    type: "success",
    entityId: req.id,
    approverBranchId: req.branch_id || null,
    recruiterEmployeeId: recruiterId,
    recruiterName,
    telegramHtml:
      `🎉 <b>Requisition Fully Authorized & Live!</b>\n` +
      `💼 <b>Position:</b> ${escapeTelegramHtml(reqCode)}${escapeTelegramHtml(req.title)} (${req.headcount} headcount)\n` +
      `🏢 <b>Department:</b> ${escapeTelegramHtml(req.department)}\n` +
      `👤 <b>Authorized By:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
      `🎯 <b>Assigned Recruiter:</b> ${escapeTelegramHtml(recruiterName)}\n` +
      `🚀 <b>Recruiter Action:</b> Begin candidate sourcing & review live applications.`,
    telegramButtonText: "View Live Requisition",
    telegramUrl: hrNexusUrl("/hire"),
    auditAction: "authorized",
    actorName,
    actorRole,
    description: `Requisition ${reqCode}${req.title} authorized by ${actorName}. Recruiter sourcing triggered. Job ID: ${jobPostingId || "n/a"}`,
  });
}

/**
 * Event 3: New candidate application registered
 */
export async function notifyNewCandidateApplication(params: {
  candidateName: string;
  candidateId: string;
  jobTitle: string;
  source: string;
  recruiterEmployeeId?: string | null;
  recruiterName?: string | null;
  hiringManagerUserId?: string | null;
  branchId?: string | null;
}): Promise<void> {
  const { candidateName, candidateId, jobTitle, source, recruiterEmployeeId, recruiterName, hiringManagerUserId, branchId } = params;

  await sendDualRecruitmentNotification({
    title: `👤 New Candidate: ${candidateName}`,
    approverMessage: `New application received for ${jobTitle} from ${source}. Ready for initial screening.`,
    recruiterMessage: `📥 Candidate Alert: ${candidateName} applied for ${jobTitle} via ${source}. Begin CV review and screening.`,
    type: "info",
    entityId: candidateId,
    approverUserId: hiringManagerUserId || null,
    approverBranchId: branchId || null,
    recruiterEmployeeId: recruiterEmployeeId || null,
    recruiterName: recruiterName || null,
    telegramHtml:
      `📥 <b>New Candidate Application</b>\n` +
      `👤 <b>Candidate:</b> ${escapeTelegramHtml(candidateName)}\n` +
      `💼 <b>Position:</b> ${escapeTelegramHtml(jobTitle)}\n` +
      `🌐 <b>Source:</b> ${escapeTelegramHtml(source)}\n` +
      (recruiterName ? `🎯 <b>Assigned Recruiter:</b> ${escapeTelegramHtml(recruiterName)}` : ""),
    telegramButtonText: "Screen Candidate",
    telegramUrl: hrNexusUrl(`/hire/candidate/${candidateId}`),
  });
}

/**
 * Event 5: Requisition sent back for revision or rejected
 */
export async function notifyRequisitionRejectedOrRevised(
  req: HiringRequest,
  actorName: string,
  actorRole: string,
  reason: string,
  isRevision = false
): Promise<void> {
  const reqCode = req.requisition_id ? `[${req.requisition_id}] ` : "";
  const recruiterId = req.assigned_recruiter_id || req.hr_assigned_to_id || null;
  const recruiterName = req.assigned_recruiter_name || req.hr_assigned_to_name || "Assigned Recruiter";
  const actionLabel = isRevision ? "Sent Back for Revision" : "Rejected";

  await sendDualRecruitmentNotification({
    title: `⚠️ Requisition ${actionLabel}: ${reqCode}${req.title}`,
    approverMessage: `Requisition ${reqCode}${req.title} was ${actionLabel.toLowerCase()} by ${actorName} (${actorRole}). Reason: ${reason}`,
    recruiterMessage: `Pipeline Notice: Requisition ${reqCode}${req.title} was ${actionLabel.toLowerCase()} by ${actorName}. Reason: ${reason}`,
    type: "warning",
    entityId: req.id,
    approverBranchId: req.branch_id || null,
    recruiterEmployeeId: recruiterId,
    recruiterName,
    telegramHtml:
      `❌ <b>Requisition ${actionLabel}</b>\n` +
      `💼 <b>Position:</b> ${escapeTelegramHtml(reqCode)}${escapeTelegramHtml(req.title)}\n` +
      `👤 <b>Reviewed By:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
      `📝 <b>Reason:</b> ${escapeTelegramHtml(reason)}\n` +
      `🎯 <b>Recruiter:</b> ${escapeTelegramHtml(recruiterName)}`,
    telegramButtonText: "View Requisitions",
    auditAction: isRevision ? "revision_requested" : "rejected",
    actorName,
    actorRole,
    description: `Requisition ${reqCode}${req.title} ${actionLabel.toLowerCase()} by ${actorName}. Reason: ${reason}`,
  });
}
