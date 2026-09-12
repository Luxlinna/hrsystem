import { supabase } from "@/lib/supabase";
import type { OfferLetter, Candidate, HiringRequest } from "../types";
import { sendDualRecruitmentNotification } from "./notifications/recruitmentNotifyEngine";
import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";

const LOCAL_STORAGE_KEY = "hrm_offer_letters_store";

function getLocalOffers(): OfferLetter[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalOffers(offers: OfferLetter[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(offers));
  } catch {
    // Ignore quota errors
  }
}

export function generateOfferNumber(): string {
  const prefix = "OFF";
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${rand}`;
}

export async function fetchOfferLetters(): Promise<OfferLetter[]> {
  try {
    const { data, error } = await supabase
      .from("offer_letters")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      // Sync local cache with remote
      const local = getLocalOffers();
      const combinedMap = new Map<string, OfferLetter>();
      local.forEach((o) => combinedMap.set(o.id, o));
      data.forEach((o) => combinedMap.set(o.id, o as OfferLetter));
      const merged = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLocalOffers(merged);

      // Auto-sync any local-only offers up to Supabase remote
      local.forEach(async (localOffer) => {
        if (!data.some((d) => d.id === localOffer.id)) {
          try {
            await supabase.from("offer_letters").upsert(localOffer, { onConflict: "id" });
          } catch {
            // Ignore
          }
        }
      });

      return merged.filter((o) => !o.deleted_at);
    }
  } catch {
    // Fallback to local storage
  }
  return getLocalOffers().filter((o) => !o.deleted_at);
}

export async function fetchCandidateOffer(candidateId: string): Promise<OfferLetter | null> {
  const offers = await fetchOfferLetters();
  return offers.find((o) => (o.candidate_id === candidateId || o.id === candidateId) && !o.deleted_at) || null;
}

export async function saveOfferLetter(offer: OfferLetter): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const updatedOffer = { ...offer, updated_at: now };

  // Always update local cache immediately for responsive UI
  const current = getLocalOffers();
  const index = current.findIndex((o) => o.id === updatedOffer.id);
  if (index >= 0) {
    current[index] = updatedOffer;
  } else {
    current.unshift(updatedOffer);
  }
  setLocalOffers(current);

  // Try saving to Supabase
  try {
    const { error } = await supabase
      .from("offer_letters")
      .upsert(updatedOffer, { onConflict: "id" });

    if (error) {
      console.warn("Could not sync offer letter to Supabase remote, saved to local cache:", error.message);
    }
  } catch (err) {
    console.warn("Supabase upsert failed, stored in local storage cache:", err);
  }

  return updatedOffer;
}

export interface CreateProposalPayload {
  candidate: Candidate;
  requisition?: HiringRequest | null;
  base_salary: number;
  probation_salary?: number | null;
  probation_months?: number;
  target_start_date: string;
  allowances?: Array<{ name: string; amount: number }>;
  benefits_summary?: string;
  special_terms?: string;
  proposal_notes?: string;
  proposed_by_name: string;
  proposed_by_id?: string | null;
}

export async function createSalaryProposal(payload: CreateProposalPayload): Promise<OfferLetter> {
  const { candidate, requisition, proposed_by_name, proposed_by_id } = payload;
  const now = new Date().toISOString();
  const offerNumber = generateOfferNumber();

  const businessUnit =
    requisition?.business_unit ||
    candidate.job_postings?.branches?.name ||
    requisition?.branches?.name ||
    "OPS Solutions Co ., Ltd";

  const jobTitle =
    requisition?.title ||
    candidate.job_postings?.title ||
    "Specialist";

  const department =
    requisition?.department ||
    candidate.job_postings?.department ||
    "Operations";

  const reportingTo =
    requisition?.jd_reporting_line ||
    requisition?.hiring_manager_name ||
    "Department Head";

  const newOffer: OfferLetter = {
    id: crypto.randomUUID(),
    offer_number: offerNumber,
    candidate_id: candidate.id,
    candidate_name: candidate.full_name,
    candidate_email: candidate.email || null,
    candidate_phone: candidate.phone || null,
    candidate_address: candidate.location || null,
    hiring_request_id: requisition?.id || null,
    job_posting_id: candidate.job_posting_id || requisition?.job_posting_id || null,
    job_title: jobTitle,
    department: department,
    division: requisition?.division || null,
    business_unit: businessUnit,
    branch_id: requisition?.branch_id || candidate.job_postings?.branch_id || null,
    reporting_to: reportingTo,
    employment_type: requisition?.employment_type || "Full-time",
    working_days: "Monday to Saturday Half",
    working_time: "8:00 am – 5:00 pm",
    base_salary: payload.base_salary,
    probation_salary: payload.probation_salary || null,
    probation_months: payload.probation_months ?? 3,
    target_start_date: payload.target_start_date,
    allowances: payload.allowances || [],
    benefits_summary: payload.benefits_summary || "Standard company health insurance, annual leave (18 days), public holidays, and performance evaluation.",
    special_terms: payload.special_terms || null,
    status: "pending_bu_ceo",
    signatories: {
      bu_ceo: {
        role_key: "bu_ceo",
        title: `CEO (${businessUnit})`,
        name: null,
        status: "pending",
        comment: null,
        signed_at: null,
      },
      hr_manager: {
        role_key: "hr_manager",
        title: "HR Manager (HR Division)",
        name: null,
        status: "pending",
        comment: null,
        signed_at: null,
      },
      hr_director: {
        role_key: "hr_director",
        title: "HR Admin Director (HR Division)",
        name: null,
        status: "pending",
        comment: null,
        signed_at: null,
      },
      chairwoman: {
        role_key: "chairwoman",
        title: "Chairwoman (Supreme Authorization)",
        name: null,
        status: "pending",
        comment: null,
        signed_at: null,
      },
    },

    proposed_by_id: proposed_by_id || null,
    proposed_by_name: proposed_by_name,
    proposed_at: now,
    proposal_notes: payload.proposal_notes || null,

    created_at: now,
    updated_at: now,
  };

  const saved = await saveOfferLetter(newOffer);

  // Send notification to BU CEO for initial approval
  try {
    await sendDualRecruitmentNotification({
      title: `📋 Salary Proposal Created: ${candidate.full_name}`,
      approverMessage: `Salary proposal for ${candidate.full_name} (${jobTitle}) is awaiting your approval as BU CEO.`,
      recruiterMessage: `Proposal for ${candidate.full_name} has been routed to BU CEO for review.`,
      approverRole: "CEO / Division Director",
      entityId: candidate.id,
      actorName: proposed_by_name || "Manager",
      description: `Salary proposal pending BU CEO sign-off (${offerNumber})`,
      telegramHtml:
        `📋 <b>New Salary Proposal Created</b>\n` +
        `👤 <b>Candidate:</b> ${escapeTelegramHtml(candidate.full_name)}\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(jobTitle)} · ${escapeTelegramHtml(businessUnit)}\n` +
        `💰 <b>Proposed Base:</b> $${Number(payload.base_salary).toLocaleString()}/mo\n` +
        `✍️ <b>Submitted By:</b> ${escapeTelegramHtml(proposed_by_name || "Manager")}\n` +
        `⏩ <b>Next Action:</b> BU CEO Approval Required`,
      telegramButtonText: "Review Proposal (BU CEO)",
      telegramUrl: hrNexusUrl(`/hire/candidates/${candidate.id}?openOffer=true`),
      auditAction: "offer_salary_proposal_created",
    });
  } catch {
    // Non-fatal
  }

  return saved;
}

export function getOfferSignatories(offer: OfferLetter) {
  if (offer.signatories) return offer.signatories;
  return {
    bu_ceo: {
      role_key: "bu_ceo" as const,
      title: `CEO (${offer.business_unit || "BU"})`,
      name: offer.salary_approved_by || null,
      status: offer.salary_approved_by ? ("approved" as const) : ("pending" as const),
      comment: offer.salary_approval_notes || null,
      signed_at: offer.salary_approved_at || null,
    },
    hr_manager: {
      role_key: "hr_manager" as const,
      title: "HR Manager (HR Division)",
      name: offer.hr_reviewed_by || null,
      status: offer.hr_reviewed_by ? ("approved" as const) : ("pending" as const),
      comment: offer.hr_review_notes || null,
      signed_at: offer.hr_reviewed_at || null,
    },
    hr_director: {
      role_key: "hr_director" as const,
      title: "HR Admin Director (HR Division)",
      name: null,
      status: "pending" as const,
      comment: null,
      signed_at: null,
    },
    chairwoman: {
      role_key: "chairwoman" as const,
      title: "Chairwoman (Supreme Authorization)",
      name: offer.management_approved_by || null,
      status: offer.management_approved_by ? ("approved" as const) : ("pending" as const),
      comment: offer.management_approval_notes || null,
      signed_at: offer.management_approved_at || null,
    },
  };
}

/** Step 1: BU CEO Approval */
export async function approveByBuCeo(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const currentSigs = getOfferSignatories(offer);

  const updated: OfferLetter = {
    ...offer,
    status: "pending_hr_manager",
    salary_approved_by: approverName,
    salary_approved_at: now,
    salary_approval_notes: notes || null,
    signatories: {
      ...currentSigs,
      bu_ceo: {
        ...currentSigs.bu_ceo,
        name: approverName,
        status: "approved",
        comment: notes || null,
        signed_at: now,
      },
    },
    updated_at: now,
  };

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

  return await saveOfferLetter(updated);
}

/** Step 2: HR Division HR Manager Review & Approval */
export async function approveByHrManager(
  offer: OfferLetter,
  reviewerName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const currentSigs = getOfferSignatories(offer);

  const updated: OfferLetter = {
    ...offer,
    status: "pending_hr_director",
    hr_reviewed_by: reviewerName,
    hr_reviewed_at: now,
    hr_review_notes: notes || null,
    signatories: {
      ...currentSigs,
      hr_manager: {
        ...currentSigs.hr_manager,
        name: reviewerName,
        status: "approved",
        comment: notes || null,
        signed_at: now,
      },
    },
    updated_at: now,
  };

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

  return await saveOfferLetter(updated);
}

/** Step 3: HR Admin Director Authorization */
export async function approveByHrDirector(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const currentSigs = getOfferSignatories(offer);

  const updated: OfferLetter = {
    ...offer,
    status: "pending_chairwoman",
    signatories: {
      ...currentSigs,
      hr_director: {
        ...currentSigs.hr_director,
        name: approverName,
        status: "approved",
        comment: notes || null,
        signed_at: now,
      },
    },
    updated_at: now,
  };

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

  return await saveOfferLetter(updated);
}

/** Step 4: Chairwoman Supreme Authorization */
export async function authorizeByChairwoman(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const currentSigs = getOfferSignatories(offer);

  const updated: OfferLetter = {
    ...offer,
    status: "approved",
    management_approved_by: approverName,
    management_approved_at: now,
    management_approval_notes: notes || null,
    signatories: {
      ...currentSigs,
      chairwoman: {
        ...currentSigs.chairwoman,
        name: approverName,
        status: "approved",
        comment: notes || null,
        signed_at: now,
      },
    },
    updated_at: now,
  };

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

  return await saveOfferLetter(updated);
}

// Backward compatibility methods
export async function approveSalary(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  return approveByBuCeo(offer, approverName, notes);
}

export async function generateOfferLetterDraft(
  offer: OfferLetter
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const updated: OfferLetter = {
    ...offer,
    status: offer.status === "pending_bu_ceo" || offer.status === "salary_proposal" ? "pending_bu_ceo" : offer.status,
    updated_at: now,
  };
  return await saveOfferLetter(updated);
}

export async function endorseHrReview(
  offer: OfferLetter,
  reviewerName: string,
  notes?: string
): Promise<OfferLetter> {
  return approveByHrManager(offer, reviewerName, notes);
}

export async function approveOfferManagement(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  return authorizeByChairwoman(offer, approverName, notes);
}

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
  rejectionReason?: string
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
          ? `Signed Offer Acceptance - ${offer.offer_number}`
          : `Offer Decline Record - ${offer.offer_number}`,
      url: `#offer-decision-${offer.offer_number}`,
      size: 1024,
      type: "application/pdf",
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

