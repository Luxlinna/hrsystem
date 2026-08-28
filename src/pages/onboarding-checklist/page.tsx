import { ChecklistHeader } from "./components/ChecklistHeader";
import { CandidateDetailHeader } from "./components/CandidateDetailHeader";
import { ChecklistStatsRow } from "./components/ChecklistStatsRow";
import { ChecklistFilterBar } from "./components/ChecklistFilterBar";
import { ChecklistCandidateSidebar } from "./components/sidebar/ChecklistCandidateSidebar";
import { ChecklistCategoryView } from "./components/views/ChecklistCategoryView";
import { ChecklistListView } from "./components/views/ChecklistListView";
import { ChecklistUrgencyView } from "./components/views/ChecklistUrgencyView";
import { ChecklistModalsContainer } from "./components/ChecklistModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useOnboardingChecklist } from "./hooks/useOnboardingChecklist";

export default function OnboardingChecklist() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    tasks,
    staff,
    selectedHire,
    loading,
    completerName,
    getProgress,
    taskStats,
    categoriesPresent,
    isCategoryLocked,
    isTaskLocked,
    hireSearch,
    setHireSearch,
    hireStatusTab,
    setHireStatusTab,
    taskSearch,
    setTaskSearch,
    filterCategory,
    setFilterCategory,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    viewLayout,
    setViewLayout,
    filteredHires,
    displayTasks,
    toggling,
    submitting,
    populatingDefaults,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showDetailsModal,
    setShowDetailsModal,
    showExportModal,
    setShowExportModal,
    viewingTask,
    selectedTask,
    taskForm,
    setTaskForm,
    hireAuditLogs,
    loadingAuditLogs,
    toggleTask,
    handleQuickAssignToMe,
    handlePopulateDefaultTasks,
    handleMarkAllComplete,
    handleDeleteTask,
    handleAddTask,
    handleEditTask,
    openEditModal,
    openDetailsModal,
    loadHireAuditLogs,
    selectCandidate,
  } = useOnboardingChecklist();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading checklist hub...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <PartnerBranchPrivacyShield
          moduleName="Onboarding Checklist"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Header */}
      <ChecklistHeader
        selectedHire={selectedHire}
        populatingDefaults={populatingDefaults}
        onPopulateDefaultTasks={handlePopulateDefaultTasks}
        onOpenAddModal={() => setShowAddModal(true)}
        onOpenExportModal={() => setShowExportModal(true)}
        onOpenAuditLogs={loadHireAuditLogs}
      />

      {/* Candidate Progression & Warnings Detail Header */}
      <CandidateDetailHeader
        selectedHire={selectedHire}
        tasks={tasks}
        onOpenAddModal={() => setShowAddModal(true)}
        onOpenAuditLogs={loadHireAuditLogs}
      />

      {/* KPI Stats Row */}
      <ChecklistStatsRow
        stats={taskStats}
        filterStatus={filterStatus}
        filterPriority={filterPriority}
        onFilterStatus={setFilterStatus}
        onFilterPriority={setFilterPriority}
      />

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        <ChecklistCandidateSidebar
          hires={filteredHires}
          selectedHire={selectedHire}
          hireSearch={hireSearch}
          setHireSearch={setHireSearch}
          hireStatusTab={hireStatusTab}
          setHireStatusTab={setHireStatusTab}
          getProgress={getProgress}
          onSelectCandidate={selectCandidate}
        />

        <div className="flex-1 min-w-0 w-full space-y-4">
          <ChecklistFilterBar
            viewLayout={viewLayout}
            setViewLayout={setViewLayout}
            taskSearch={taskSearch}
            setTaskSearch={setTaskSearch}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />

          {viewLayout === "category" && (
            <ChecklistCategoryView
              categories={categoriesPresent}
              tasks={displayTasks}
              isCategoryLocked={isCategoryLocked}
              toggling={toggling}
              completerName={completerName}
              onToggle={toggleTask}
              onQuickAssign={handleQuickAssignToMe}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
              onViewDetails={openDetailsModal}
              onMarkAllComplete={handleMarkAllComplete}
              onOpenAddModal={(cat) => {
                setTaskForm({ ...taskForm, category: cat as any });
                setShowAddModal(true);
              }}
            />
          )}

          {viewLayout === "list" && (
            <ChecklistListView
              tasks={displayTasks}
              isTaskLocked={isTaskLocked}
              toggling={toggling}
              completerName={completerName}
              onToggle={toggleTask}
              onQuickAssign={handleQuickAssignToMe}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
              onViewDetails={openDetailsModal}
            />
          )}

          {viewLayout === "urgency" && (
            <ChecklistUrgencyView
              tasks={displayTasks}
              isTaskLocked={isTaskLocked}
              toggling={toggling}
              completerName={completerName}
              onToggle={toggleTask}
              onQuickAssign={handleQuickAssignToMe}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
              onViewDetails={openDetailsModal}
            />
          )}
        </div>
      </div>

      {/* Modals Container */}
      <ChecklistModalsContainer
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        showDetailsModal={showDetailsModal}
        setShowDetailsModal={setShowDetailsModal}
        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
        selectedHire={selectedHire}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        staff={staff}
        submitting={submitting}
        selectedTask={selectedTask}
        viewingTask={viewingTask}
        hireAuditLogs={hireAuditLogs}
        loadingAuditLogs={loadingAuditLogs}
        displayTasks={displayTasks}
        handleAddTask={handleAddTask}
        handleEditTask={handleEditTask}
        openEditModal={openEditModal}
      />
    </div>
  );
}