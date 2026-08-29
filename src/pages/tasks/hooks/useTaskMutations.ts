import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Task, FormState, Employee } from "../types";
import { notifyTaskAssignees } from "../taskUtils";

interface UseTaskMutationsProps {
  currentEmployeeId: string | null;
  employees: Employee[];
  fetchTasks: () => Promise<void>;
  logActivity: (
    taskId: string,
    actorId: string | null,
    action: "created" | "status_changed" | "assigned" | "updated",
    field: string,
    oldVal?: string | null,
    newVal?: string | null
  ) => Promise<void>;
}

export function useTaskMutations({
  currentEmployeeId,
  employees,
  fetchTasks,
  logActivity,
}: UseTaskMutationsProps) {
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [checkInOutTask, setCheckInOutTask] = useState<{
    task: Task;
    mode: "check_in" | "check_out";
  } | null>(null);

  const handleStatusChange = useCallback(
    async (task: Task, newStatus: Task["status"]) => {
      if (task.status === newStatus) return;
      const oldStatus = task.status;
      const completedAt = newStatus === "done" ? new Date().toISOString() : null;

      try {
        const { error } = await supabase
          .from("tasks")
          .update({ status: newStatus, completed_at: completedAt })
          .eq("id", task.id);
        if (error) throw error;

        await logActivity(
          task.id,
          currentEmployeeId,
          "status_changed",
          "status",
          oldStatus,
          newStatus
        );

        if (newStatus === "done") {
          toast("Task completed", `"${task.title}" has been marked as completed.`, "success");
        }
        await fetchTasks();
      } catch {
        toast("Error", "Failed to update task status", "error");
      }
    },
    [currentEmployeeId, fetchTasks, logActivity]
  );

  const handleSaveTask = useCallback(
    async (
      form: FormState & {
        work_address?: string | null;
        work_lat?: number | null;
        work_lng?: number | null;
        work_accuracy_m?: number | null;
      },
      editId?: string
    ) => {
      setSaving(true);
      try {
        const payload = {
          title: form.title.trim(),
          description: form.description.trim() || null,
          assigned_to: form.assigned_to,
          status: form.status,
          priority: form.priority,
          due_date: form.due_date || null,
          is_outside_work: form.is_outside_work,
          completed_at: form.status === "done" ? new Date().toISOString() : null,
          work_address: form.is_outside_work ? form.work_address || null : null,
          work_lat: form.is_outside_work ? form.work_lat || null : null,
          work_lng: form.is_outside_work ? form.work_lng || null : null,
          work_accuracy_m: form.is_outside_work ? form.work_accuracy_m || null : null,
        };

        if (editId) {
          const { error } = await supabase.from("tasks").update(payload).eq("id", editId);
          if (error) throw error;

          await logActivity(editId, currentEmployeeId, "updated", "task_details");
          toast("Task updated", `"${form.title}" has been saved.`, "success");
        } else {
          const { data, error } = await supabase
            .from("tasks")
            .insert({
              ...payload,
              assigned_by: currentEmployeeId || form.assigned_to,
            })
            .select("id")
            .single();
          if (error) throw error;

          if (data?.id) {
            await logActivity(data.id, currentEmployeeId, "created", "task");
            if (form.assigned_to) {
              await notifyTaskAssignees({
                employeeIds: [form.assigned_to],
                employees,
                actorUserId: currentEmployeeId,
                title: "New Task Assigned",
                message: `You have been assigned: "${form.title}"`,
                entityId: data.id,
              });
            }
          }
          toast("Task created", `"${form.title}" has been created.`, "success");
        }

        setShowCreateModal(false);
        setEditingTask(null);
        await fetchTasks();
      } catch {
        toast("Error", "Failed to save task", "error");
      } finally {
        setSaving(false);
      }
    },
    [currentEmployeeId, employees, fetchTasks, logActivity]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ deleted_at: new Date().toISOString(), deleted_by: currentEmployeeId })
          .eq("id", taskId);
        if (error) throw error;

        toast("Deleted", "Task moved to recycle bin", "success");
        setDeletingTask(null);
        setSelectedTask(null);
        await fetchTasks();
      } catch {
        toast("Error", "Failed to delete task", "error");
      }
    },
    [currentEmployeeId, fetchTasks]
  );

  return {
    saving,
    selectedTask,
    setSelectedTask,
    editingTask,
    setEditingTask,
    deletingTask,
    setDeletingTask,
    showCreateModal,
    setShowCreateModal,
    checkInOutTask,
    setCheckInOutTask,
    handleStatusChange,
    handleSaveTask,
    handleDeleteTask,
  };
}
