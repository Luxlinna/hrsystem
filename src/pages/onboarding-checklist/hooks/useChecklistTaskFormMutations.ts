import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { OnboardingHire, ChecklistTask, TaskForm } from "../types";

interface UseChecklistTaskFormMutationsProps {
  selectedHire: OnboardingHire | null;
  hireTasks: ChecklistTask[];
  loadData: () => Promise<void>;
}

export function useChecklistTaskFormMutations({
  selectedHire,
  hireTasks,
  loadData,
}: UseChecklistTaskFormMutationsProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingTask, setViewingTask] = useState<ChecklistTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<ChecklistTask | null>(null);

  const [taskForm, setTaskForm] = useState<TaskForm>({
    task_name: "",
    description: "",
    category: "documents",
    assigned_to: "",
    assigned_to_role: "",
    due_date: "",
    priority: "medium",
  });

  const handleAddTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedHire || !taskForm.task_name.trim()) return;

      setSubmitting(true);
      const { error } = await supabase.from("onboarding_checklist_tasks").insert([
        {
          onboarding_request_id: selectedHire.id,
          task_name: taskForm.task_name.trim(),
          description: taskForm.description.trim() || null,
          category: taskForm.category,
          assigned_to: taskForm.assigned_to.trim() || null,
          assigned_to_role: taskForm.assigned_to_role.trim() || null,
          due_date: taskForm.due_date || null,
          priority: taskForm.priority,
          sort_order: hireTasks.length + 1,
          completed: false,
        },
      ]);

      setSubmitting(false);

      if (error) {
        toast("Error", "Failed to create task", "error");
      } else {
        toast("Task Added", "Checklist item added successfully", "success");
        setShowAddModal(false);
        setTaskForm({
          task_name: "",
          description: "",
          category: "documents",
          assigned_to: "",
          assigned_to_role: "",
          due_date: "",
          priority: "medium",
        });
        loadData();
      }
    },
    [selectedHire, taskForm, hireTasks.length, loadData]
  );

  const handleEditTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTask || !taskForm.task_name.trim()) return;

      setSubmitting(true);
      const { error } = await supabase
        .from("onboarding_checklist_tasks")
        .update({
          task_name: taskForm.task_name.trim(),
          description: taskForm.description.trim() || null,
          category: taskForm.category,
          assigned_to: taskForm.assigned_to.trim() || null,
          assigned_to_role: taskForm.assigned_to_role.trim() || null,
          due_date: taskForm.due_date || null,
          priority: taskForm.priority,
        })
        .eq("id", selectedTask.id);

      setSubmitting(false);

      if (error) {
        toast("Error", "Failed to update task", "error");
      } else {
        toast("Task Updated", "Changes saved successfully", "success");
        setShowEditModal(false);
        setSelectedTask(null);
        loadData();
      }
    },
    [selectedTask, taskForm, loadData]
  );

  const openEditModal = useCallback((task: ChecklistTask) => {
    setSelectedTask(task);
    setTaskForm({
      task_name: task.task_name,
      description: task.description || "",
      category: (task.category as any) || "documents",
      assigned_to: task.assigned_to || "",
      assigned_to_role: task.assigned_to_role || "",
      due_date: task.due_date || "",
      priority: task.priority || "medium",
    });
    setShowEditModal(true);
  }, []);

  const openDetailsModal = useCallback((task: ChecklistTask) => {
    setViewingTask(task);
    setShowDetailsModal(true);
  }, []);

  return {
    submitting,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showDetailsModal,
    setShowDetailsModal,
    viewingTask,
    selectedTask,
    taskForm,
    setTaskForm,
    handleAddTask,
    handleEditTask,
    openEditModal,
    openDetailsModal,
  };
}
