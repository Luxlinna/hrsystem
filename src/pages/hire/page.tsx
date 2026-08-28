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
import { JobModal } from "./components/modals/JobModal";
import { CandidateModal } from "./components/modals/CandidateModal";
import { InterviewModal } from "./components/modals/InterviewModal";
import { MoveToOnboardingModal } from "./components/modals/MoveToOnboardingModal";
import { FeedbackModal } from "./components/modals/FeedbackModal";
import { CreateHiringRequestModal } from "./components/modals/CreateHiringRequestModal";
import { DecisionHiringRequestModal } from "./components/modals/DecisionHiringRequestModal";
import { useHire } from "./hooks/useHire";

export default function HirePage() {
  const {
    jobs,
    candidates,
    interviews,
    branches,
    hiringRequests,
    loading,
    tab,
    setTab,
    canRequest,
    canApprove,
    isChairman,
    isSuperAdmin,
    jobViewMode,
    setJobViewMode,
    candidateViewMode,
    setCandidateViewMode,
    searchQuery,
    setSearchQuery,
    filterJobStatus,
    setFilterJobStatus,
    filterDepartment,
    setFilterDepartment,
    filterBranch,
    setFilterBranch,
    filterCandidateStage,
    setFilterCandidateStage,
    filterCandidateJob,
    setFilterCandidateJob,
    filterInterviewStatus,
    setFilterInterviewStatus,
    departments,
    filteredJobs,
    filteredCandidates,
    filteredInterviews,
    pipelineStageCounts,
    jobModal,
    setJobModal,
    editingJob,
    newJob,
    setNewJob,
    candidateModal,
    setCandidateModal,
    editingCandidate,
    newCandidate,
    setNewCandidate,
    resumeFile,
    setResumeFile,
    uploadingResume,
    interviewModal,
    setInterviewModal,
    editingInterview,
    newInterview,
    setNewInterview,
    schedulingInterview,
    onboardingModal,
    setOnboardingModal,
    onboardingCandidate,
    onboardingBranchId,
    setOnboardingBranchId,
    onboardingJoinDate,
    setOnboardingJoinDate,
    movingToOnboarding,
    feedbackModal,
    setFeedbackModal,
    feedbackInterview,
    feedbackScore,
    setFeedbackScore,
    feedbackNotes,
    setFeedbackNotes,
    savingFeedback,
    postingJob,
    showRequestModal,
    setShowRequestModal,
    requestForm,
    setRequestForm,
    submittingRequest,
    decisionModal,
    setDecisionModal,
    targetRequest,
    decisionAction,
    rejectionReason,
    setRejectionReason,
    processingDecision,
    openCreateRequest,
    openDecisionModal,
    handleCreateRequest,
    handleDecision,
    openCreateJob,
    openEditJob,
    openCreateCandidate,
    openEditCandidate,
    openCreateInterview,
    openEditInterview,
    openMoveToOnboarding,
    openFeedbackModal,
    handleSaveJob,
    handleSaveCandidate,
    handleSaveInterview,
    closeJob,
    reopenJob,
    deleteJob,
    updateCandidateStage,
    rateCandidate,
    deleteCandidate,
    handleMoveToOnboarding,
    uploadCandidateResume,
    deleteInterview,
    handleSaveFeedback,
  } = useHire();

  if (loading && jobs.length === 0 && candidates.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading recruitment operations...</p>
      </div>
    );
  }

  const activeJobsCount = jobs.filter((j) => j.status === "active").length;
  const hiredCount = candidates.filter((c) => c.stage === "hired").length;
  const pendingRequestsCount = hiringRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Workspace Header */}
      <HireHeader
        activeJobsCount={activeJobsCount}
        candidatesCount={candidates.length}
        activeTab={tab}
        onOpenCreateJob={openCreateJob}
        onOpenCreateCandidate={openCreateCandidate}
        onOpenCreateInterview={openCreateInterview}
      />

      {/* KPI Metric Summary Row */}
      <HireStatsRow
        activeJobsCount={activeJobsCount}
        candidatesCount={candidates.length}
        interviewsCount={interviews.length}
        hiredCount={hiredCount}
        onSelectTab={setTab}
      />

      {/* Navigation Tabs Bar */}
      <HireTabsBar
        activeTab={tab}
        setActiveTab={setTab}
        jobsCount={jobs.length}
        candidatesCount={candidates.length}
        interviewsCount={interviews.length}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Contextual Filter & Search Bar */}
      {tab !== "requests" && (
        <HireFilterBar
          activeTab={tab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterJobStatus={filterJobStatus}
          setFilterJobStatus={setFilterJobStatus}
          filterDepartment={filterDepartment}
          setFilterDepartment={setFilterDepartment}
          filterBranch={filterBranch}
          setFilterBranch={setFilterBranch}
          filterCandidateStage={filterCandidateStage}
          setFilterCandidateStage={setFilterCandidateStage}
          filterCandidateJob={filterCandidateJob}
          setFilterCandidateJob={setFilterCandidateJob}
          filterInterviewStatus={filterInterviewStatus}
          setFilterInterviewStatus={setFilterInterviewStatus}
          jobViewMode={jobViewMode}
          setJobViewMode={setJobViewMode}
          candidateViewMode={candidateViewMode}
          setCandidateViewMode={setCandidateViewMode}
          departments={departments}
          branches={branches}
          jobs={jobs}
        />
      )}

      {/* Tab Body Content */}
      {tab === "requests" && (
        <HiringRequestsTab
          requests={hiringRequests}
          canRequest={canRequest}
          canApprove={canApprove}
          isChairman={isChairman}
          onOpenCreate={() => openCreateRequest()}
          onOpenDecision={openDecisionModal}
        />
      )}

      {tab === "jobs" && (
        <JobsTabContent
          jobs={filteredJobs}
          candidates={candidates}
          viewMode={jobViewMode}
          onOpenCreateJob={openCreateJob}
          onEditJob={openEditJob}
          onCloseJob={closeJob}
          onReopenJob={reopenJob}
          onDeleteJob={deleteJob}
          onAddCandidate={openCreateCandidate}
        />
      )}

      {tab === "candidates" && (
        <CandidatesTabContent
          candidates={filteredCandidates}
          viewMode={candidateViewMode}
          onOpenCreateCandidate={openCreateCandidate}
          onUpdateStage={updateCandidateStage}
          onRate={rateCandidate}
          onMoveToOnboarding={openMoveToOnboarding}
          onUploadResume={uploadCandidateResume}
          onEdit={openEditCandidate}
          onDelete={deleteCandidate}
        />
      )}

      {tab === "interviews" && (
        <InterviewsTabContent
          interviews={filteredInterviews}
          onOpenCreateInterview={openCreateInterview}
          onOpenFeedback={openFeedbackModal}
          onEditInterview={openEditInterview}
          onDeleteInterview={deleteInterview}
        />
      )}

      {tab === "pipeline" && (
        <div className="space-y-6">
          <PipelineKanbanView
            candidates={filteredCandidates}
            onUpdateStage={updateCandidateStage}
            onMoveToOnboarding={openMoveToOnboarding}
          />
          <PipelineMetricsChart stageCounts={pipelineStageCounts} />
        </div>
      )}

      {/* Modals */}
      <CreateHiringRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        form={requestForm}
        setForm={setRequestForm}
        branches={branches}
        departments={departments}
        submitting={submittingRequest}
        onSubmit={handleCreateRequest}
        isSuperAdmin={isSuperAdmin}
      />

      <DecisionHiringRequestModal
        isOpen={decisionModal}
        onClose={() => setDecisionModal(false)}
        request={targetRequest}
        action={decisionAction}
        reason={rejectionReason}
        setReason={setRejectionReason}
        processing={processingDecision}
        onSubmit={handleDecision}
      />

      <JobModal
        isOpen={jobModal}
        editingJob={editingJob}
        form={newJob}
        setForm={setNewJob}
        branches={branches}
        postingJob={postingJob}
        onClose={() => setJobModal(false)}
        onSubmit={handleSaveJob}
      />

      <CandidateModal
        isOpen={candidateModal}
        editingCandidate={editingCandidate}
        form={newCandidate}
        setForm={setNewCandidate}
        jobs={jobs}
        resumeFile={resumeFile}
        setResumeFile={setResumeFile}
        uploadingResume={uploadingResume}
        onClose={() => setCandidateModal(false)}
        onSubmit={handleSaveCandidate}
      />

      <InterviewModal
        isOpen={interviewModal}
        editingInterview={editingInterview}
        form={newInterview}
        setForm={setNewInterview}
        candidates={candidates}
        schedulingInterview={schedulingInterview}
        onClose={() => setInterviewModal(false)}
        onSubmit={handleSaveInterview}
      />

      <MoveToOnboardingModal
        isOpen={onboardingModal}
        candidate={onboardingCandidate}
        branchId={onboardingBranchId}
        setBranchId={setOnboardingBranchId}
        joinDate={onboardingJoinDate}
        setJoinDate={setOnboardingJoinDate}
        branches={branches}
        jobs={jobs}
        moving={movingToOnboarding}
        onClose={() => setOnboardingModal(false)}
        onSubmit={(e) => {
          e.preventDefault();
          if (onboardingCandidate) {
            handleMoveToOnboarding(
              onboardingCandidate,
              onboardingBranchId,
              onboardingJoinDate,
              jobs.find((j) => j.id === onboardingCandidate.job_posting_id)
            ).then((success) => {
              if (success) setOnboardingModal(false);
            });
          }
        }}
      />

      <FeedbackModal
        isOpen={feedbackModal}
        interview={feedbackInterview}
        score={feedbackScore}
        setScore={setFeedbackScore}
        notes={feedbackNotes}
        setNotes={setFeedbackNotes}
        saving={savingFeedback}
        onClose={() => setFeedbackModal(false)}
        onSubmit={(e) => {
          e.preventDefault();
          if (feedbackInterview) {
            handleSaveFeedback(feedbackInterview.id, feedbackNotes, feedbackScore).then((success) => {
              if (success) setFeedbackModal(false);
            });
          }
        }}
      />
    </div>
  );
}
