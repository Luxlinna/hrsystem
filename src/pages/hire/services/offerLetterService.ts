import { supabase } from "@/lib/supabase";
import type { OfferLetter, Candidate, HiringRequest } from "../types";

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
      return merged.filter((o) => !o.deleted_at);
    }
  } catch {
    // Fallback to local storage
  }
  return getLocalOffers().filter((o) => !o.deleted_at);
}

export async function fetchCandidateOffer(candidateId: string): Promise<OfferLetter | null> {
  const offers = await fetchOfferLetters();
  return offers.find((o) => o.candidate_id === candidateId && !o.deleted_at) || null;
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
    status: "salary_proposal",

    proposed_by_id: proposed_by_id || null,
    proposed_by_name: proposed_by_name,
    proposed_at: now,
    proposal_notes: payload.proposal_notes || null,

    created_at: now,
    updated_at: now,
  };

  return await saveOfferLetter(newOffer);
}

export async function approveSalary(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const updated: OfferLetter = {
    ...offer,
    status: "salary_approved",
    salary_approved_by: approverName,
    salary_approved_at: now,
    salary_approval_notes: notes || null,
    updated_at: now,
  };
  return await saveOfferLetter(updated);
}

export async function generateOfferLetterDraft(
  offer: OfferLetter
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const updated: OfferLetter = {
    ...offer,
    status: "hr_review", // Moves straight to HR review once generated
    updated_at: now,
  };
  return await saveOfferLetter(updated);
}

export async function endorseHrReview(
  offer: OfferLetter,
  reviewerName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const updated: OfferLetter = {
    ...offer,
    status: "management_approval",
    hr_reviewed_by: reviewerName,
    hr_reviewed_at: now,
    hr_review_notes: notes || null,
    updated_at: now,
  };
  return await saveOfferLetter(updated);
}

export async function approveOfferManagement(
  offer: OfferLetter,
  approverName: string,
  notes?: string
): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const updated: OfferLetter = {
    ...offer,
    status: "approved",
    management_approved_by: approverName,
    management_approved_at: now,
    management_approval_notes: notes || null,
    updated_at: now,
  };
  return await saveOfferLetter(updated);
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
