import { OffboardHeader } from "./components/OffboardHeader";
import { OffboardStatsRow } from "./components/OffboardStatsRow";
import { OffboardTabsBar } from "./components/OffboardTabsBar";
import { OffboardFilterBar } from "./components/OffboardFilterBar";
import { OffboardCardsView } from "./components/cards/OffboardCardsView";
import { OffboardListView } from "./components/list/OffboardListView";
import { AllTasksTabContent } from "./components/tasks/AllTasksTabContent";
import { OffboardAnalyticsTabContent } from "./components/analytics/OffboardAnalyticsTabContent";
import { OffboardModalsContainer } from "./components/modals/OffboardModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useOffboard } from "./hooks/useOffboard";

export default function Offboard() {
  const o = useOffboard();

  if (o.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading offboarding dashboard...</p>
      </div>
    );
  }

  if (o.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <OffboardHeader onStartOffboarding={() => {}} />
        <PartnerBranchPrivacyShield
          moduleName="Offboarding Operations"
          userBranchName={o.userBranchName}
          hasNoBranch={!o.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      <OffboardHeader onStartOffboarding={() => o.setCreateModal(true)} />

      <OffboardStatsRow
        totalActiveCount={o.totalActiveCount}
        inClearanceCount={o.inClearanceCount}
        totalCompletedCount={o.totalCompletedCount}
        pendingTasksCount={o.pendingTasksCount}
        overdueTasksCount={o.overdueTasksCount}
        tab={o.tab}
        filterStatus={o.filterStatus}
        onSelectTab={o.setTab}
        onFilterStatus={o.setFilterStatus}
      />

      <OffboardTabsBar
        tab={o.tab}
        setTab={o.setTab}
        activeCount={o.activeOffboardings.length}
        completedCount={o.completedOffboardings.length}
        tasksCount={o.filteredTasks.length}
        viewMode={o.viewMode}
        setViewMode={o.setViewMode}
      />

      <OffboardFilterBar
        tab={o.tab}
        searchQuery={o.searchQuery}
        setSearchQuery={o.setSearchQuery}
        filterDepartment={o.filterDepartment}
        setFilterDepartment={o.setFilterDepartment}
        filterBranch={o.filterBranch}
        setFilterBranch={o.setFilterBranch}
        filterStatus={o.filterStatus}
        setFilterStatus={o.setFilterStatus}
        filterTaskType={o.filterTaskType}
        setFilterTaskType={o.setFilterTaskType}
        departments={o.departments}
        branches={o.branches}
      />

      {(o.tab === "active" || o.tab === "completed") && (
        <>
          {o.viewMode === "cards" ? (
            <OffboardCardsView
              offboardings={o.filteredOffboardings}
              onUpdateStatus={o.updateOffboardingStatus}
              onToggleTask={o.toggleTask}
              onOpenAddTaskModal={(id) => o.setTaskModal({ open: true, offboardingId: id })}
              onOpenEditModal={o.openEditModal}
              onDeleteOffboarding={o.deleteOffboarding}
              onStartOffboarding={() => o.setCreateModal(true)}
            />
          ) : (
            <OffboardListView
              offboardings={o.filteredOffboardings}
              onOpenEditModal={o.openEditModal}
              onDeleteOffboarding={o.deleteOffboarding}
              onUpdateStatus={o.updateOffboardingStatus}
            />
          )}
        </>
      )}

      {o.tab === "tasks" && (
        <AllTasksTabContent
          tasks={o.filteredTasks}
          onToggleTask={o.toggleTask}
        />
      )}

      {o.tab === "analytics" && (
        <OffboardAnalyticsTabContent
          reasonChartData={o.reasonChartData}
          deptChartData={o.deptChartData}
        />
      )}

      <OffboardModalsContainer {...o} />
    </div>
  );
}
