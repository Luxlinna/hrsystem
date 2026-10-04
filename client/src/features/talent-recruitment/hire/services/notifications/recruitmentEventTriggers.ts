import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { sendDualRecruitmentNotification } from "./recruitmentNotifyEngine";
import {
  notifyApprovalPending,
  notifyRevisionRequested,
  notifyRejected,
  notifyCvReviewRequired,
} from "@/services/notifications/recruitmentNotificationTriggers";
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
  targetBranchId?: string | null,
  options?: {
    isCrossBu?: boolean;
    businessUnit?: string | null;
    targetBusinessUnit?: string | null;
    description?: string;
    auditAction?: string;
  }
): Promise<void> {
  const reqCode = req.requisition_id ? `[${req.requisition_id}] ` : "";
  const recruiterId = req.assigned_recruiter_id || req.hr_assigned_to_id || null;
  const recruiterName = req.assigned_recruiter_name || req.hr_assigned_to_name || "Assigned Recruiter";
  const buName = options?.businessUnit || req.branches?.name || req.division || "Business Unit";

  // Canonical Notification Engine Dispatch
  await notifyApprovalPending({
    entityType: "hiring_request",
    entityId: req.id,
    entityCode: req.requisition_id || "REQ",
    entityTitle: req.title,
    approverRole: approverRoleLabel,
    actorName,
    actorRole,
    businessUnit: buName,
    targetBusinessUnit: options?.targetBusinessUnit ?? undefined,
    isCrossBu: options?.isCrossBu,
    branchId: targetBranchId ?? req.branch_id ?? null,
    actionUrl: `/hire?tab=requisitions&id=${req.id}`,
  }).catch((err) => console.error("[notifyStageTransition] canonical notify error:", err));

  await sendDualRecruitmentNotification({
    title: `📋 Stage Transition: ${reqCode}${req.title}`,
    approverMessage: `${actorName} advanced requisition ${reqCode}${req.title} to ${nextStageLabel}. Review required by ${approverRoleLabel}.`,
    recruiterMessage: `Requisition ${reqCode}${req.title} advanced to ${nextStageLabel} by ${actorName}. Reviewing authority: ${approverRoleLabel}.`,
    type: "info",
    entityId: req.id,
    approverBranchId: targetBranchId ?? req.branch_id ?? null,
    recruiterEmployeeId: recruiterId,
    recruiterName,
    businessUnit: buName,
    targetBusinessUnit: options?.targetBusinessUnit,
    isCrossBu: options?.isCrossBu,
    telegramHtml:
      `🔄 <b>Stage Transition: ${escapeTelegramHtml(reqCode)}${escapeTelegramHtml(req.title)}</b>\n` +
      `⏩ <b>New Stage:</b> ${escapeTelegramHtml(nextStageLabel)} (${escapeTelegramHtml(approverRoleLabel)})\n` +
      `👤 <b>Updated By:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
      `🎯 <b>Recruiter:</b> ${escapeTelegramHtml(recruiterName)}`,
    telegramButtonText: "Review Stage",
    auditAction: options?.auditAction || "stage_transition",
    actorName,
    actorRole,
    description:
      options?.description ||
      `Requisition ${reqCode}${req.title} advanced to ${nextStageLabel} by ${actorName} (${buName})`,
  });
}

/**
 * Event 2: Full requisition approval (Recruiter's trigger to begin sourcing and post the job)
 */
export async function notifyFullRequisitionApproval(
  req: HiringRequest,
  actorName: string,
  actorRole: string,
  jobPostingId?: string | null,
  options?: {
    isCrossBu?: boolean;
    businessUnit?: string | null;
    description?: string;
  }
): Promise<void> {
  const reqCode = req.requisition_id ? `[${req.requisition_id}] ` : "";
  const recruiterId = req.assigned_recruiter_id || req.hr_assigned_to_id || null;
  const recruiterName = req.assigned_recruiter_name || req.hr_assigned_to_name || "Assigned Recruiter";
  const buName = options?.businessUnit || req.branches?.name || req.division || "Business Unit";

  await sendDualRecruitmentNotification({
    title: `🎉 Requisition Approved: ${reqCode}${req.title}`,
    approverMessage: `${actorName} fully authorized requisition ${reqCode}${req.title}. Job posting is now live!`,
    recruiterMessage: `🚀 Sourcing Trigger: Requisition ${reqCode}${req.title} is FULLY APPROVED! You can now begin active talent sourcing and publish postings.`,
    type: "success",
    entityId: req.id,
    approverBranchId: req.branch_id || null,
    recruiterEmployeeId: recruiterId,
    recruiterName,
    businessUnit: buName,
    isCrossBu: options?.isCrossBu,
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
    description:
      options?.description ||
      `${actorName} (${actorRole}) approved requisition ${req.requisition_id || req.title}. Business Unit: ${buName}. Recruiter sourcing triggered.`,
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

  // Canonical Notification Engine Dispatch
  await notifyCvReviewRequired({
    candidate: { id: candidateId, full_name: candidateName },
    jobTitle,
    source,
    reviewerRole: "Recruiter / Hiring Manager",
    businessUnit: "OPS Solutions Co ., Ltd",
  }).catch((err) => console.error("[notifyNewCandidateApplication] canonical notify error:", err));

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
  const buName = req.branches?.name || req.division || "Business Unit";

  // Canonical Notification Engine Dispatch
  if (isRevision) {
    await notifyRevisionRequested({
      entityType: "hiring_request",
      entityId: req.id,
      entityCode: req.requisition_id || "REQ",
      entityTitle: req.title,
      requestedBy: actorName,
      requestorRole: actorRole,
      reason,
      businessUnit: buName,
      branchId: req.branch_id || null,
      actionUrl: `/hire?tab=requisitions&id=${req.id}`,
    }).catch((err) => console.error("[notifyRequisitionRejectedOrRevised] canonical notify error:", err));
  } else {
    await notifyRejected({
      entityType: "hiring_request",
      entityId: req.id,
      entityCode: req.requisition_id || "REQ",
      entityTitle: req.title,
      rejectedBy: actorName,
      rejectorRole: actorRole,
      reason,
      businessUnit: buName,
      branchId: req.branch_id || null,
    }).catch((err) => console.error("[notifyRequisitionRejectedOrRevised] canonical notify error:", err));
  }

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
