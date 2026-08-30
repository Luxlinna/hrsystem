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
  const c = useOnboardingChecklist();

  if (c.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading checklist hub...</p>
      </div>
    );
  }

  if (c.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <PartnerBranchPrivacyShield
          moduleName="Onboarding Checklist"
          userBranchName={c.userBranchName}
          hasNoBranch={!c.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      <ChecklistHeader
        selectedHire={c.selectedHire}
        populatingDefaults={c.populatingDefaults}
        onPopulateDefaultTasks={c.handlePopulateDefaultTasks}
        onOpenAddModal={() => c.setShowAddModal(true)}
        onOpenExportModal={() => c.setShowExportModal(true)}
        onOpenAuditLogs={c.loadHireAuditLogs}
      />

      <CandidateDetailHeader
        selectedHire={c.selectedHire}
        tasks={c.tasks}
        onOpenAddModal={() => c.setShowAddModal(true)}
        onOpenAuditLogs={c.loadHireAuditLogs}
      />

      <ChecklistStatsRow
        stats={c.taskStats}
        filterStatus={c.filterStatus}
        filterPriority={c.filterPriority}
        onFilterStatus={c.setFilterStatus}
        onFilterPriority={c.setFilterPriority}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <ChecklistCandidateSidebar
          hires={c.filteredHires}
          selectedHire={c.selectedHire}
          hireSearch={c.hireSearch}
          setHireSearch={c.setHireSearch}
          hireStatusTab={c.hireStatusTab}
          setHireStatusTab={c.setHireStatusTab}
          getProgress={c.getProgress}
          onSelectCandidate={c.selectCandidate}
        />

        <div className="flex-1 min-w-0 w-full space-y-4">
          <ChecklistFilterBar
            viewLayout={c.viewLayout}
            setViewLayout={c.setViewLayout}
            taskSearch={c.taskSearch}
            setTaskSearch={c.setTaskSearch}
            filterCategory={c.filterCategory}
            setFilterCategory={c.setFilterCategory}
            filterPriority={c.filterPriority}
            setFilterPriority={c.setFilterPriority}
            filterStatus={c.filterStatus}
            setFilterStatus={c.setFilterStatus}
          />

          {c.viewLayout === "category" && (
            <ChecklistCategoryView
              categories={c.categoriesPresent}
              tasks={c.displayTasks}
              isCategoryLocked={c.isCategoryLocked}
              toggling={c.toggling}
              completerName={c.completerName}
              onToggle={c.toggleTask}
              onQuickAssign={c.handleQuickAssignToMe}
              onEdit={c.openEditModal}
              onDelete={c.handleDeleteTask}
              onViewDetails={c.openDetailsModal}
              onMarkAllComplete={c.handleMarkAllComplete}
              onOpenAddModal={(cat) => {
                c.setTaskForm({ ...c.taskForm, category: cat as any });
                c.setShowAddModal(true);
              }}
            />
          )}

          {c.viewLayout === "list" && (
            <ChecklistListView
              tasks={c.displayTasks}
              isTaskLocked={c.isTaskLocked}
              toggling={c.toggling}
              completerName={c.completerName}
              onToggle={c.toggleTask}
              onQuickAssign={c.handleQuickAssignToMe}
              onEdit={c.openEditModal}
              onDelete={c.handleDeleteTask}
              onViewDetails={c.openDetailsModal}
            />
          )}

          {c.viewLayout === "urgency" && (
            <ChecklistUrgencyView
              tasks={c.displayTasks}
              isTaskLocked={c.isTaskLocked}
              toggling={c.toggling}
              completerName={c.completerName}
              onToggle={c.toggleTask}
              onQuickAssign={c.handleQuickAssignToMe}
              onEdit={c.openEditModal}
              onDelete={c.handleDeleteTask}
              onViewDetails={c.openDetailsModal}
            />
          )}
        </div>
      </div>

      <ChecklistModalsContainer
        {...c}
        handleAddTask={c.handleAddTask}
        handleEditTask={c.handleEditTask}
        openEditModal={c.openEditModal}
      />
    </div>
  );
}