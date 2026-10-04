import type { Candidate, Interview, HiringRequest, RecruitmentActionRole } from "../types";
import { isUserInvitedToInterview } from "./interviewPanelHelper";

export function isCandidatePendingCvReview(
  c: Candidate,
  selectedRole: RecruitmentActionRole,
  myDepartment?: string | null,
  myEmployeeId?: string | null
): boolean {
  const normStage =
    c.stage === "applied" ? "cv_received" : c.stage === "interview" ? "hr_interview" : c.stage;
  const dept = c.job_postings?.department || "";
  const isMyDept = Boolean(
    myDepartment && dept.toLowerCase() === myDepartment.toLowerCase()
  );

  switch (selectedRole) {
    case "hiring_manager":
    case "manager":
      return (
        (normStage === "cv_received" || normStage === "screening") &&
        (isMyDept || !myDepartment)
      );

    case "hr_manager":
      return (
        normStage === "cv_received" ||
        normStage === "screening" ||
        (normStage === "shortlisted" && c.assigned_recruiter_id === myEmployeeId)
      );

    case "hr_director":
      return (
        normStage === "shortlisted" ||
        normStage === "selected" ||
        normStage === "salary_negotiation"
      );

    case "ceo_director":
      return normStage === "final_interview" || normStage === "selected";

    case "chairwoman":
      return (
        normStage === "final_interview" ||
        normStage === "selected" ||
        normStage === "offer"
      );

    default:
      return false;
  }
}

export function isInterviewFeedbackDue(
  iv: Interview,
  selectedRole: RecruitmentActionRole,
  myDepartment?: string | null,
  myEmployeeId?: string | null
): boolean {
  if (iv.status === "cancelled") return false;
  const hasFeedback = Boolean(iv.feedback && iv.feedback.trim().length > 0);
  if (hasFeedback) return false;

  const candDept = iv.candidates?.job_postings?.department || "";
  const isMyDept = Boolean(
    myDepartment && candDept.toLowerCase() === myDepartment.toLowerCase()
  );
  const isMyInterview = isUserInvitedToInterview({
    interview: iv,
    candidate: iv.candidates as any,
    myEmployeeId,
    actorName: null,
    isAdminOrRecruiter: false,
  });
  const interviewType = (iv.type || "").toLowerCase();

  switch (selectedRole) {
    case "hiring_manager":
      return (
        isMyInterview ||
        interviewType.includes("hiring") ||
        interviewType.includes("technical") ||
        (isMyDept && !iv.employees?.id)
      );

    case "manager":
      return isMyInterview || (isMyDept && !iv.employees?.id);

    case "hr_manager":
      return (
        interviewType.includes("hr") ||
        interviewType.includes("screening") ||
        isMyInterview
      );

    case "hr_director":
      return Boolean(
        isMyInterview ||
          (iv.scheduled_at && new Date(iv.scheduled_at).getTime() < Date.now())
      );

    case "ceo_director":
      return (
        isMyInterview ||
        interviewType.includes("final") ||
        interviewType.includes("executive")
      );

    case "chairwoman":
      return (
        isMyInterview ||
        interviewType.includes("board") ||
        interviewType.includes("final")
      );

    default:
      return false;
  }
}

export function isHiringRequestPendingApproval(
  req: HiringRequest,
  selectedRole: RecruitmentActionRole,
  myDepartment?: string | null
): boolean {
  const status = req.status || "pending";
  const reqDept = req.department || "";
  const isMyDept = Boolean(
    myDepartment && reqDept.toLowerCase() === myDepartment.toLowerCase()
  );

  switch (selectedRole) {
    case "hiring_manager":
    case "manager":
      return (
        (status === "pending" || status === "pending_branch_review") &&
        (isMyDept || !myDepartment)
      );

    case "hr_manager":
      return status === "pending_hr_review";

    case "hr_director":
      return status === "pending_hr_admin_review";

    case "ceo_director":
      return (
        status === "pending_branch_review" || status === "pending_chairman_review"
      );

    case "chairwoman":
      return status === "pending_chairman_review";

    default:
      return false;
  }
}