export async function softDeleteOfferLetter(
  offerId: string,
  actorName?: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const current = getLocalOffers();
  const updated = current.map((o) =>
    o.id === offerId ? { ...o, deleted_at: now, deleted_by: actorName || "User" } : o
  );
  setLocalOffers(updated);

  try {
    const { error } = await supabase
      .from("offer_letters")
      .update({ deleted_at: now, deleted_by: actorName || "User" })
      .eq("id", offerId);
    if (error) {
      console.warn("Could not soft-delete from Supabase, updated local cache:", error.message);
    }
  } catch (err) {
    console.warn("Failed to soft-delete offer from Supabase:", err);
  }

  return true;
}

export const deleteOfferLetter = softDeleteOfferLetter;

export async function restoreOfferLetter(offerId: string): Promise<boolean> {
  const current = getLocalOffers();
  const updated = current.map((o) =>
    o.id === offerId ? { ...o, deleted_at: null, deleted_by: null } : o
  );
  setLocalOffers(updated);

  try {
    const { error } = await supabase
      .from("offer_letters")
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", offerId);
    if (error) {
      console.warn("Could not restore offer in Supabase, updated local cache:", error.message);
    }
  } catch (err) {
    console.warn("Failed to restore offer in Supabase:", err);
  }

  return true;
}

export async function deleteForeverOfferLetter(offerId: string): Promise<boolean> {
  const current = getLocalOffers();
  const filtered = current.filter((o) => o.id !== offerId);
  setLocalOffers(filtered);

  try {
    const { error } = await supabase
      .from("offer_letters")
      .delete()
      .eq("id", offerId);
    if (error) {
      console.warn("Could not delete forever from Supabase, updated local cache:", error.message);
    }
  } catch (err) {
    console.warn("Failed to delete forever from Supabase:", err);
  }

  return true;
}
