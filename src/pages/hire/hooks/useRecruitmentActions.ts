import { useState, useMemo } from "react";
import type { Candidate, Interview, HiringRequest, RecruitmentActionRole } from "../types";
import { ROLE_INFO, detectRecruitmentRole } from "../utils/recruitmentRoleConfig";
import {
  isCandidatePendingCvReview,
  isInterviewFeedbackDue,
  isHiringRequestPendingApproval,
} from "../utils/recruitmentActionFilters";

export { ROLE_INFO, detectRecruitmentRole };

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
    return candidates.filter((c) =>
      isCandidatePendingCvReview(c, selectedRole, myDepartment, myEmployeeId)
    );
  }, [candidates, selectedRole, isHrDivisionScope, myDepartment, myEmployeeId]);

  // 2. Interview Feedback Due Items
  const feedbackDueInterviews = useMemo(() => {
    if (!isHrDivisionScope) return [];
    return interviews.filter((iv) =>
      isInterviewFeedbackDue(iv, selectedRole, myDepartment, myEmployeeId)
    );
  }, [interviews, selectedRole, isHrDivisionScope, myDepartment, myEmployeeId]);

  // 3. Approval Pending Items (Hiring Requests at the role's approval stage)
  const pendingApprovals = useMemo(() => {
    if (!isHrDivisionScope) return [];
    return hiringRequests.filter((req) =>
      isHiringRequestPendingApproval(req, selectedRole, myDepartment)
    );
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
