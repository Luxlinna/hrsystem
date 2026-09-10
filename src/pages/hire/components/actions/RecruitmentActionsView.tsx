import { memo, useState } from "react";
import type { Candidate, Interview, HiringRequest, RecruitmentActionRole } from "../../types";
import { HrDivisionGuard } from "./HrDivisionGuard";
import { RecruitmentActionsHeader } from "./RecruitmentActionsHeader";
import { RecruitmentActionsMetrics, type ActionFilterSection } from "./RecruitmentActionsMetrics";
import { PendingCvReviewList } from "./PendingCvReviewList";
import { InterviewFeedbackDueList } from "./InterviewFeedbackDueList";
import { PendingApprovalsList } from "./PendingApprovalsList";

interface RecruitmentActionsViewProps {
  selectedRole: RecruitmentActionRole;
  onSelectRole: (role: RecruitmentActionRole) => void;
  defaultRole: RecruitmentActionRole;
  pendingCvReviews: Candidate[];
  feedbackDueInterviews: Interview[];
  pendingApprovals: HiringRequest[];
  counts: {
    cvReviews: number;
    feedbackDue: number;
    approvals: number;
    total: number;
  };
  isHrDivisionScope: boolean;
  onUpdateCandidateStage: (id: string, stage: string) => void;
  onOpenFeedback: (interview: Interview) => void;
  onOpenDecision: (request: HiringRequest, action: "approved" | "rejected") => void;
}

export const RecruitmentActionsView = memo(function RecruitmentActionsView({
  selectedRole,
  onSelectRole,
  defaultRole,
  pendingCvReviews,
  feedbackDueInterviews,
  pendingApprovals,
  counts,
  isHrDivisionScope,
  onUpdateCandidateStage,
  onOpenFeedback,
  onOpenDecision,
}: RecruitmentActionsViewProps) {
  const [filterSection, setFilterSection] = useState<ActionFilterSection>("all");

  if (!isHrDivisionScope) {
    return <HrDivisionGuard />;
  }

  return (
    <div className="space-y-6">
      <RecruitmentActionsHeader
        selectedRole={selectedRole}
        onSelectRole={onSelectRole}
        defaultRole={defaultRole}
        totalCount={counts.total}
      />

      <RecruitmentActionsMetrics
        counts={counts}
        filterSection={filterSection}
        onSelectFilterSection={setFilterSection}
      />

      {(filterSection === "all" || filterSection === "cv") && (
        <PendingCvReviewList
          candidates={pendingCvReviews}
          onUpdateCandidateStage={onUpdateCandidateStage}
        />
      )}

      {(filterSection === "all" || filterSection === "feedback") && (
        <InterviewFeedbackDueList
          interviews={feedbackDueInterviews}
          onOpenFeedback={onOpenFeedback}
        />
      )}

      {(filterSection === "all" || filterSection === "approvals") && (
        <PendingApprovalsList
          requests={pendingApprovals}
          onOpenDecision={onOpenDecision}
        />
      )}
    </div>
  );
});
