import { dispatchNotification } from "./notificationEngine";
import type { CandidateLike } from "./recruitmentNotificationTypes";

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
