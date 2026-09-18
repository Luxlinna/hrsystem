import { dispatchNotification } from "./notificationEngine";
import type { CandidateLike } from "./recruitmentNotificationTypes";

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
