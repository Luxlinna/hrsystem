import { OnboardingHeader } from "./components/OnboardingHeader";
import { OnboardingStatsRow } from "./components/OnboardingStatsRow";
import { OnboardingFilterBar } from "./components/OnboardingFilterBar";
import { OnboardingCardsView } from "./components/cards/OnboardingCardsView";
import { OnboardingKanbanView } from "./components/kanban/OnboardingKanbanView";
import { OnboardingTableView } from "./components/table/OnboardingTableView";
import { StartOnboardingModal } from "./components/modals/StartOnboardingModal";
import { OnboardingDocModal } from "./components/modals/OnboardingDocModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useOnboarding } from "./hooks/useOnboarding";

export default function Onboarding() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    documents,
    loading,
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    expandedRequest,
    setExpandedRequest,
    filteredRequests,
    totalActive,
    pendingApproval,
    inDocStage,
    completed,
    getDocsForRequestAndStage,
    getStageProgress,
    isStageComplete,
    isDocOverdue,
    eligibleEmployees,
    filteredEligibleEmployees,
    showStartModal,
    setShowStartModal,
    startEmployeeId,
    setStartEmployeeId,
    empSearch,
    setEmpSearch,
    starting,
    openStartOnboarding,
    handleStartOnboarding,
    handleDeleteRequest,
    handlePopulateDefaultChecklist,
    handleApprove,
    advanceStage,
    regressStage,
    completeOnboarding,
    showDocModal,
    setShowDocModal,
    selectedRequest,
    selectedStage,
    docForm,
    setDocForm,
    selectedFileName,
    editingDocId,
    uploading,
    isDragOver,
    setIsDragOver,
    fileInputRef,
    openDocModal,
    openEditDocModal,
    handleDocUpload,
    bulkSetStageDeadline,
    loadData,
  } = useOnboarding();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading onboarding operations...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <OnboardingHeader onStartOnboarding={() => {}} />
        <PartnerBranchPrivacyShield
          moduleName="Onboarding"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Header */}
      <OnboardingHeader onStartOnboarding={openStartOnboarding} />

      {/* KPI Stats Bar */}
      <OnboardingStatsRow
        totalActive={totalActive}
        pendingApproval={pendingApproval}
        inDocStage={inDocStage}
        completed={completed}
        statusFilter={statusFilter}
        stageFilter={stageFilter}
        onFilterStatus={setStatusFilter}
        onFilterStage={setStageFilter}
      />

      {/* Filter & View Switcher Bar */}
      <OnboardingFilterBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stageFilter={stageFilter}
        setStageFilter={setStageFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* View 1: Cards View */}
      {viewMode === "cards" && (
        <OnboardingCardsView
          requests={filteredRequests}
          documents={documents}
          expandedRequest={expandedRequest}
          onToggleExpand={setExpandedRequest}
          getDocsForRequestAndStage={getDocsForRequestAndStage}
          getStageProgress={getStageProgress}
          isStageComplete={isStageComplete}
          isDocOverdue={isDocOverdue}
          onApprove={handleApprove}
          onAdvanceStage={advanceStage}
          onRegressStage={regressStage}
          onCompleteOnboarding={completeOnboarding}
          onPopulateDefaultChecklist={handlePopulateDefaultChecklist}
          onDeleteRequest={handleDeleteRequest}
          onOpenDocModal={openDocModal}
          onOpenEditDocModal={openEditDocModal}
          onBulkSetDeadline={bulkSetStageDeadline}
          onRefresh={loadData}
          onStartOnboarding={openStartOnboarding}
        />
      )}

      {/* View 2: Kanban View */}
      {viewMode === "kanban" && (
        <OnboardingKanbanView
          requests={filteredRequests}
          documents={documents}
          onSelectRequest={(id) => {
            setViewMode("cards");
            setExpandedRequest(id);
          }}
          onAdvanceStage={advanceStage}
          onCompleteOnboarding={completeOnboarding}
        />
      )}

      {/* View 3: Table View */}
      {viewMode === "table" && (
        <OnboardingTableView
          requests={filteredRequests}
          documents={documents}
          onSelectRequest={(id) => {
            setViewMode("cards");
            setExpandedRequest(id);
          }}
          onApprove={handleApprove}
          onDeleteRequest={handleDeleteRequest}
        />
      )}

      {/* Start Onboarding Modal */}
      <StartOnboardingModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        startEmployeeId={startEmployeeId}
        setStartEmployeeId={setStartEmployeeId}
        empSearch={empSearch}
        setEmpSearch={setEmpSearch}
        filteredEligibleEmployees={filteredEligibleEmployees}
        eligibleCount={eligibleEmployees.length}
        starting={starting}
        onSubmit={handleStartOnboarding}
      />

      {/* Onboarding Doc / Checklist Item Modal */}
      <OnboardingDocModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        selectedRequest={selectedRequest}
        selectedStage={selectedStage}
        docForm={docForm}
        setDocForm={setDocForm}
        selectedFileName={selectedFileName}
        editingDocId={editingDocId}
        uploading={uploading}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        fileInputRef={fileInputRef}
        onSubmit={handleDocUpload}
      />
    </div>
  );
}
