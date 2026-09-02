import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { HiringRequest } from "../types";

export async function sendStage1BranchEndorsementNotify(
  targetRequest: HiringRequest,
  actorName: string,
  actorRole: string,
  originatingBranch: string,
  hrBranchId: string | null
) {
  await notify({
    title: `📋 HR Manager Review Required (${targetRequest.title})`,
    message: `${actorName} endorsed ${targetRequest.headcount}x ${targetRequest.title} from ${originatingBranch}. Forwarded to HR Manager for review.`,
    type: "info",
    source: "hire",
    entityId: targetRequest.id,
    branch_id: hrBranchId,
  });

  notifyTelegramEvent(
    `🏢 <b>Branch Endorsement: ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)} · ${escapeTelegramHtml(originatingBranch)})</b>\n` +
    `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
    `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
    `📍 <b>Branch:</b> ${escapeTelegramHtml(originatingBranch)}\n` +
    `⏩ <b>Next Step:</b> In HR Manager Review.`,
    { text: "Review in HR Division", url: hrNexusUrl("/hire") }
  );
}

export async function sendStage2HrReviewNotify(
  targetRequest: HiringRequest,
  actorName: string,
  actorRole: string,
  currentBranch: string,
  originatingBranch: string,
  hrBranchId: string | null
) {
  await notify({
    title: `📋 HR Division Admin Approval Required (${targetRequest.title})`,
    message: `HR Manager ${actorName} reviewed and endorsed ${targetRequest.title} (${originatingBranch}). Awaiting HR Division Admin approval.`,
    type: "info",
    source: "hire",
    entityId: targetRequest.id,
    branch_id: hrBranchId,
  });

  notifyTelegramEvent(
    `📑 <b>HR Manager Review: ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)} · ${escapeTelegramHtml(currentBranch)})</b>\n` +
    `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
    `📍 <b>Branch:</b> ${escapeTelegramHtml(originatingBranch)}\n` +
    `⏩ <b>Next Step:</b> Awaiting HR Division Admin Approval.`,
    { text: "Review as HR Admin", url: hrNexusUrl("/hire") }
  );
}

export async function sendStage3HrAdminApprovalNotify(
  targetRequest: HiringRequest,
  actorName: string,
  actorRole: string,
  currentBranch: string,
  originatingBranch: string
) {
  await notify({
    title: `👑 Chairman Authorization Required (${targetRequest.title})`,
    message: `HR Division Admin ${actorName} approved ${targetRequest.title} (${originatingBranch}). Awaiting Chairman final executive authorization.`,
    type: "warning",
    source: "hire",
    entityId: targetRequest.id,
    branch_id: null,
  });

  notifyTelegramEvent(
    `🏛️ <b>HR Admin Approval: ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)} · ${escapeTelegramHtml(currentBranch)})</b>\n` +
    `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
    `📍 <b>Branch:</b> ${escapeTelegramHtml(originatingBranch)}\n` +
    `⏩ <b>Next Step:</b> Awaiting Executive Chairman Final Authorization.`,
    { text: "Review as Chairman", url: hrNexusUrl("/hire") }
  );
}

export async function sendStage4ChairmanAuthorizedNotify(
  targetRequest: HiringRequest,
  actorName: string,
  actorRole: string,
  originatingBranch: string
) {
  await notify({
    title: `🎉 Requisition Authorized by Chairman: ${targetRequest.title}`,
    message: `Chairman ${actorName} fully authorized the hiring request for ${originatingBranch}. Live recruitment posting is now active!`,
    type: "success",
    source: "hire",
    entityId: targetRequest.id,
    branch_id: targetRequest.branch_id || null,
  });

  notifyTelegramEvent(
    `👑 <b>Authorized by Chairman: ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})</b>\n` +
    `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
    `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
    `📍 <b>Branch:</b> ${escapeTelegramHtml(originatingBranch)}\n` +
    `📢 <b>Outcome:</b> Live Job Opening published on recruitment portal.`,
    { text: "View Live Job", url: hrNexusUrl("/hire") }
  );
}

export async function sendRejectionNotify(
  targetRequest: HiringRequest,
  actorName: string,
  actorRole: string,
  rejectionReason: string,
  branchName: string
) {
  await notify({
    title: `❌ Requisition Declined: ${targetRequest.title}`,
    message: `Hiring requisition for ${branchName} was declined by ${actorName} (${actorRole}). Reason: ${rejectionReason}`,
    type: "warning",
    source: "hire",
    entityId: targetRequest.id,
    branch_id: targetRequest.branch_id || null,
  });

  notifyTelegramEvent(
    `❌ <b>Hiring Requisition Rejected (${escapeTelegramHtml(actorRole)})</b>\n` +
    `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)}\n` +
    `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
    `📍 <b>Branch:</b> ${escapeTelegramHtml(branchName)}\n` +
    `👤 <b>Reviewed By:</b> ${escapeTelegramHtml(actorName)}\n` +
    `📝 <b>Reason:</b> ${escapeTelegramHtml(rejectionReason)}`,
    { text: "View Requisitions", url: hrNexusUrl("/hire") }
  );
}
