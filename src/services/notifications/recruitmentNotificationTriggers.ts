import { dispatchNotification } from "./notificationEngine";
import type { HiringRequest, Candidate, OfferLetter } from "@/pages/hire/types";
import type { EmploymentContract } from "@/pages/hire/types/contractTypes";

export type CandidateLike = Partial<Candidate> & { id: string; full_name: string };

/**
 * Event 1: Requisition submitted
 */
export async function notifyRequisitionSubmitted(params: {
  requisition: HiringRequest;
  submittedBy: string;
  submitterRole?: string;
  businessUnit?: string;
}) {
  const { requisition, submittedBy, submitterRole = "Hiring Manager", businessUnit } = params;
  const bu = businessUnit || requisition.branches?.name || "OPS Solutions Co ., Ltd";
  const reqCode = requisition.requisition_id || "REQ";

  await dispatchNotification({
    event: "requisition_submitted",
    title: `New Requisition: [${reqCode}] ${requisition.title}`,
    message: `${submittedBy} (${submitterRole}) submitted requisition [${reqCode}] ${requisition.title} for ${requisition.headcount} headcount in ${requisition.department}. Pending BU CEO review.`,
    type: "info",
    entityId: requisition.id,
    entityType: "hiring_request",
    entityTitle: `[${reqCode}] ${requisition.title}`,
    businessUnit: bu,
    branchId: requisition.branch_id || null,
    actorName: submittedBy,
    actorRole: submitterRole,
    recipientRole: "BU CEO",
    actionUrl: `/hire?tab=requisitions&id=${requisition.id}`,
    actionButtonText: "Review Requisition",
    details: {
      "Requisition Code": reqCode,
      "Position": requisition.title,
      "Department": requisition.department,
      "Headcount": requisition.headcount,
    },
  });
}

/**
 * Event 2: Approval pending
 */
export async function notifyApprovalPending(params: {
  entityType: "hiring_request" | "candidate_approval" | "offer_letter" | "employment_contract";
  entityId: string;
  entityCode: string;
  entityTitle: string;
  approverRole: string;
  actorName: string;
  actorRole?: string;
  businessUnit?: string;
  targetBusinessUnit?: string;
  isCrossBu?: boolean;
  branchId?: string | null;
  actionUrl?: string;
}) {
  const {
    entityType,
    entityId,
    entityCode,
    entityTitle,
    approverRole,
    actorName,
    actorRole = "Officer",
    businessUnit = "Corporate",
    targetBusinessUnit,
    isCrossBu = false,
    branchId,
    actionUrl,
  } = params;

  await dispatchNotification({
    event: "approval_pending",
    title: `Approval Pending: [${entityCode}] ${entityTitle}`,
    message: `Review & authorization required by ${approverRole} for [${entityCode}] ${entityTitle}. Forwarded by ${actorName} (${actorRole}).`,
    type: "warning",
    entityId,
    entityType,
    entityTitle: `[${entityCode}] ${entityTitle}`,
    businessUnit,
    targetBusinessUnit,
    isCrossBu,
    branchId,
    actorName,
    actorRole,
    recipientRole: approverRole,
    actionUrl: actionUrl || "/hire",
    actionButtonText: `Review as ${approverRole}`,
    details: {
      "Reference": entityCode,
      "Item": entityTitle,
      "Pending Authority": approverRole,
    },
  });
}

/**
 * Event 3: Revision requested
 */
export async function notifyRevisionRequested(params: {
  entityType: string;
  entityId: string;
  entityCode: string;
  entityTitle: string;
  requestedBy: string;
  requestorRole: string;
  reason: string;
  businessUnit?: string;
  branchId?: string | null;
  actionUrl?: string;
}) {
  const { entityType, entityId, entityCode, entityTitle, requestedBy, requestorRole, reason, businessUnit, branchId, actionUrl } = params;

  await dispatchNotification({
    event: "revision_requested",
    title: `Revision Requested: [${entityCode}] ${entityTitle}`,
    message: `${requestedBy} (${requestorRole}) requested revision for [${entityCode}] ${entityTitle}. Reason: ${reason}`,
    type: "warning",
    entityId,
    entityType,
    entityTitle: `[${entityCode}] ${entityTitle}`,
    businessUnit,
    branchId,
    actorName: requestedBy,
    actorRole: requestorRole,
    reason,
    actionUrl: actionUrl || "/hire",
    actionButtonText: "Update & Resubmit",
    details: {
      "Reference": entityCode,
      "Requested By": `${requestedBy} (${requestorRole})`,
      "Feedback": reason,
    },
  });
}

/**
 * Event 4: Rejected
 */
