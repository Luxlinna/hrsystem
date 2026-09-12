import { supabase } from "@/lib/supabase";
import type { OfferLetter } from "../../types";
import { saveOfferLetter } from "./offerStorage";
import { sendDualRecruitmentNotification } from "../notifications/recruitmentNotifyEngine";
import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";

export async function issueOffer(
  offer: OfferLetter,
  issuerName: string,
  expiryDate?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const defaultExpiry = new Date();
  defaultExpiry.setDate(defaultExpiry.getDate() + 7);
  const formattedExpiry = expiryDate || defaultExpiry.toISOString().split("T")[0];

  const updated: OfferLetter = {
    ...offer,
    status: "issued",
    issued_by: issuerName,
    issued_at: now,
    expiry_date: formattedExpiry,
    updated_at: now,
  };

  // Sync candidate recruitment stage to 'offer' and attach document evidence
  try {
    const { data: candData } = await supabase
      .from("candidates")
      .select("documents")
      .eq("id", offer.candidate_id)
      .single();

    const existingDocs = (candData?.documents || []).filter(
      (d: any) => d.stage_key !== "offer" && !d.name.includes(offer.offer_number)
    );
    const offerDoc = {
      name: `Official Offer Letter - ${offer.offer_number}`,
      url: `#offer-letter-${offer.offer_number}`,
      size: 2048,
      type: "application/pdf",
      uploaded_at: now,
      stage_key: "offer",
      notes: `Issued by ${issuerName}. Base: $${offer.base_salary.toLocaleString()} • Valid until: ${formattedExpiry}`,
    };

    await supabase
      .from("candidates")
      .update({
        stage: "offer",
        documents: [...existingDocs, offerDoc],
      })
      .eq("id", offer.candidate_id);
  } catch (err) {
    console.warn("Could not sync candidate stage to 'offer':", err);
  }

  try {
    await sendDualRecruitmentNotification({
      title: `📬 Official Offer Letter Issued: ${offer.candidate_name}`,
      approverMessage: `Official offer letter ${offer.offer_number} issued to ${offer.candidate_name} by ${issuerName}. Valid until ${formattedExpiry}.`,
      recruiterMessage: `Offer letter ${offer.offer_number} issued to ${offer.candidate_name}. Pipeline updated to Offer stage.`,
      type: "info",
      entityId: offer.candidate_id,
      actorName: issuerName,
      description: `Offer issued to candidate (${offer.offer_number})`,
      telegramHtml:
        `📬 <b>Official Offer Letter Issued</b>\n` +
        `📄 <b>Offer #:</b> ${escapeTelegramHtml(offer.offer_number)}\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)}\n` +
        `📅 <b>Valid Until:</b> ${escapeTelegramHtml(formattedExpiry)}\n` +
        `✍️ <b>Issued By:</b> ${escapeTelegramHtml(issuerName)} (HR Division)`,
      telegramButtonText: "View Issued Offer",
      telegramUrl: hrNexusUrl(`/hire/candidates/${offer.candidate_id}?openOffer=true`),
      auditAction: "offer_official_issued",
    });
  } catch {}

  return await saveOfferLetter(updated);
}

export async function recordCandidateDecision(
  offer: OfferLetter,
  decision: "accepted" | "rejected",
  notes?: string,
  rejectionReason?: string,
  signedDoc?: { name: string; url: string; size?: number; type?: string }
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const updated: OfferLetter = {
    ...offer,
    status: decision,
    decision_at: now,
    decision_notes: notes || null,
    rejection_reason: decision === "rejected" ? rejectionReason || null : null,
    updated_at: now,
  };

  // Sync candidate recruitment stage to 'accepted' or 'rejected' and attach document evidence
  try {
    const { data: candData } = await supabase
      .from("candidates")
      .select("documents")
      .eq("id", offer.candidate_id)
      .single();

    const existingDocs = (candData?.documents || []).filter(
      (d: any) => d.stage_key !== decision && !d.name.includes(offer.offer_number)
    );
    const decisionDoc = {
      name:
        decision === "accepted"
          ? signedDoc?.name
            ? `Signed Offer Acceptance - ${offer.offer_number} (${signedDoc.name})`
            : `Signed Offer Acceptance - ${offer.offer_number}`
          : `Offer Decline Record - ${offer.offer_number}`,
      url: signedDoc?.url || `#offer-decision-${offer.offer_number}`,
      size: signedDoc?.size || 0,
      type: signedDoc?.type || "application/pdf",
      uploaded_at: now,
      stage_key: decision,
      notes:
        decision === "accepted"
          ? `Candidate accepted offer. Confirmed start: ${offer.target_start_date}`
          : `Decline reason: ${rejectionReason || "None specified"}`,
    };

    await supabase
      .from("candidates")
      .update({
        stage: decision,
        documents: [...existingDocs, decisionDoc],
      })
      .eq("id", offer.candidate_id);
  } catch (err) {
    console.warn(`Could not sync candidate stage to '${decision}':`, err);
  }

  try {
    if (decision === "accepted") {
      await sendDualRecruitmentNotification({
        title: `🎉 Offer Accepted: ${offer.candidate_name}`,
        approverMessage: `${offer.candidate_name} accepted the offer letter (${offer.offer_number})! Confirmed start date: ${offer.target_start_date || "Confirmed"}.`,
        recruiterMessage: `${offer.candidate_name} accepted employment offer! Ready for onboarding.`,
        type: "success",
        entityId: offer.candidate_id,
        description: `Candidate accepted offer (${offer.offer_number})`,
        telegramHtml:
          `🎉 <b>Candidate Accepted Employment Offer!</b>\n` +
          `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
          `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)} · ${escapeTelegramHtml(offer.business_unit || "BU")}\n` +
          `🚀 <b>Target Joining Date:</b> ${escapeTelegramHtml(offer.target_start_date || "To be confirmed")}\n` +
          `✅ <b>Status:</b> Accepted. Candidate cleared for Onboarding Journey.`,
        telegramButtonText: "View Accepted Candidate",
        telegramUrl: hrNexusUrl(`/hire/candidates/${offer.candidate_id}?openOffer=true`),
        auditAction: "offer_candidate_accepted",
      });
    } else {
      await sendDualRecruitmentNotification({
        title: `⚠️ Offer Declined: ${offer.candidate_name}`,
        approverMessage: `${offer.candidate_name} declined offer (${offer.offer_number}). Reason: ${rejectionReason || "Not specified"}.`,
        recruiterMessage: `${offer.candidate_name} declined offer.`,
        type: "warning",
        entityId: offer.candidate_id,
        description: `Candidate declined offer (${offer.offer_number})`,
        telegramHtml:
          `⚠️ <b>Candidate Declined Employment Offer</b>\n` +
          `👤 <b>Candidate:</b> ${escapeTelegramHtml(offer.candidate_name)}\n` +
          `💼 <b>Position:</b> ${escapeTelegramHtml(offer.job_title)}\n` +
          `❌ <b>Reason:</b> ${escapeTelegramHtml(rejectionReason || "Candidate declined")}`,
        telegramButtonText: "View Candidate Profile",
        telegramUrl: hrNexusUrl(`/hire/candidates/${offer.candidate_id}?openOffer=true`),
        auditAction: "offer_candidate_declined",
      });
    }
  } catch {}

  return await saveOfferLetter(updated);
}
