import { OnboardingHeader } from "./components/OnboardingHeader";
import { OnboardingStatsRow } from "./components/OnboardingStatsRow";
import { OnboardingFilterBar } from "./components/OnboardingFilterBar";
import { OnboardingCardsView } from "./components/cards/OnboardingCardsView";
import { OnboardingKanbanView } from "./components/kanban/OnboardingKanbanView";
import { OnboardingTableView } from "./components/table/OnboardingTableView";
import { OnboardingModalsContainer } from "./components/modals/OnboardingModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useOnboarding } from "./hooks/useOnboarding";
import {
  exportOnboardingXLSX,
  exportOnboardingPDF,
} from "./exportUtils";

export default function Onboarding() {
  const o = useOnboarding();

  if (o.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading onboarding operations...</p>
      </div>
    );
  }

  if (o.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <OnboardingHeader
          onStartOnboarding={() => {}}
          requests={[]}
          documents={[]}
        />
        <PartnerBranchPrivacyShield
          moduleName="Onboarding"
          userBranchName={o.userBranchName}
          hasNoBranch={!o.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      <OnboardingHeader
        onStartOnboarding={o.openStartOnboarding}
        requests={o.filteredRequests}
        documents={o.documents}
      />

      <OnboardingStatsRow
        totalActive={o.totalActive}
        pendingApproval={o.pendingApproval}
        inDocStage={o.inDocStage}
        completed={o.completed}
        statusFilter={o.statusFilter}
        stageFilter={o.stageFilter}
        onFilterStatus={o.setStatusFilter}
        onFilterStage={o.setStageFilter}
      />

      <OnboardingFilterBar
        viewMode={o.viewMode}
        setViewMode={o.setViewMode}
        searchQuery={o.searchQuery}
        setSearchQuery={o.setSearchQuery}
        statusFilter={o.statusFilter}
        setStatusFilter={o.setStatusFilter}
        stageFilter={o.stageFilter}
        setStageFilter={o.setStageFilter}
        sortBy={o.sortBy}
        setSortBy={o.setSortBy}
      />

      {o.viewMode === "cards" && (
        <OnboardingCardsView
          requests={o.filteredRequests}
          documents={o.documents}
          expandedRequest={o.expandedRequest}
          onToggleExpand={o.setExpandedRequest}
          getDocsForRequestAndStage={o.getDocsForRequestAndStage}
          getStageProgress={o.getStageProgress}
          isStageComplete={o.isStageComplete}
          isDocOverdue={o.isDocOverdue}
          onApprove={o.handleApprove}
          onAdvanceStage={o.advanceStage}
          onRegressStage={o.regressStage}
          onCompleteOnboarding={o.completeOnboarding}
          onPopulateDefaultChecklist={o.handlePopulateDefaultChecklist}
          onDeleteRequest={o.handleDeleteRequest}
          onOpenDocModal={o.openDocModal}
          onOpenEditDocModal={o.openEditDocModal}
          onBulkSetDeadline={o.bulkSetStageDeadline}
          onRefresh={o.loadData}
          onStartOnboarding={o.openStartOnboarding}
        />
      )}

      {o.viewMode === "kanban" && (
        <OnboardingKanbanView
          requests={o.filteredRequests}
          documents={o.documents}
          onSelectRequest={(id) => {
            o.setViewMode("cards");
            o.setExpandedRequest(id);
          }}
          onAdvanceStage={o.advanceStage}
          onCompleteOnboarding={o.completeOnboarding}
        />
      )}

      {o.viewMode === "table" && (
        <OnboardingTableView
          requests={o.filteredRequests}
          documents={o.documents}
          onSelectRequest={(id) => {
            o.setViewMode("cards");
            o.setExpandedRequest(id);
          }}
          onApprove={o.handleApprove}
          onDeleteRequest={o.handleDeleteRequest}
        />
      )}

      <OnboardingModalsContainer {...o} />
    </div>
  );
}
