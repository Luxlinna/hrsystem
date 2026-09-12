import type { OfferLetter, Candidate, HiringRequest } from "../../types";
import { saveOfferLetter } from "./offerStorage";
import { sendDualRecruitmentNotification } from "../notifications/recruitmentNotifyEngine";
import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";

export function generateOfferNumber(): string {
  const prefix = "OFF";
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${rand}`;
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
