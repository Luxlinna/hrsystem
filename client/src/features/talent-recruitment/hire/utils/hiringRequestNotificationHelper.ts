import { supabase } from "@/lib/supabase";
import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { sendDualRecruitmentNotification } from "../services/notifications/recruitmentNotifyEngine";
import { notifyRequisitionSubmitted } from "@/services/notifications/recruitmentNotificationTriggers";
import { notifyStageTransition } from "../services/notifications/recruitmentEventTriggers";

export interface NotifyHiringRequestCreatedParams {
  data: any;
  payload: any;
  reqCode: string;
  effectiveBranchName: string;
  isBuCeoAdmin: boolean;
  actorName: string;
  actorRole: string;
  assignedRecruiterId: string | null;
  assignedRecruiterName: string | null;
  resolvedBranchId: string | null;
}

export async function notifyHiringRequestCreated(params: NotifyHiringRequestCreatedParams) {
  const {
    data,
    payload,
    reqCode,
    effectiveBranchName,
    isBuCeoAdmin,
    actorName,
    actorRole,
    assignedRecruiterId,
    assignedRecruiterName,
    resolvedBranchId,
  } = params;

  // Find HR Branch for routing notifications to HR Division
  const { data: hrBranch } = await supabase
    .from("branches")
    .select("id, name")
    .ilike("name", "%HR%")
    .is("deleted_at", null)
    .maybeSingle();

  if (isBuCeoAdmin) {
    // Stage 1 is auto-endorsed by the BU CEO creator. Route directly to HR Manager at HR Division.
    await sendDualRecruitmentNotification({
      title: `📋 New Requisition: ${reqCode}${payload.title}`,
      approverMessage: `${actorName} created and endorsed requisition ${reqCode}${payload.title} (${payload.headcount} headcount in ${payload.department}, ${effectiveBranchName}). Forwarded to HR Division for HR Manager review.`,
      recruiterMessage: `New Requisition Created: ${reqCode}${payload.title} (${payload.department} · ${effectiveBranchName}) by BU CEO ${actorName}. Forwarded to HR Manager. Standing subscription active.`,
      type: "info",
      entityId: data?.id,
      approverBranchId: hrBranch?.id || null,
      recruiterEmployeeId: assignedRecruiterId,
      recruiterName: assignedRecruiterName,
      telegramHtml:
        `📋 <b>New Hiring Requisition ${escapeTelegramHtml(reqCode)}</b>\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(payload.title)} (${payload.headcount} opening${payload.headcount > 1 ? "s" : ""})\n` +
        `🏢 <b>Department:</b> ${escapeTelegramHtml(payload.department)}\n` +
        `📍 <b>Location/Branch:</b> ${escapeTelegramHtml(payload.location || effectiveBranchName)}\n` +
        `👤 <b>Requester / BU CEO:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
        `✍️ <b>Stage 1:</b> Endorsed by BU CEO\n` +
        `🎯 <b>Assigned Recruiter:</b> ${escapeTelegramHtml(assignedRecruiterName || "Recruiter")}\n` +
        `⚡ <b>Priority:</b> ${escapeTelegramHtml(payload.urgency.toUpperCase())}\n` +
        `🎯 <b>Next Action:</b> HR Manager Review (HR Division)`,
      telegramButtonText: "Review Requisition",
      telegramUrl: hrNexusUrl("/hire"),
      auditAction: "requisition_created_bu_ceo",
      actorName,
      actorRole,
      description: `Hiring requisition submitted & endorsed by BU CEO: ${reqCode}${payload.headcount}x ${payload.title} (${payload.department}) for ${effectiveBranchName}. Routed to HR Manager.`,
    });

    try {
      await notifyStageTransition(
        data,
        "HR Manager Review",
        "HR Manager",
        actorName,
        actorRole,
        hrBranch?.id || null,
        {
          businessUnit: effectiveBranchName,
          targetBusinessUnit: "HR Division",
          isCrossBu: effectiveBranchName !== "HR Division",
          auditAction: "requisition_bu_ceo_submitted",
          description: `${actorName} (${actorRole}) created and endorsed requisition ${reqCode}${payload.title} for ${effectiveBranchName}. Moved to HR Manager Review.`,
        }
      );
    } catch {
      // Non-fatal
    }
  } else {
    // Normal Manager submission: awaits Stage 1 Branch Leadership / BU CEO review
    await sendDualRecruitmentNotification({
      title: `📋 New Requisition: ${reqCode}${payload.title}`,
      approverMessage: `${actorName} requested ${payload.headcount} headcount in ${payload.department} (${effectiveBranchName}). Awaiting branch endorsement.`,
      recruiterMessage: `New Requisition Created: ${reqCode}${payload.title} (${payload.department} · ${effectiveBranchName}). Standing subscription active.`,
      type: "info",
      entityId: data?.id,
      approverBranchId: resolvedBranchId,
      recruiterEmployeeId: assignedRecruiterId,
      recruiterName: assignedRecruiterName,
      telegramHtml:
        `📋 <b>New Hiring Requisition ${escapeTelegramHtml(reqCode)}</b>\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(payload.title)} (${payload.headcount} opening${payload.headcount > 1 ? "s" : ""})\n` +
        `🏢 <b>Department:</b> ${escapeTelegramHtml(payload.department)}\n` +
        `📍 <b>Location/Branch:</b> ${escapeTelegramHtml(payload.location || effectiveBranchName)}\n` +
        `👤 <b>Requester:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
        `🎯 <b>Assigned Recruiter:</b> ${escapeTelegramHtml(assignedRecruiterName || "Recruiter")}\n` +
        `⚡ <b>Priority:</b> ${escapeTelegramHtml(payload.urgency.toUpperCase())}\n` +
        `🎯 <b>Next Action:</b> Branch Review & Endorsement`,
      telegramButtonText: "Review Requisition",
      telegramUrl: hrNexusUrl("/hire"),
      auditAction: "created",
      actorName,
      actorRole,
      description: `Hiring requisition submitted: ${reqCode}${payload.headcount}x ${payload.title} (${payload.department}) for ${effectiveBranchName}`,
    });

    try {
      await notifyRequisitionSubmitted({
        requisition: data as any,
        submittedBy: actorName,
        submitterRole: actorRole,
        businessUnit: effectiveBranchName,
      });
    } catch {
      // Non-fatal
    }
  }
}
