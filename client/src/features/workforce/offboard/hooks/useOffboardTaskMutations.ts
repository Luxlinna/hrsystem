import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { AddTaskForm } from "../types";

interface UseOffboardTaskMutationsProps {
  loadData: () => Promise<void>;
}

export function useOffboardTaskMutations({ loadData }: UseOffboardTaskMutationsProps) {
  const [taskModal, setTaskModal] = useState<{ open: boolean; offboardingId: string | null }>({
    open: false,
    offboardingId: null,
  });

  const [newTaskForm, setNewTaskForm] = useState<AddTaskForm>({
    title: "",
    type: "IT",
    assignee: "IT Team",
    due_date: "",
  });

  const [submittingTask, setSubmittingTask] = useState(false);

  const toggleTask = useCallback(
    async (taskId: string, currentStatus: string) => {
      const next = currentStatus === "completed" ? "pending" : "completed";
      const { error } = await supabase.from("offboarding_tasks").update({ status: next }).eq("id", taskId);
      if (error) {
        toast("Error", "Failed to update task", "error");
        return;
      }
      toast(next === "completed" ? "Task Completed" : "Task Reopened", "", "success");
      loadData();
    },
    [loadData]
  );

  const handleAddTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!taskModal.offboardingId || !newTaskForm.title.trim() || submittingTask) return;
      setSubmittingTask(true);

      const { error } = await supabase.from("offboarding_tasks").insert([
        {
          offboarding_id: taskModal.offboardingId,
          title: newTaskForm.title.trim(),
          type: newTaskForm.type,
          assignee: newTaskForm.assignee.trim(),
          due_date: newTaskForm.due_date || null,
          status: "pending",
        },
      ]);

      setSubmittingTask(false);
      if (error) {
        toast("Error", "Failed to add task", "error");
        return;
      }
      toast("Task Added", "Exit checklist task added successfully.", "success");
      setTaskModal({ open: false, offboardingId: null });
      setNewTaskForm({ title: "", type: "IT", assignee: "IT Team", due_date: "" });
      loadData();
    },
    [taskModal.offboardingId, newTaskForm, submittingTask, loadData]
  );

  return {
    taskModal,
    setTaskModal,
    newTaskForm,
    setNewTaskForm,
    submittingTask,
    toggleTask,
    handleAddTask,
  };
}
