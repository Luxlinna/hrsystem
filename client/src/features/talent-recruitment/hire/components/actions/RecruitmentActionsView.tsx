import { memo, useState, useCallback } from "react";
import type { Candidate, Interview, HiringRequest, RecruitmentActionRole } from "../../types";
import { HrDivisionGuard } from "./HrDivisionGuard";
import { RecruitmentActionsHeader } from "./RecruitmentActionsHeader";
import { RecruitmentActionsMetrics, type ActionFilterSection } from "./RecruitmentActionsMetrics";
import { PendingCvReviewList } from "./PendingCvReviewList";
import { InterviewFeedbackDueList } from "./InterviewFeedbackDueList";
import { PendingApprovalsList } from "./PendingApprovalsList";

const SECTIONS_ORDER: ActionFilterSection[] = ["all", "cv", "feedback", "approvals"];

interface RecruitmentActionsViewProps {
  selectedRole: RecruitmentActionRole;
  onSelectRole: (role: RecruitmentActionRole) => void;
  defaultRole: RecruitmentActionRole | null;
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
  const [slideDir, setSlideDir] = useState<"right" | "left" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectFilterSection = useCallback(
    (sec: ActionFilterSection) => {
      const prevIdx = SECTIONS_ORDER.indexOf(filterSection);
      const nextIdx = SECTIONS_ORDER.indexOf(sec);
      setSlideDir(nextIdx >= prevIdx ? "right" : "left");
      setFilterSection(sec);
    },
    [filterSection]
  );

  if (!isHrDivisionScope) {
    return <HrDivisionGuard />;
  }

  const q = searchQuery.toLowerCase().trim();

  const filteredCvReviews = q
    ? pendingCvReviews.filter(
        (c) =>
          (c.full_name || "").toLowerCase().includes(q) ||
          (c.job_postings?.title || c.job_title || c.position || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q)
      )
    : pendingCvReviews;

  const filteredInterviews = q
    ? feedbackDueInterviews.filter(
        (iv) =>
          (iv.candidates?.full_name || "").toLowerCase().includes(q) ||
          (iv.type || "").toLowerCase().includes(q) ||
          (iv.candidates?.job_postings?.title || "").toLowerCase().includes(q) ||
          (iv.interviewer_name || "").toLowerCase().includes(q)
      )
    : feedbackDueInterviews;

  const filteredApprovals = q
    ? pendingApprovals.filter(
        (r) =>
          (r.title || "").toLowerCase().includes(q) ||
          (r.department || "").toLowerCase().includes(q) ||
          (r.requested_by_name || "").toLowerCase().includes(q)
      )
    : pendingApprovals;

  const animClass = slideDir === "right" ? "animate-cover-slide-right" : slideDir === "left" ? "animate-cover-slide-left" : "";

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
        onSelectFilterSection={handleSelectFilterSection}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Action Lists Presentation Stage */}
      <div className="relative w-full overflow-hidden">
        <div key={`${filterSection}-${slideDir || "init"}`} className={`space-y-6 ${animClass}`}>
          {(filterSection === "all" || filterSection === "cv") && (
            <PendingCvReviewList
              candidates={filteredCvReviews}
              onUpdateCandidateStage={onUpdateCandidateStage}
            />
          )}

          {(filterSection === "all" || filterSection === "feedback") && (
            <InterviewFeedbackDueList
              interviews={filteredInterviews}
              onOpenFeedback={onOpenFeedback}
            />
          )}

          {(filterSection === "all" || filterSection === "approvals") && (
            <PendingApprovalsList
              requests={filteredApprovals}
              onOpenDecision={onOpenDecision}
            />
          )}
        </div>
      </div>
    </div>
  );
});
