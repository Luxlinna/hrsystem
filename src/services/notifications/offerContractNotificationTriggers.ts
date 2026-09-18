import { dispatchNotification } from "./notificationEngine";
import type { OfferLetter } from "@/pages/hire/types";
import type { EmploymentContract } from "@/pages/hire/types/contractTypes";

/**
 * Event 10: Salary approval required
 */
export async function notifySalaryApprovalRequired(params: {
  offer: OfferLetter;
  proposedBy: string;
  approverRole?: string;
}) {
  const { offer, proposedBy, approverRole = "BU CEO" } = params;

  await dispatchNotification({
    event: "salary_approval_required",
    title: `Salary Approval Required: ${offer.candidate_name}`,
    message: `${proposedBy} submitted a salary proposal for ${offer.candidate_name} ($${Number(offer.base_salary).toLocaleString()}/mo). Review and approval required by ${approverRole}.`,
    type: "warning",
    entityId: offer.candidate_id,
    entityType: "offer_letter",
    entityTitle: `${offer.offer_number} - ${offer.candidate_name}`,
    businessUnit: offer.business_unit || "OPS Solutions Co ., Ltd",
    branchId: offer.branch_id || null,
    actorName: proposedBy,
    recipientRole: approverRole,
    newValue: offer.base_salary,
    actionUrl: `/hire/candidates/${offer.candidate_id}?tab=offer_contract`,
    actionButtonText: `Review as ${approverRole}`,
    details: {
      "Offer Reference": offer.offer_number,
      "Candidate": offer.candidate_name,
      "Position": offer.job_title,
      "Proposed Salary": `$${Number(offer.base_salary).toLocaleString()}/mo`,
    },
  });
}

/**
 * Event 11: Offer approved
 */
export async function notifyOfferApproved(params: {
  offer: OfferLetter;
  approverName: string;
  approverRole: string;
  stepName: string;
  nextStepAuthority?: string;
  isFullyApproved?: boolean;
}) {
  const { offer, approverName, approverRole, stepName, nextStepAuthority, isFullyApproved = false } = params;

  await dispatchNotification({
    event: "offer_approved",
    title: isFullyApproved ? `👑 Offer Fully Authorized: ${offer.candidate_name}` : `Offer Approved (${stepName}): ${offer.candidate_name}`,
    message: isFullyApproved
      ? `All 4 executive approvals completed! Offer letter ${offer.offer_number} for ${offer.candidate_name} ($${Number(offer.base_salary).toLocaleString()}/mo) authorized by ${approverName} (${approverRole}). Ready for official issuance.`
      : `${approverName} (${approverRole}) approved ${stepName} for offer ${offer.offer_number} (${offer.candidate_name}). Next approval: ${nextStepAuthority || "Next Executive"}.`,
    type: "success",
    entityId: offer.candidate_id,
    entityType: "offer_letter",
    entityTitle: `${offer.offer_number} - ${offer.candidate_name}`,
    businessUnit: offer.business_unit || "OPS Solutions Co ., Ltd",
    branchId: offer.branch_id || null,
    actorName: approverName,
    actorRole: approverRole,
    actionUrl: `/hire/candidates/${offer.candidate_id}?tab=offer_contract`,
    actionButtonText: isFullyApproved ? "Issue Official Offer" : "Review Offer Pipeline",
    details: {
      "Offer Reference": offer.offer_number,
      "Candidate": offer.candidate_name,
      "Approved Step": stepName,
      "Signatory": `${approverName} (${approverRole})`,
    },
  });
}

/**
 * Event 12: Offer accepted
 */
export async function notifyOfferAccepted(params: {
  offer: OfferLetter;
  confirmedStartDate?: string;
}) {
  const { offer, confirmedStartDate } = params;
  const start = confirmedStartDate || offer.target_start_date || "To be confirmed";

  await dispatchNotification({
    event: "offer_accepted",
    title: `🎉 Offer Accepted: ${offer.candidate_name}`,
    message: `Candidate ${offer.candidate_name} accepted the employment offer (${offer.offer_number})! Confirmed start date: ${start}. Candidate cleared for contract generation & onboarding.`,
    type: "success",
    entityId: offer.candidate_id,
    entityType: "offer_letter",
    entityTitle: `${offer.offer_number} - ${offer.candidate_name}`,
    businessUnit: offer.business_unit || "OPS Solutions Co ., Ltd",
    branchId: offer.branch_id || null,
    actionUrl: `/hire/candidates/${offer.candidate_id}?tab=offer_contract`,
    actionButtonText: "Generate Contract Draft",
    details: {
      "Offer Reference": offer.offer_number,
      "Candidate": offer.candidate_name,
      "Position": offer.job_title,
      "Confirmed Start": start,
    },
  });
}

/**
 * Event 14: Contract ready
 */
export async function notifyContractReady(params: {
  contract: EmploymentContract;
  createdBy: string;
}) {
  const { contract, createdBy } = params;

  await dispatchNotification({
    event: "contract_ready",
    title: `Contract Ready for Review: ${contract.candidate_name}`,
    message: `${createdBy} prepared employment contract draft ${contract.contract_number} for ${contract.candidate_name} ($${Number(contract.monthly_salary).toLocaleString()} ${contract.currency}/mo). Ready for HR Manager & Director review.`,
    type: "info",
    entityId: contract.candidate_id,
    entityType: "employment_contract",
    entityTitle: `${contract.contract_number} - ${contract.candidate_name}`,
    businessUnit: contract.business_unit_name || "OPS Solutions Co ., Ltd",
    branchId: contract.branch_id || null,
    actorName: createdBy,
    recipientRole: "HR Manager",
    actionUrl: `/hire/candidates/${contract.candidate_id}?tab=offer_contract`,
    actionButtonText: "Review Contract Draft",
    details: {
      "Contract #": contract.contract_number,
      "Candidate": contract.candidate_name,
      "Position": contract.position_title,
      "Monthly Salary": `$${Number(contract.monthly_salary).toLocaleString()} ${contract.currency}`,
    },
  });
}

/**
 * Event 15: Contract approved
 */
export async function notifyContractApproved(params: {
  contract: EmploymentContract;
  approverName: string;
  approverRole: string;
  isFinalAuthorization?: boolean;
}) {
  const { contract, approverName, approverRole, isFinalAuthorization = false } = params;

  await dispatchNotification({
    event: "contract_approved",
    title: isFinalAuthorization ? `👑 Contract Fully Authorized: ${contract.candidate_name}` : `Contract Endorsed: ${contract.candidate_name}`,
    message: isFinalAuthorization
      ? `Chairwoman ${approverName} granted final supreme authorization for contract ${contract.contract_number} (${contract.candidate_name}). Cleared for official candidate signing.`
      : `${approverName} (${approverRole}) endorsed contract ${contract.contract_number} for ${contract.candidate_name}. Moved to next review tier.`,
    type: "success",
    entityId: contract.candidate_id,
    entityType: "employment_contract",
    entityTitle: `${contract.contract_number} - ${contract.candidate_name}`,
    businessUnit: contract.business_unit_name || "OPS Solutions Co ., Ltd",
    branchId: contract.branch_id || null,
    actorName: approverName,
    actorRole: approverRole,
    actionUrl: `/hire/candidates/${contract.candidate_id}?tab=offer_contract`,
    actionButtonText: isFinalAuthorization ? "Proceed to Signing" : "View Contract Status",
    details: {
      "Contract #": contract.contract_number,
      "Candidate": contract.candidate_name,
      "Authorized By": `${approverName} (${approverRole})`,
    },
  });
}
