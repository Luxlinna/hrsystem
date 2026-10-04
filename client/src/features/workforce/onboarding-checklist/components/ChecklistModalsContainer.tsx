import { memo } from "react";
import type { OnboardingHire, ChecklistTask, StaffMember, TaskForm } from "../types";
import { AddChecklistTaskModal } from "./modals/AddChecklistTaskModal";
import { EditChecklistTaskModal } from "./modals/EditChecklistTaskModal";
import { TaskDetailsModal } from "./modals/TaskDetailsModal";
import { CandidateAuditModal } from "./modals/CandidateAuditModal";
import { ExportChecklistModal } from "./modals/ExportChecklistModal";

interface ChecklistModalsContainerProps {
  showAddModal: boolean;
  setShowAddModal: (b: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (b: boolean) => void;
  showDetailsModal: boolean;
  setShowDetailsModal: (b: boolean) => void;
  showExportModal: boolean;
  setShowExportModal: (b: boolean) => void;
  showAuditModal?: boolean;
  setShowAuditModal?: (b: boolean) => void;
  setHireAuditLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  selectedHire: OnboardingHire | null;
  taskForm: TaskForm;
  setTaskForm: React.Dispatch<React.SetStateAction<TaskForm>>;
  staff: StaffMember[];
  submitting: boolean;
  selectedTask: ChecklistTask | null;
  viewingTask: ChecklistTask | null;
  hireAuditLogs: any[];
  loadingAuditLogs: boolean;
  displayTasks: ChecklistTask[];
  handleAddTask: (e: React.FormEvent) => Promise<void>;
  handleEditTask: (e: React.FormEvent) => Promise<void>;
  openEditModal: (task: ChecklistTask) => void;
}

export const ChecklistModalsContainer = memo(function ChecklistModalsContainer({
  showAddModal,
  setShowAddModal,
  showEditModal,
  setShowEditModal,
  showDetailsModal,
  setShowDetailsModal,
  showExportModal,
  setShowExportModal,
  showAuditModal = false,
  setShowAuditModal,
  setHireAuditLogs,
  selectedHire,
  taskForm,
  setTaskForm,
  staff,
  submitting,
  selectedTask,
  viewingTask,
  hireAuditLogs,
  loadingAuditLogs,
  displayTasks,
  handleAddTask,
  handleEditTask,
  openEditModal,
}: ChecklistModalsContainerProps) {
  return (
    <>
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
        isOpen={showAuditModal || hireAuditLogs.length > 0}
        onClose={() => {
          setShowAuditModal?.(false);
          setHireAuditLogs?.([]);
        }}
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
    </>
  );
});
