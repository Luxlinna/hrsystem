import type { OfferLetter } from "../../types";
import { sendDualRecruitmentNotification } from "../notifications/recruitmentNotifyEngine";
import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";

export async function notifyBuCeoApproved(offer: OfferLetter, approverName: string) {
  try {
    await sendDualRecruitmentNotification({
      title: `🏢 Offer Letter Step 1 Approved: ${offer.candidate_name}`,
      approverMessage: `BU CEO ${approverName} approved salary proposal for ${offer.candidate_name}. Moved to HR Division for Step 2 HR Manager Review.`,
      recruiterMessage: `BU CEO signed off on proposal for ${offer.candidate_name}. Forwarded to HR Division for review.`,
      approverRole: "HR Manager",
      entityId: offer.candidate_id,
      actorName: approverName,
      description: `Offer forwarded to HR Division (${offer.offer_number})`,
      telegramHtml:
        `🏢 <b>Offer Letter: Step 1 BU CEO Approved</b>\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)} · ${escapeTelegramHtml(offer.business_unit || "BU")}\n` +
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
    await sendDualRecruitmentNotification({
      title: `📑 Offer Letter Step 2 Reviewed: ${offer.candidate_name}`,
      approverMessage: `HR Manager ${reviewerName} endorsed offer for ${offer.candidate_name}. Forwarded to HR Admin Director for Step 3 Authorization.`,
      recruiterMessage: `HR Manager endorsed offer for ${offer.candidate_name}. Moved to HR Admin Director.`,
      approverRole: "HR Director",
      entityId: offer.candidate_id,
      actorName: reviewerName,
      description: `Offer forwarded to HR Admin Director (${offer.offer_number})`,
      telegramHtml:
        `📑 <b>Offer Letter: Step 2 HR Manager Endorsed</b>\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)}\n` +
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
    await sendDualRecruitmentNotification({
      title: `🏛️ Offer Letter Step 3 Authorized: ${offer.candidate_name}`,
      approverMessage: `HR Admin Director ${approverName} authorized offer for ${offer.candidate_name}. Awaiting final Chairwoman authorization.`,
      recruiterMessage: `HR Admin Director authorized offer for ${offer.candidate_name}. Forwarded to Chairwoman.`,
      approverRole: "Chairwoman",
      entityId: offer.candidate_id,
      actorName: approverName,
      description: `Offer awaiting Chairwoman authorization (${offer.offer_number})`,
      telegramHtml:
        `🏛️ <b>Offer Letter: Step 3 HR Admin Director Authorized</b>\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)}\n` +
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
    await sendDualRecruitmentNotification({
      title: `👑 Offer Letter Fully Authorized: ${offer.candidate_name}`,
      approverMessage: `Chairwoman ${approverName} granted supreme authorization for ${offer.candidate_name}. All 4 executive tiers signed! Offer letter cleared for official issuance.`,
      recruiterMessage: `Chairwoman granted supreme authorization for ${offer.candidate_name}. Ready to issue official offer!`,
      type: "success",
      entityId: offer.candidate_id,
      actorName: approverName,
      description: `Offer supreme authorization granted by Chairwoman (${offer.offer_number})`,
      telegramHtml:
        `👑 <b>Offer Letter Fully Authorized by Chairwoman!</b>\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)} · ${escapeTelegramHtml(offer.business_unit || "BU")}\n` +
        `💰 <b>Authorized Salary:</b> $${Number(offer.base_salary).toLocaleString()}/mo\n` +
        `✍️ <b>Supreme Authorization:</b> ${escapeTelegramHtml(approverName)} (Chairwoman)\n` +
        `🎯 <b>Status:</b> All 4 Executive Approvals Completed. Cleared for official issuance.`,
      telegramButtonText: "Issue Official Offer Letter",
      telegramUrl: hrNexusUrl(`/hire/candidates/${offer.candidate_id}?openOffer=true`),
      auditAction: "offer_step4_chairwoman_authorized",
    });
  } catch {}
}
