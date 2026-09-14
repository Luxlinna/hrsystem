import type { OfferLetter } from "../../types";
import { sendDualRecruitmentNotification } from "../notifications/recruitmentNotifyEngine";
import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { notifyOfferApproved } from "@/services/notifications/recruitmentNotificationTriggers";

export async function notifyBuCeoApproved(offer: OfferLetter, approverName: string) {
  try {
    const buName = offer.business_unit || "OPS Solutions Co ., Ltd";

    // Canonical Notification Engine Dispatch (Event 11: Offer approved Step 1)
    void notifyOfferApproved({
      offer,
      approverName,
      approverRole: "BU CEO",
      stepName: "Step 1 (BU CEO)",
      nextStepAuthority: "HR Manager",
      isFullyApproved: false,
    }).catch((e) => console.error("[notifyOfferApproved Step 1] error:", e));

    await sendDualRecruitmentNotification({
      title: `🏢 Offer Letter Step 1 Approved: ${offer.candidate_name}`,
      approverMessage: `BU CEO ${approverName} approved salary proposal for ${offer.candidate_name}. Moved to HR Division for Step 2 HR Manager Review.`,
      recruiterMessage: `BU CEO signed off on proposal for ${offer.candidate_name}. Forwarded to HR Division for review.`,
      approverRole: "HR Manager",
      entityId: offer.candidate_id,
      actorName: approverName,
      businessUnit: buName,
      branchId: offer.branch_id || null,
      description: `${approverName} (BU CEO) approved offer ${offer.offer_number} for ${offer.candidate_name} ($${Number(offer.base_salary).toLocaleString()}/mo). Business Unit: ${buName}.`,
      telegramHtml:
        `🏢 <b>Offer Letter: Step 1 BU CEO Approved</b>\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)} · ${escapeTelegramHtml(buName)}\n` +
        `💰 <b>Base Salary:</b> $${Number(offer.base_salary).toLocaleString()}/mo\n` +
        `✍️ <b>Approved By:</b> ${escapeTelegramHtml(approverName)} (BU CEO)\n` +
        `⏩ <b>Next Action:</b> Step 2 - HR Manager Review at HR Division`,
      telegramButtonText: "Review in HR Division",
      telegramUrl: hrNexusUrl(`/hire/candidates/${offer.candidate_id}?openOffer=true`),
      auditAction: "offer_step1_bu_ceo_approved",
    });
  } catch {}
}

export async function notifyHrManagerApproved(offer: OfferLetter, reviewerName: string) {
  try {
    const targetBu = offer.business_unit || "OPS Solutions Co ., Ltd";

    // Canonical Notification Engine Dispatch (Event 11: Offer approved Step 2)
    void notifyOfferApproved({
      offer,
      approverName: reviewerName,
      approverRole: "HR Manager",
      stepName: "Step 2 (HR Manager)",
      nextStepAuthority: "HR Admin Director",
      isFullyApproved: false,
    }).catch((e) => console.error("[notifyOfferApproved Step 2] error:", e));

    await sendDualRecruitmentNotification({
      title: `📑 Offer Letter Step 2 Reviewed: ${offer.candidate_name}`,
      approverMessage: `HR Manager ${reviewerName} endorsed offer for ${offer.candidate_name}. Forwarded to HR Admin Director for Step 3 Authorization.`,
      recruiterMessage: `HR Manager endorsed offer for ${offer.candidate_name}. Moved to HR Admin Director.`,
      approverRole: "HR Director",
      entityId: offer.candidate_id,
      actorName: reviewerName,
      businessUnit: "HR Division",
      targetBusinessUnit: targetBu,
      isCrossBu: true,
      branchId: offer.branch_id || null,
      description: `${reviewerName} (HR Manager) reviewed & endorsed offer ${offer.offer_number} for ${offer.candidate_name}. Cross-BU: HR Division → ${targetBu}.`,
      telegramHtml:
        `📑 <b>Offer Letter: Step 2 HR Manager Endorsed</b>\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)}\n` +
        `🏢 <b>Target BU:</b> ${escapeTelegramHtml(targetBu)}\n` +
        `💰 <b>Package:</b> $${Number(offer.base_salary).toLocaleString()}/mo\n` +
        `✍️ <b>Endorsed By:</b> ${escapeTelegramHtml(reviewerName)} (HR Manager at HR Division)\n` +
        `⏩ <b>Next Action:</b> Step 3 - HR Admin Director Authorization Required`,
      telegramButtonText: "Authorize as HR Director",
      telegramUrl: hrNexusUrl(`/hire/candidates/${offer.candidate_id}?openOffer=true`),
      auditAction: "offer_step2_hr_manager_reviewed",
    });
  } catch {}
}

