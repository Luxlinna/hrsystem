import { useState, useMemo } from "react";
import type { Candidate, Interview, HiringRequest, RecruitmentActionRole } from "../types";

export const ROLE_INFO: Record<
  RecruitmentActionRole,
  { label: string; icon: string; description: string; scopeBadge: string }
> = {
  hiring_manager: {
    label: "Hiring Manager",
    icon: "ri-user-star-line",
    description: "Initial screening of department applicants, conducting technical/manager interviews, and department requisition follow-ups.",
    scopeBadge: "Department / Vacancy Scope",
  },
  manager: {
    label: "Manager",
    icon: "ri-briefcase-line",
    description: "Reviews CVs for departmental vacancies, provides panel interview feedback, and signs off Stage 1 headcount requisitions.",
    scopeBadge: "Departmental Unit Scope",
  },
  hr_manager: {
    label: "HR Manager",
    icon: "ri-team-line",
    description: "Enterprise candidate screening across HR Division, HR interview rounds, and Stage 2 Requisition compliance reviews.",
    scopeBadge: "HR Operations Scope",
  },
  hr_director: {
    label: "HR Director",
    icon: "ri-shield-star-line",
    description: "Senior candidate evaluations, salary negotiations sign-off, and Stage 3 HR administrative requisition authorizations.",
    scopeBadge: "HR Executive Scope",
  },
  ceo_director: {
    label: "CEO / Division Director",
    icon: "ri-government-line",
    description: "Final interview evaluations, executive division headcount decisions, and senior talent acquisitions.",
    scopeBadge: "Division Executive Scope",
  },
  chairwoman: {
    label: "Chairwoman",
    icon: "ri-vip-crown-line",
    description: "Final Stage 4 Executive Authorization to activate job openings and key strategic leadership talent approvals.",
    scopeBadge: "Supreme Governance Scope",
  },
};

export function detectRecruitmentRole(
  actorRole: string,
  myEmployeeRole?: string | null
): RecruitmentActionRole {
  const combined = `${actorRole || ""} ${myEmployeeRole || ""}`.toLowerCase();
  if (/chair|board/i.test(combined)) return "chairwoman";
  if (/ceo|president|division\s*director/i.test(combined)) return "ceo_director";
  if (/hr\s*director|head\s*of\s*hr/i.test(combined)) return "hr_director";
  if (/hr\s*manager|recruiter|talent|hr\s*specialist|hr\s*officer/i.test(combined)) return "hr_manager";
  if (/hiring\s*manager/i.test(combined)) return "hiring_manager";
  if (/manager|supervisor|lead|head/i.test(combined)) return "manager";
  return "hr_manager";
}

interface UseRecruitmentActionsProps {
  candidates: Candidate[];
  interviews: Interview[];
  hiringRequests: HiringRequest[];
  actorRole: string;
  myEmployeeRole?: string | null;
  myEmployeeId?: string | null;
  myDepartment?: string | null;
  isHrDivisionScope: boolean;
}

