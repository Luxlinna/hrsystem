import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { OnboardingHire, ChecklistTask } from "../types";
import { getHireName, syncTaskWithOnboardingDocuments } from "../checklistUtils";
import { useChecklistTaskFormMutations } from "./useChecklistTaskFormMutations";
import { useChecklistBatchActions } from "./useChecklistBatchActions";

interface UseChecklistTaskMutationsProps {
  selectedHire: OnboardingHire | null;
  hireTasks: ChecklistTask[];
  completerName: string;
  isTaskLocked: (task: ChecklistTask) => boolean;
  loadData: () => Promise<void>;
  setTasks: React.Dispatch<React.SetStateAction<ChecklistTask[]>>;
}

export function useChecklistTaskMutations({
  selectedHire,
  hireTasks,
  completerName,
  isTaskLocked,
  loadData,
  setTasks,
}: UseChecklistTaskMutationsProps) {
  const [toggling, setToggling] = useState<string | null>(null);

  const formMutations = useChecklistTaskFormMutations({
    selectedHire,
    hireTasks,
    loadData,
  });

  const batchActions = useChecklistBatchActions({
    selectedHire,
    hireTasks,
    completerName,
    loadData,
  });

  const toggleTask = useCallback(
    async (task: ChecklistTask) => {
      if (selectedHire?.status === "pending") {
        toast("Pending Approval", "Please click 'Approve Journey' before completing checklist tasks.", "info");
        return;
      }
      if (task.assigned_to !== completerName) {
        toast(
          "Unassigned or Assigned to Other Staff",
          task.assigned_to ? `Only ${task.assigned_to} can check this task.` : "Please edit and assign this task to a staff member first.",
          "warning"
        );
        return;
      }

      setToggling(task.id);
      const newCompleted = !task.completed;
      const now = new Date().toISOString();

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                completed: newCompleted,
                completed_at: newCompleted ? now : null,
                completed_by: newCompleted ? completerName : null,
              }
            : t
        )
      );

      const { error } = await supabase
        .from("onboarding_checklist_tasks")
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? now : null,
          completed_by: newCompleted ? completerName : null,
        })
        .eq("id", task.id);

      setToggling(null);

      if (error) {
        toast("Error", "Failed to update task status", "error");
        loadData();
        return;
      }

      toast(newCompleted ? "Task Completed" : "Marked Pending", `"${task.task_name}" updated`, newCompleted ? "success" : "info");
      await syncTaskWithOnboardingDocuments(task.onboarding_request_id, task.task_name, newCompleted);

      if (newCompleted && selectedHire) {
        logActivity({
          module: "onboarding",
          action: "updated",
          entityType: "checklist_task",
          entityId: task.id,
          actorName: completerName,
          actorRole: "HR",
          description: `Completed task "${task.task_name}" for ${getHireName(selectedHire)}`,
        });
      }
    },
    [selectedHire, completerName, setTasks, loadData]
  );

  const handleQuickAssignToMe = useCallback(
    async (task: ChecklistTask) => {
      const { error } = await supabase
        .from("onboarding_checklist_tasks")
        .update({ assigned_to: completerName, assigned_to_role: "HR" })
        .eq("id", task.id);

      if (error) {
        toast("Error", "Failed to assign task", "error");
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, assigned_to: completerName, assigned_to_role: "HR" } : t))
      );
      toast("Assigned", `Assigned to ${completerName}`, "success");
    },
    [completerName, setTasks]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (!confirm("Are you sure you want to remove this checklist item?")) return;
      const { error } = await supabase
        .from("onboarding_checklist_tasks")
        .update({ deleted_at: new Date().toISOString(), deleted_by: completerName })
        .eq("id", taskId);

      if (error) {
        toast("Error", "Failed to delete task", "error");
      } else {
        toast("Deleted", "Checklist item moved to Recycle Bin", "success");
        loadData();
      }
    },
    [completerName, loadData]
  );

  return {
    toggling,
    submitting: formMutations.submitting,
    populatingDefaults: batchActions.populatingDefaults,
    showAddModal: formMutations.showAddModal,
    setShowAddModal: formMutations.setShowAddModal,
    showEditModal: formMutations.showEditModal,
    setShowEditModal: formMutations.setShowEditModal,
    showDetailsModal: formMutations.showDetailsModal,
    setShowDetailsModal: formMutations.setShowDetailsModal,
    viewingTask: formMutations.viewingTask,
    selectedTask: formMutations.selectedTask,
    taskForm: formMutations.taskForm,
    setTaskForm: formMutations.setTaskForm,
    toggleTask,
    handleQuickAssignToMe,
    handlePopulateDefaultTasks: batchActions.handlePopulateDefaultTasks,
    handleMarkAllComplete: batchActions.handleMarkAllComplete,
    handleDeleteTask,
    handleAddTask: formMutations.handleAddTask,
    handleEditTask: formMutations.handleEditTask,
    openEditModal: formMutations.openEditModal,
    openDetailsModal: formMutations.openDetailsModal,
  };
}
