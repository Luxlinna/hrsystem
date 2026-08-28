import { OffboardHeader } from "./components/OffboardHeader";
import { OffboardStatsRow } from "./components/OffboardStatsRow";
import { OffboardTabsBar } from "./components/OffboardTabsBar";
import { OffboardFilterBar } from "./components/OffboardFilterBar";
import { OffboardCardsView } from "./components/cards/OffboardCardsView";
import { OffboardListView } from "./components/list/OffboardListView";
import { AllTasksTabContent } from "./components/tasks/AllTasksTabContent";
import { OffboardAnalyticsTabContent } from "./components/analytics/OffboardAnalyticsTabContent";
import { CreateOffboardingModal } from "./components/modals/CreateOffboardingModal";
import { AddTaskModal } from "./components/modals/AddTaskModal";
import { EditOffboardingModal } from "./components/modals/EditOffboardingModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useOffboard } from "./hooks/useOffboard";

export default function Offboard() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    employees,
    branches,
    loading,
    tab,
    setTab,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterDepartment,
    setFilterDepartment,
    filterBranch,
    setFilterBranch,
    filterStatus,
    setFilterStatus,
    filterTaskType,
    setFilterTaskType,
    departments,
    activeOffboardings,
    completedOffboardings,
    filteredOffboardings,
    filteredTasks,
    totalActiveCount,
    inClearanceCount,
    totalCompletedCount,
    pendingTasksCount,
    overdueTasksCount,
    reasonChartData,
    deptChartData,
    createModal,
    setCreateModal,
    submitting,
    newForm,
    setNewForm,
    taskModal,
    setTaskModal,
    newTaskForm,
    setNewTaskForm,
    submittingTask,
    editingOffboarding,
    setEditingOffboarding,
    editForm,
    setEditForm,
    savingEdit,
    toggleTask,
    updateOffboardingStatus,
    deleteOffboarding,
    createOffboarding,
    handleAddTask,
    openEditModal,
    handleSaveEdit,
  } = useOffboard();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading offboarding dashboard...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <OffboardHeader onStartOffboarding={() => {}} />
        <PartnerBranchPrivacyShield
          moduleName="Offboarding Operations"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Header */}
      <OffboardHeader onStartOffboarding={() => setCreateModal(true)} />

      {/* KPI Stats Row */}
      <OffboardStatsRow
        totalActiveCount={totalActiveCount}
        inClearanceCount={inClearanceCount}
        totalCompletedCount={totalCompletedCount}
        pendingTasksCount={pendingTasksCount}
        overdueTasksCount={overdueTasksCount}
        tab={tab}
        filterStatus={filterStatus}
        onSelectTab={setTab}
        onFilterStatus={setFilterStatus}
      />

      {/* Navigation Tabs Bar */}
      <OffboardTabsBar
        tab={tab}
        setTab={setTab}
        activeCount={activeOffboardings.length}
        completedCount={completedOffboardings.length}
        tasksCount={filteredTasks.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Search & Multi-criteria Filter Bar */}
      <OffboardFilterBar
        tab={tab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        filterBranch={filterBranch}
        setFilterBranch={setFilterBranch}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterTaskType={filterTaskType}
        setFilterTaskType={setFilterTaskType}
        departments={departments}
        branches={branches}
      />

      {/* Tab 1: Active Departures & Tab 2: Completed Departures */}
      {(tab === "active" || tab === "completed") && (
        <>
          {viewMode === "cards" ? (
            <OffboardCardsView
              offboardings={filteredOffboardings}
              onUpdateStatus={updateOffboardingStatus}
              onToggleTask={toggleTask}
              onOpenAddTaskModal={(id) => setTaskModal({ open: true, offboardingId: id })}
              onOpenEditModal={openEditModal}
              onDeleteOffboarding={deleteOffboarding}
              onStartOffboarding={() => setCreateModal(true)}
            />
          ) : (
            <OffboardListView
              offboardings={filteredOffboardings}
              onOpenEditModal={openEditModal}
              onDeleteOffboarding={deleteOffboarding}
              onUpdateStatus={updateOffboardingStatus}
            />
          )}
        </>
      )}

      {/* Tab 3: All Tasks Backlog */}
      {tab === "tasks" && (
        <AllTasksTabContent
          tasks={filteredTasks}
          onToggleTask={toggleTask}
        />
      )}

      {/* Tab 4: Analytics Visualizations */}
      {tab === "analytics" && (
        <OffboardAnalyticsTabContent
          reasonChartData={reasonChartData}
          deptChartData={deptChartData}
        />
      )}

      {/* Create Offboarding Modal */}
      <CreateOffboardingModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        newForm={newForm}
        setNewForm={setNewForm}
        employees={employees}
        submitting={submitting}
        onSubmit={createOffboarding}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, offboardingId: null })}
        newTaskForm={newTaskForm}
        setNewTaskForm={setNewTaskForm}
        submitting={submittingTask}
        onSubmit={handleAddTask}
      />

      {/* Edit Offboarding Modal */}
      <EditOffboardingModal
        editingOffboarding={editingOffboarding}
        onClose={() => setEditingOffboarding(null)}
        editForm={editForm}
        setEditForm={setEditForm}
        savingEdit={savingEdit}
        onSubmit={handleSaveEdit}
      />
    </div>
  );
}