export function useRecruitmentActions({
  candidates,
  interviews,
  hiringRequests,
  actorRole,
  myEmployeeRole,
  myEmployeeId,
  myDepartment,
  isHrDivisionScope,
}: UseRecruitmentActionsProps) {
  const defaultRole = useMemo(
    () => detectRecruitmentRole(actorRole, myEmployeeRole),
    [actorRole, myEmployeeRole]
  );

  const [selectedRole, setSelectedRole] = useState<RecruitmentActionRole>(defaultRole);

  // 1. Pending CV Review Items
  const pendingCvReviews = useMemo(() => {
    if (!isHrDivisionScope) return [];

    return candidates.filter((c) => {
      const normStage =
        c.stage === "applied" ? "cv_received" : c.stage === "interview" ? "hr_interview" : c.stage;
      const dept = c.job_postings?.department || "";
      const isMyDept = Boolean(
        myDepartment && dept.toLowerCase() === myDepartment.toLowerCase()
      );

      switch (selectedRole) {
        case "hiring_manager":
          // Candidates in early review for this hiring manager's department
          return (
            (normStage === "cv_received" || normStage === "screening") &&
            (isMyDept || !myDepartment)
          );

        case "manager":
          // Candidates in early review for their department
          return (
            (normStage === "cv_received" || normStage === "screening") &&
            (isMyDept || !myDepartment)
          );

        case "hr_manager":
          // Candidates needing initial recruiter / HR screening or assigned to this recruiter
          return (
            normStage === "cv_received" ||
            normStage === "screening" ||
            (normStage === "shortlisted" && c.assigned_recruiter_id === myEmployeeId)
          );

        case "hr_director":
          // Candidates shortlisted or in salary negotiation needing HR leadership review
          return (
            normStage === "shortlisted" ||
            normStage === "selected" ||
            normStage === "salary_negotiation"
          );

        case "ceo_director":
          // High-level candidates reaching final round or selected
          return normStage === "final_interview" || normStage === "selected";

        case "chairwoman":
          // Key candidates in final interview, selected, or offer
          return (
            normStage === "final_interview" ||
            normStage === "selected" ||
            normStage === "offer"
          );

        default:
          return false;
      }
    });
  }, [candidates, selectedRole, isHrDivisionScope, myDepartment, myEmployeeId]);

  // 2. Interview Feedback Due Items
  const feedbackDueInterviews = useMemo(() => {
    if (!isHrDivisionScope) return [];

    return interviews.filter((iv) => {
      if (iv.status === "cancelled") return false;
      const hasFeedback = Boolean(iv.feedback && iv.feedback.trim().length > 0);
      if (hasFeedback) return false;

      const candDept = iv.candidates?.job_postings?.department || "";
      const isMyDept = Boolean(
        myDepartment && candDept.toLowerCase() === myDepartment.toLowerCase()
      );
      const isMyInterview = Boolean(myEmployeeId && iv.employees?.id === myEmployeeId);
      const interviewType = (iv.type || "").toLowerCase();

      switch (selectedRole) {
        case "hiring_manager":
          // Interviews where this hiring manager is assigned or technical/manager rounds
          return (
            isMyInterview ||
            interviewType.includes("hiring") ||
            interviewType.includes("technical") ||
            (isMyDept && !iv.employees?.id)
          );

        case "manager":
          // Interviews assigned to this manager or departmental interviews
          return isMyInterview || (isMyDept && !iv.employees?.id);

        case "hr_manager":
          // HR interviews missing feedback or assigned to HR
          return (
            interviewType.includes("hr") ||
            interviewType.includes("screening") ||
            isMyInterview
          );

        case "hr_director":
          // Overdue interviews across the division needing escalation or senior interviews
          return Boolean(
            isMyInterview ||
              (iv.scheduled_at && new Date(iv.scheduled_at).getTime() < Date.now())
          );

        case "ceo_director":
          // Executive / Final round interviews
          return (
            isMyInterview ||
            interviewType.includes("final") ||
            interviewType.includes("executive")
          );

        case "chairwoman":
          // Board / Chairwoman round interviews
          return (
            isMyInterview ||
            interviewType.includes("board") ||
            interviewType.includes("final")
          );

        default:
          return false;
      }
    });
  }, [interviews, selectedRole, isHrDivisionScope, myDepartment, myEmployeeId]);

  // 3. Approval Pending Items (Hiring Requests at the role's approval stage)
  const pendingApprovals = useMemo(() => {
    if (!isHrDivisionScope) return [];

    return hiringRequests.filter((req) => {
      const status = req.status || "pending";
      const reqDept = req.department || "";
      const isMyDept = Boolean(
        myDepartment && reqDept.toLowerCase() === myDepartment.toLowerCase()
      );

      switch (selectedRole) {
        case "hiring_manager":
        case "manager":
          // Stage 1: Branch / Department approval
          return (
            (status === "pending" || status === "pending_branch_review") &&
            (isMyDept || !myDepartment)
          );

        case "hr_manager":
          // Stage 2: HR Review
          return status === "pending_hr_review";

        case "hr_director":
          // Stage 3: HR Admin Review (or pending HR review requiring sign-off)
          return (
            status === "pending_hr_admin_review" || status === "pending_hr_review"
          );

        case "ceo_director":
          // Division / Executive endorsement
          return (
            status === "pending_branch_review" || status === "pending_chairman_review"
          );

        case "chairwoman":
          // Stage 4: Chairwoman Final Authorization
          return status === "pending_chairman_review";

        default:
          return false;
      }
    });
  }, [hiringRequests, selectedRole, isHrDivisionScope, myDepartment]);

  const counts = useMemo(() => {
    return {
      cvReviews: pendingCvReviews.length,
      feedbackDue: feedbackDueInterviews.length,
      approvals: pendingApprovals.length,
      total:
        pendingCvReviews.length +
        feedbackDueInterviews.length +
        pendingApprovals.length,
    };
  }, [pendingCvReviews, feedbackDueInterviews, pendingApprovals]);

  return {
    selectedRole,
    setSelectedRole,
    defaultRole,
    roleInfo: ROLE_INFO[selectedRole],
    pendingCvReviews,
    feedbackDueInterviews,
    pendingApprovals,
    counts,
    isHrDivisionScope,
  };
}