export async function notifyRejected(params: {
  entityType: string;
  entityId: string;
  entityCode: string;
  entityTitle: string;
  rejectedBy: string;
  rejectorRole: string;
  reason: string;
  businessUnit?: string;
  branchId?: string | null;
}) {
  const { entityType, entityId, entityCode, entityTitle, rejectedBy, rejectorRole, reason, businessUnit, branchId } = params;

  await dispatchNotification({
    event: "rejected",
    title: `Declined / Rejected: [${entityCode}] ${entityTitle}`,
    message: `[${entityCode}] ${entityTitle} was rejected by ${rejectedBy} (${rejectorRole}). Reason: ${reason}`,
    type: "error",
    entityId,
    entityType,
    entityTitle: `[${entityCode}] ${entityTitle}`,
    businessUnit,
    branchId,
    actorName: rejectedBy,
    actorRole: rejectorRole,
    reason,
    actionUrl: "/hire",
    actionButtonText: "View Details",
  });
}

/**
 * Event 5: Candidate shortlisted
 */
export async function notifyCandidateShortlisted(params: {
  candidate: CandidateLike;
  jobTitle: string;
  actorName: string;
  businessUnit?: string;
}) {
  const { candidate, jobTitle, actorName, businessUnit } = params;

  await dispatchNotification({
    event: "candidate_shortlisted",
    title: `Candidate Shortlisted: ${candidate.full_name}`,
    message: `${actorName} shortlisted ${candidate.full_name} for position ${jobTitle}. Candidate qualified for interview scheduling.`,
    type: "success",
    entityId: candidate.id,
    entityType: "candidate",
    entityTitle: candidate.full_name,
    businessUnit: businessUnit || candidate.job_postings?.branches?.name || "OPS Solutions Co ., Ltd",
    branchId: candidate.job_postings?.branch_id || null,
    actorName,
    actionUrl: `/hire/candidates/${candidate.id}?tab=evidence`,
    actionButtonText: "Schedule Interview",
    details: {
      "Candidate": candidate.full_name,
      "Position": jobTitle,
      "Status": "Shortlisted",
    },
  });
}

/**
 * Event 6: CV review required
 */
export async function notifyCvReviewRequired(params: {
  candidate: CandidateLike;
  jobTitle: string;
  source?: string;
  reviewerRole?: string;
  businessUnit?: string;
}) {
  const { candidate, jobTitle, source = "Direct Application", reviewerRole = "Recruiter / Hiring Manager", businessUnit } = params;

  await dispatchNotification({
    event: "cv_review_required",
    title: `CV Review Required: ${candidate.full_name}`,
    message: `New applicant ${candidate.full_name} applied for ${jobTitle} via ${source}. CV screening and profile evaluation required.`,
    type: "info",
    entityId: candidate.id,
    entityType: "candidate",
    entityTitle: candidate.full_name,
    businessUnit: businessUnit || candidate.job_postings?.branches?.name || "OPS Solutions Co ., Ltd",
    branchId: candidate.job_postings?.branch_id || null,
    recipientRole: reviewerRole,
    actionUrl: `/hire/candidates/${candidate.id}?tab=documents`,
    actionButtonText: "Review Candidate CV",
    details: {
      "Candidate": candidate.full_name,
      "Position": jobTitle,
      "Source": source,
    },
  });
}

/**
 * Event 7: Interview scheduled
 */
export async function notifyInterviewScheduled(params: {
  candidate: CandidateLike;
  jobTitle: string;
  interviewType: string;
  scheduledTime: string;
  interviewerNames: string;
  meetingLinkOrLocation?: string;
  businessUnit?: string;
}) {
  const { candidate, jobTitle, interviewType, scheduledTime, interviewerNames, meetingLinkOrLocation, businessUnit } = params;

  await dispatchNotification({
    event: "interview_scheduled",
    title: `Interview Scheduled: ${candidate.full_name}`,
    message: `${interviewType} scheduled for ${candidate.full_name} (${jobTitle}) on ${scheduledTime} with interviewers: ${interviewerNames}.`,
    type: "info",
    entityId: candidate.id,
    entityType: "candidate",
    entityTitle: candidate.full_name,
    businessUnit: businessUnit || candidate.job_postings?.branches?.name || "OPS Solutions Co ., Ltd",
    branchId: candidate.job_postings?.branch_id || null,
    actionUrl: `/hire/candidates/${candidate.id}?tab=evidence`,
    actionButtonText: "View Interview Details",
    details: {
      "Candidate": candidate.full_name,
      "Interview Type": interviewType,
      "Date & Time": scheduledTime,
      "Panel": interviewerNames,
      "Location": meetingLinkOrLocation || "HR Nexus Meeting Room",
    },
  });
}

/**
 * Event 8: Interview feedback overdue
 */
