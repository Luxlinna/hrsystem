import { memo } from "react";
import { HireFilterBar } from "./HireFilterBar";
import { JobsTabContent } from "./jobs/JobsTabContent";
import { CandidatesTabContent } from "./candidates/CandidatesTabContent";
import { InterviewsTabContent } from "./interviews/InterviewsTabContent";
import { PipelineKanbanView } from "./pipeline/PipelineKanbanView";
import { PipelineMetricsChart } from "./pipeline/PipelineMetricsChart";
import { HiringRequestsTab } from "./requests/HiringRequestsTab";
import { RecruitmentActionsView } from "./actions/RecruitmentActionsView";
import { OffersTabContent } from "./offers/OffersTabContent";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface HireActiveTabContentProps {
  h: any;
  offersManager: any;
  slideDirection: "right" | "left" | null;
  onOpenImportModal: () => void;
}

export const HireActiveTabContent = memo(function HireActiveTabContent({
  h,
  offersManager,
  slideDirection,
  onOpenImportModal,
}: HireActiveTabContentProps) {
  const isFilterBarVisible = h.tab !== "requests" && h.tab !== "actions" && h.tab !== "offers";
  const animClass = slideDirection === "right" ? "animate-cover-slide-right" : slideDirection === "left" ? "animate-cover-slide-left" : "";
  const jobAnim = h.jobStatusSlideDir === "right" ? "animate-cover-slide-right" : h.jobStatusSlideDir === "left" ? "animate-cover-slide-left" : "";
  const candAnim = h.stageSlideDir === "right" ? "animate-cover-slide-right" : h.stageSlideDir === "left" ? "animate-cover-slide-left" : "";
  const ivAnim = h.interviewStatusSlideDir === "right" ? "animate-cover-slide-right" : h.interviewStatusSlideDir === "left" ? "animate-cover-slide-left" : "";

  return (
    <div className="relative w-full overflow-hidden">
      <div key={`${h.tab}-${slideDirection || "init"}`} className={`w-full ${animClass}`}>
        {isFilterBarVisible && (
          <HireFilterBar
            activeTab={h.tab} searchQuery={h.searchQuery} setSearchQuery={h.setSearchQuery}
            filterJobStatus={h.filterJobStatus} setFilterJobStatus={h.setFilterJobStatus}
            filterDepartment={h.filterDepartment} setFilterDepartment={h.setFilterDepartment}
            filterBranch={h.filterBranch} setFilterBranch={h.setFilterBranch}
            filterCandidateStage={h.filterCandidateStage} setFilterCandidateStage={h.setFilterCandidateStage}
            filterCandidateJob={h.filterCandidateJob} setFilterCandidateJob={h.setFilterCandidateJob}
            filterInterviewStatus={h.filterInterviewStatus} setFilterInterviewStatus={h.setFilterInterviewStatus}
            jobViewMode={h.jobViewMode} setJobViewMode={h.setJobViewMode}
            candidateViewMode={h.candidateViewMode} setCandidateViewMode={h.setCandidateViewMode}
            departments={h.departments} branches={h.branches} jobs={h.jobs}
          />
        )}

        {h.tab === "actions" && (
          <RecruitmentActionsView
            selectedRole={h.recruitmentActions.selectedRole} onSelectRole={h.recruitmentActions.setSelectedRole}
            defaultRole={h.recruitmentActions.defaultRole} pendingCvReviews={h.recruitmentActions.pendingCvReviews}
            feedbackDueInterviews={h.recruitmentActions.feedbackDueInterviews} pendingApprovals={h.recruitmentActions.pendingApprovals}
            counts={h.recruitmentActions.counts} isHrDivisionScope={h.isHrDivisionScope}
            onUpdateCandidateStage={h.updateCandidateStage} onOpenFeedback={h.openFeedbackModal} onOpenDecision={h.openDecisionModal}
          />
        )}

        {h.tab === "jobs" && (
          <div key={`${h.filterJobStatus}-${h.jobStatusSlideDir || "init"}-${h.jobViewMode}`} className={jobAnim}>
            <JobsTabContent
              jobs={h.filteredJobs} candidates={h.candidates} viewMode={h.jobViewMode}
              onOpenCreateJob={h.openCreateJob} onEditJob={h.openEditJob} onCloseJob={h.closeJob}
              onReopenJob={h.reopenJob} onDeleteJob={h.deleteJob}
              onAddCandidate={h.isAdminOrRecruiter ? (jobId) => h.openCreateCandidate(jobId) : undefined}
              onClearFilters={h.resetFilters} hasFilters={h.hasFilters}
            />
          </div>
        )}

        {h.tab === "candidates" && (
          <div key={`${h.filterCandidateStage}-${h.stageSlideDir || "init"}-${h.filterCandidateJob}-${h.candidateViewMode}`} className={candAnim}>
            <CandidatesTabContent
              candidates={h.filteredCandidates} viewMode={h.candidateViewMode} canManage={h.isAdminOrRecruiter}
              onOpenCreate={() => h.openCreateCandidate()} onOpenEdit={h.openEditCandidate}
              onUpdateStage={h.updateCandidateStage} onRate={h.rateCandidate} onDelete={h.deleteCandidate}
              onUploadResume={async (id: string, file: File) => {
                const url = await h.uploadCandidateResume(file);
                if (url) {
                  await supabase.from("candidates").update({ resume_url: url }).eq("id", id);
                  h.loadData();
                  toast("Resume Uploaded", "Candidate resume updated successfully.", "success");
                }
              }}
              onMoveToOnboarding={h.openMoveToOnboarding} onOpenInterview={(c) => h.openCreateInterview(c.id)}
              onOpenImport={h.isAdminOrRecruiter ? onOpenImportModal : undefined}
            />
          </div>
        )}

        {h.tab === "interviews" && (
          <div key={`${h.filterInterviewStatus}-${h.interviewStatusSlideDir || "init"}`} className={ivAnim}>
            <InterviewsTabContent
              interviews={h.filteredInterviews} onOpenCreateInterview={() => h.openCreateInterview()}
              onEditInterview={h.openEditInterview} onOpenFeedback={h.openFeedbackModal}
              onDeleteInterview={(id) => { const match = h.interviews.find((i) => i.id === id); if (match) h.deleteInterview(match); }}
              myEmployeeId={h.myEmployeeId} actorName={h.actorName} isAdminOrRecruiter={h.isAdminOrRecruiter}
            />
          </div>
        )}

        {h.tab === "pipeline" && (
          <div className="space-y-6">
            <PipelineKanbanView candidates={h.filteredCandidates} onUpdateStage={h.updateCandidateStage} onMoveToOnboarding={h.openMoveToOnboarding} />
            <PipelineMetricsChart stageCounts={h.pipelineStageCounts} />
          </div>
        )}

        {h.tab === "requests" && (
          <HiringRequestsTab
            requests={h.hiringRequests} canRequest={h.canRequest} canApprove={h.canApprove}
            canBranchApprove={h.canBranchApprove} canHrReview={h.canHrReview} canHrAdminApprove={h.canHrAdminApprove}
            canChairmanApprove={h.canChairmanApprove} isHrDivisionBranch={h.isHrDivisionBranch} userBranchId={h.userBranchId}
            isChairman={h.isChairman} isSuperAdmin={h.isSuperAdmin} isAdmin={h.isAdmin}
            actorName={h.actorName} actorEmail={h.actorEmail} myEmployeeId={h.myEmployeeId}
            onOpenCreate={() => h.openCreateRequest()} onOpenDecision={h.openDecisionModal}
            onDeleteRequest={h.handleDeleteRequest} onAssignHrOfficer={h.handleAssignHrOfficer}
          />
        )}

        {h.tab === "offers" && (
          <OffersTabContent
            offers={offersManager.offers} loading={offersManager.loading} candidates={h.candidates}
            hiringRequests={h.hiringRequests} onOpenCreateProposal={offersManager.openCreateProposal}
            onOpenWorkflowModal={offersManager.openWorkflowModal} onGenerateDraft={offersManager.handleGenerateDraft}
            onExportPdf={offersManager.handleExportPdf} onExportWord={offersManager.handleExportWord} onDeleteOffer={offersManager.handleDeleteOffer}
          />
        )}
      </div>
    </div>
  );
});
