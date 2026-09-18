// Re-export types
export type { CandidateLike } from "./recruitmentNotificationTypes";

// Re-export requisition and approval triggers
export {
  notifyRequisitionSubmitted,
  notifyApprovalPending,
  notifyRevisionRequested,
} from "./requisitionNotificationTriggers";

// Re-export workflow decision and SLA triggers
export {
  notifyRejected,
  notifySlaExceeded,
} from "./workflowDecisionNotificationTriggers";

// Re-export candidate and document triggers
export {
  notifyCandidateShortlisted,
  notifyCvReviewRequired,
  notifyCandidateSelected,
  notifyDocumentMissing,
} from "./candidateNotificationTriggers";

// Re-export interview triggers
export {
  notifyInterviewScheduled,
  notifyInterviewFeedbackOverdue,
} from "./interviewNotificationTriggers";

// Re-export offer & contract triggers
export {
  notifySalaryApprovalRequired,
  notifyOfferApproved,
  notifyOfferAccepted,
  notifyContractReady,
  notifyContractApproved,
} from "./offerContractNotificationTriggers";
