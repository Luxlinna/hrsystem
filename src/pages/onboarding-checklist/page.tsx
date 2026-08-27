import { ChecklistHeader } from "./components/ChecklistHeader";
import { ChecklistStatsRow } from "./components/ChecklistStatsRow";
import { ChecklistFilterBar } from "./components/ChecklistFilterBar";
import { ChecklistCandidateSidebar } from "./components/sidebar/ChecklistCandidateSidebar";
import { ChecklistCategoryView } from "./components/views/ChecklistCategoryView";
import { ChecklistListView } from "./components/views/ChecklistListView";
import { ChecklistUrgencyView } from "./components/views/ChecklistUrgencyView";
import { AddChecklistTaskModal } from "./components/modals/AddChecklistTaskModal";
import { EditChecklistTaskModal } from "./components/modals/EditChecklistTaskModal";
import { TaskDetailsModal } from "./components/modals/TaskDetailsModal";
import { CandidateAuditModal } from "./components/modals/CandidateAuditModal";
import { ExportChecklistModal } from "./components/modals/ExportChecklistModal";
import { useOnboardingChecklist } from "./hooks/useOnboardingChecklist";

export default function OnboardingChecklist() {
  const {
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

      {/* KPI Stats Row */}
      <ChecklistStatsRow
        stats={taskStats}
        filterStatus={filterStatus}
        filterPriority={filterPriority}
        onFilterStatus={setFilterStatus}
        onFilterPriority={setFilterPriority}
      />

      {/* Main Content Layout: Left Candidate Sidebar + Right Action Views */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Candidate Selector Sidebar */}
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

        {/* Right Tasks Container */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Filters & Layout Switcher */}
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

          {/* View 1: Category Stage View */}
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

          {/* View 2: Flat List View */}
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

          {/* View 3: Urgency Groups View */}
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

      {/* Modals */}
      <AddChecklistTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedHire={selectedHire}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        staff={staff}
        submitting={submitting}
        onSubmit={handleAddTask}
      />

      <EditChecklistTaskModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        selectedTask={selectedTask}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        staff={staff}
        submitting={submitting}
        onSubmit={handleEditTask}
      />

      <TaskDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        viewingTask={viewingTask}
        onEdit={openEditModal}
      />

      <CandidateAuditModal
        isOpen={hireAuditLogs.length > 0}
        onClose={() => {}}
        selectedHire={selectedHire}
        hireAuditLogs={hireAuditLogs}
        loadingAuditLogs={loadingAuditLogs}
      />

      <ExportChecklistModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        selectedHire={selectedHire}
        hireTasks={displayTasks}
      />
    </div>
  );
}