export async function notifyHrDirectorApproved(offer: OfferLetter, approverName: string) {
  try {
    const targetBu = offer.business_unit || "OPS Solutions Co ., Ltd";

    // Canonical Notification Engine Dispatch (Event 11: Offer approved Step 3)
    void notifyOfferApproved({
      offer,
      approverName,
      approverRole: "HR Admin Director",
      stepName: "Step 3 (HR Admin Director)",
      nextStepAuthority: "Chairwoman",
      isFullyApproved: false,
    }).catch((e) => console.error("[notifyOfferApproved Step 3] error:", e));

    await sendDualRecruitmentNotification({
      title: `🏛️ Offer Letter Step 3 Authorized: ${offer.candidate_name}`,
      approverMessage: `HR Admin Director ${approverName} authorized offer for ${offer.candidate_name}. Awaiting final Chairwoman authorization.`,
      recruiterMessage: `HR Admin Director authorized offer for ${offer.candidate_name}. Forwarded to Chairwoman.`,
      approverRole: "Chairwoman",
      entityId: offer.candidate_id,
      actorName: approverName,
      businessUnit: "HR Division",
      targetBusinessUnit: targetBu,
      isCrossBu: true,
      branchId: offer.branch_id || null,
      description: `${approverName} (HR Admin Director) authorized offer ${offer.offer_number} for ${offer.candidate_name}. Cross-BU: HR Division → ${targetBu}.`,
      telegramHtml:
        `🏛️ <b>Offer Letter: Step 3 HR Admin Director Authorized</b>\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)}\n` +
        `🏢 <b>Target BU:</b> ${escapeTelegramHtml(targetBu)}\n` +
        `✍️ <b>Authorized By:</b> ${escapeTelegramHtml(approverName)} (HR Admin Director)\n` +
        `⏩ <b>Next Action:</b> Step 4 - Chairwoman Final Supreme Authorization`,
      telegramButtonText: "Authorize as Chairwoman",
      telegramUrl: hrNexusUrl(`/hire/candidates/${offer.candidate_id}?openOffer=true`),
      auditAction: "offer_step3_hr_director_authorized",
    });
  } catch {}
}

export async function notifyChairwomanAuthorized(offer: OfferLetter, approverName: string) {
  try {
    const targetBu = offer.business_unit || "OPS Solutions Co ., Ltd";

    // Canonical Notification Engine Dispatch (Event 11: Offer approved Step 4 Full Authorization)
    void notifyOfferApproved({
      offer,
      approverName,
      approverRole: "Chairwoman",
      stepName: "Step 4 (Chairwoman Supreme Authorization)",
      isFullyApproved: true,
    }).catch((e) => console.error("[notifyOfferApproved Step 4] error:", e));

    await sendDualRecruitmentNotification({
      title: `👑 Offer Letter Fully Authorized: ${offer.candidate_name}`,
      approverMessage: `Chairwoman ${approverName} granted supreme authorization for ${offer.candidate_name}. All 4 executive tiers signed! Offer letter cleared for official issuance.`,
      recruiterMessage: `Chairwoman granted supreme authorization for ${offer.candidate_name}. Ready to issue official offer!`,
      type: "success",
      entityId: offer.candidate_id,
      actorName: approverName,
      businessUnit: "Corporate Executive Office",
      targetBusinessUnit: targetBu,
      isCrossBu: true,
      branchId: offer.branch_id || null,
      description: `Chairwoman ${approverName} granted supreme authorization for offer ${offer.offer_number} (${offer.candidate_name}). Target BU: ${targetBu}.`,
      telegramHtml:
        `👑 <b>Offer Letter Fully Authorized by Chairwoman!</b>\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)} · ${escapeTelegramHtml(targetBu)}\n` +
        `💰 <b>Authorized Salary:</b> $${Number(offer.base_salary).toLocaleString()}/mo\n` +
        `✍️ <b>Supreme Authorization:</b> ${escapeTelegramHtml(approverName)} (Chairwoman)\n` +
        `🎯 <b>Status:</b> All 4 Executive Approvals Completed. Cleared for official issuance.`,
      telegramButtonText: "Issue Official Offer Letter",
      telegramUrl: hrNexusUrl(`/hire/candidates/${offer.candidate_id}?openOffer=true`),
      auditAction: "offer_step4_chairwoman_authorized",
    });
  } catch {}
}