export async function notifyInterviewFeedbackOverdue(params: {
  candidate: CandidateLike;
  jobTitle: string;
  interviewerName: string;
  interviewDate: string;
  hoursElapsed: number;
  businessUnit?: string;
}) {
  const { candidate, jobTitle, interviewerName, interviewDate, hoursElapsed, businessUnit } = params;

  await dispatchNotification({
    event: "interview_feedback_overdue",
    title: `Feedback Overdue: ${candidate.full_name}`,
    message: `Interview scorecard for ${candidate.full_name} (${jobTitle}) conducted on ${interviewDate} is pending submission by ${interviewerName} (${hoursElapsed}h elapsed).`,
    type: "warning",
    entityId: candidate.id,
    entityType: "candidate",
    entityTitle: candidate.full_name,
    businessUnit: businessUnit || candidate.job_postings?.branches?.name || "OPS Solutions Co ., Ltd",
    branchId: candidate.job_postings?.branch_id || null,
    recipientRole: `Interviewer (${interviewerName})`,
    actionUrl: `/hire/candidates/${candidate.id}?tab=evidence`,
    actionButtonText: "Submit Scorecard Now",
    details: {
      "Candidate": candidate.full_name,
      "Interviewer": interviewerName,
      "Interview Date": interviewDate,
      "Time Elapsed": `${hoursElapsed} hours`,
    },
  });
}

/**
 * Event 9: Candidate selected
 */
export async function notifyCandidateSelected(params: {
  candidate: CandidateLike;
  jobTitle: string;
  selectedBy: string;
  businessUnit?: string;
}) {
  const { candidate, jobTitle, selectedBy, businessUnit } = params;

  await dispatchNotification({
    event: "candidate_selected",
    title: `Candidate Selected: ${candidate.full_name}`,
    message: `${selectedBy} selected ${candidate.full_name} for hire as ${jobTitle}. Candidate Approval Form (CAF) initiated.`,
    type: "success",
    entityId: candidate.id,
    entityType: "candidate",
    entityTitle: candidate.full_name,
    businessUnit: businessUnit || candidate.job_postings?.branches?.name || "OPS Solutions Co ., Ltd",
    branchId: candidate.job_postings?.branch_id || null,
    actorName: selectedBy,
    actionUrl: `/hire/candidates/${candidate.id}?tab=offer_contract`,
    actionButtonText: "Initiate Salary & Offer",
    details: {
      "Candidate": candidate.full_name,
      "Position": jobTitle,
      "Selected By": selectedBy,
    },
  });
}

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
 * Event 13: Document missing
 */
export async function notifyDocumentMissing(params: {
  candidate: CandidateLike;
  missingDocumentNames: string[];
  deadline?: string;
  businessUnit?: string;
}) {
  const { candidate, missingDocumentNames, deadline = "Before commencement", businessUnit } = params;
  const docList = missingDocumentNames.join(", ");

  await dispatchNotification({
    event: "document_missing",
    title: `Documents Missing: ${candidate.full_name}`,
    message: `Mandatory onboarding/verification documents are missing for ${candidate.full_name}: ${docList}. Required ${deadline}.`,
    type: "warning",
    entityId: candidate.id,
    entityType: "candidate",
    entityTitle: candidate.full_name,
    businessUnit: businessUnit || candidate.job_postings?.branches?.name || "OPS Solutions Co ., Ltd",
    branchId: candidate.job_postings?.branch_id || null,
    recipientRole: "HR Recruiter / Candidate",
    actionUrl: `/hire/candidates/${candidate.id}?tab=documents`,
    actionButtonText: "Upload Missing Documents",
    details: {
      "Candidate": candidate.full_name,
      "Missing Items": docList,
      "Target Deadline": deadline,
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

/**
 * Event 16: SLA exceeded
 */
export async function notifySlaExceeded(params: {
  entityType: string;
  entityId: string;
  entityCode: string;
  entityTitle: string;
  stageName: string;
  daysInStage: number;
  slaLimitDays: number;
  responsibleRole?: string;
  businessUnit?: string;
  branchId?: string | null;
}) {
  const {
    entityType,
    entityId,
    entityCode,
    entityTitle,
    stageName,
    daysInStage,
    slaLimitDays,
    responsibleRole = "HR Manager / BU CEO",
    businessUnit = "OPS Solutions Co ., Ltd",
    branchId,
  } = params;

  const daysOverdue = daysInStage - slaLimitDays;

  await dispatchNotification({
    event: "sla_exceeded",
    title: `🚨 SLA Exceeded: [${entityCode}] ${entityTitle}`,
    message: `[${entityCode}] ${entityTitle} has exceeded the defined SLA threshold in stage "${stageName}". Elapsed: ${daysInStage} days (Limit: ${slaLimitDays} days, ${daysOverdue} days overdue). Attention required by ${responsibleRole}.`,
    type: "error",
    entityId,
    entityType,
    entityTitle: `[${entityCode}] ${entityTitle}`,
    businessUnit,
    branchId,
    recipientRole: responsibleRole,
    actionUrl: "/hire",
    actionButtonText: "Expedite Pipeline Item",
    details: {
      "Item": entityTitle,
      "Stage": stageName,
      "Elapsed Days": `${daysInStage} days`,
      "SLA Limit": `${slaLimitDays} days`,
      "Days Overdue": `${daysOverdue} days`,
    },
  });
}
