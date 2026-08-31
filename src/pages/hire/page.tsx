import { HireHeader } from "./components/HireHeader";
import { HireTabsBar } from "./components/HireTabsBar";
import { HireStatsRow } from "./components/HireStatsRow";
import { HireFilterBar } from "./components/HireFilterBar";
import { JobsTabContent } from "./components/jobs/JobsTabContent";
import { CandidatesTabContent } from "./components/candidates/CandidatesTabContent";
import { InterviewsTabContent } from "./components/interviews/InterviewsTabContent";
import { PipelineKanbanView } from "./components/pipeline/PipelineKanbanView";
import { PipelineMetricsChart } from "./components/pipeline/PipelineMetricsChart";
import { HiringRequestsTab } from "./components/requests/HiringRequestsTab";
import { HireModalsContainer } from "./components/modals/HireModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useHire } from "./hooks/useHire";

export default function HirePage() {
  const h = useHire();

  if (h.loading && h.jobs.length === 0 && h.candidates.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading recruitment operations...</p>
      </div>
    );
  }

  if (h.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <HireHeader
          activeJobsCount={0}
          candidatesCount={0}
          activeTab={h.tab}
          canManage={false}
          onOpenCreateJob={() => {}}
          onOpenCreateCandidate={() => {}}
          onOpenCreateInterview={() => {}}
          onOpenCreateRequest={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Recruitment & Talent Acquisition"
          userBranchName={h.userBranchName}
          hasNoBranch={!h.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      <HireHeader
        activeJobsCount={h.jobs.filter((j) => j.status === "active").length || h.jobs.length}
        candidatesCount={h.candidates.length}
        activeTab={h.tab}
        canManage={h.canRequest}
        onOpenCreateJob={h.openCreateJob}
        onOpenCreateCandidate={() => h.openCreateCandidate()}
        onOpenCreateInterview={() => h.openCreateInterview()}
        onOpenCreateRequest={() => h.openCreateRequest()}
      />

      <HireTabsBar
        tab={h.tab}
        setTab={h.setTab}
        jobsCount={h.jobs.length}
        candidatesCount={h.candidates.length}
        interviewsCount={h.interviews.length}
        requestsCount={h.hiringRequests.length}
        pendingRequestsCount={h.hiringRequests.length}
        isChairman={h.isChairman}
      />

      {h.tab !== "requests" && (
        <>
          <HireStatsRow
            activeJobsCount={h.jobs.filter((j) => j.status === "active").length || h.jobs.length}
            candidatesCount={h.candidates.length}
            interviewsCount={h.interviews.length}
            hiredCount={h.candidates.filter((c) => c.stage === "hired").length}
            onSelectTab={h.setTab}
          />
          <HireFilterBar
            activeTab={h.tab}
            searchQuery={h.searchQuery}
            setSearchQuery={h.setSearchQuery}
            filterJobStatus={h.filterJobStatus}
            setFilterJobStatus={h.setFilterJobStatus}
            filterDepartment={h.filterDepartment}
            setFilterDepartment={h.setFilterDepartment}
            filterBranch={h.filterBranch}
            setFilterBranch={h.setFilterBranch}
            filterCandidateStage={h.filterCandidateStage}
            setFilterCandidateStage={h.setFilterCandidateStage}
            filterCandidateJob={h.filterCandidateJob}
            setFilterCandidateJob={h.setFilterCandidateJob}
            filterInterviewStatus={h.filterInterviewStatus}
            setFilterInterviewStatus={h.setFilterInterviewStatus}
            jobViewMode={h.jobViewMode}
            setJobViewMode={h.setJobViewMode}
            candidateViewMode={h.candidateViewMode}
            setCandidateViewMode={h.setCandidateViewMode}
            departments={h.departments}
            branches={h.branches}
            jobs={h.jobs}
          />
        </>
      )}

      {h.tab === "jobs" && (
        <JobsTabContent
          jobs={h.filteredJobs}
          candidates={h.candidates}
          viewMode={h.jobViewMode}
          onOpenCreateJob={h.openCreateJob}
          onEditJob={h.openEditJob}
          onCloseJob={h.closeJob}
          onReopenJob={h.reopenJob}
          onDeleteJob={h.deleteJob}
          onAddCandidate={(jobId) => h.openCreateCandidate(jobId)}
          onClearFilters={h.resetFilters}
          hasFilters={h.hasFilters}
        />
      )}

      {h.tab === "candidates" && (
        <CandidatesTabContent
          candidates={h.filteredCandidates}
          viewMode={h.candidateViewMode}
          canManage={h.canRequest}
          onOpenCreate={() => h.openCreateCandidate()}
          onOpenEdit={h.openEditCandidate}
          onUpdateStage={h.updateCandidateStage}
          onRate={h.rateCandidate}
          onDelete={h.deleteCandidate}
          onMoveToOnboarding={h.openMoveToOnboarding}
          onOpenInterview={(c) => h.openCreateInterview(c.id)}
        />
      )}

      {h.tab === "interviews" && (
        <InterviewsTabContent
          interviews={h.filteredInterviews}
          onOpenCreateInterview={() => h.openCreateInterview()}
          onEditInterview={h.openEditInterview}
          onOpenFeedback={h.openFeedbackModal}
          onDeleteInterview={(id) => {
            const match = h.interviews.find((i) => i.id === id);
            if (match) h.deleteInterview(match);
          }}
        />
      )}

      {h.tab === "pipeline" && (
        <div className="space-y-6">
          <PipelineKanbanView
            candidates={h.filteredCandidates}
            onUpdateStage={h.updateCandidateStage}
            onMoveToOnboarding={h.openMoveToOnboarding}
          />
          <PipelineMetricsChart stageCounts={h.pipelineStageCounts} />
        </div>
      )}

      {h.tab === "requests" && (
        <HiringRequestsTab
          requests={h.hiringRequests}
          canRequest={h.canRequest}
          canApprove={h.canApprove}
          canBranchApprove={h.canBranchApprove}
          canHrReview={h.canHrReview}
          canHrAdminApprove={h.canHrAdminApprove}
          canChairmanApprove={h.canChairmanApprove}
          isHrDivisionBranch={h.isHrDivisionBranch}
          userBranchId={h.userBranchId}
          isChairman={h.isChairman}
          isSuperAdmin={h.isSuperAdmin}
          isAdmin={h.isAdmin}
          actorName={h.actorName}
          actorEmail={h.actorEmail}
          myEmployeeId={h.myEmployeeId}
          onOpenCreate={() => h.openCreateRequest()}
          onOpenDecision={h.openDecisionModal}
          onDeleteRequest={h.handleDeleteRequest}
          onAssignHrOfficer={h.handleAssignHrOfficer}
        />
      )}

      <HireModalsContainer {...h} />
    </div>
  );
}
