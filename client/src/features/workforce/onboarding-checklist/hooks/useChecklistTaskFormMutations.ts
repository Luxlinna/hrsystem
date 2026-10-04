import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { OnboardingHire, ChecklistTask, TaskForm, StaffMember } from "../types";
import { getHireName, notifyAssigneeOfChecklistTask } from "../checklistUtils";

interface UseChecklistTaskFormMutationsProps {
  selectedHire: OnboardingHire | null;
  hireTasks: ChecklistTask[];
  loadData: () => Promise<void>;
  staff?: StaffMember[];
}

export function useChecklistTaskFormMutations({
  selectedHire,
  hireTasks,
  loadData,
  staff,
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
      const assignedTo = taskForm.assigned_to.trim() || null;
      const { data: inserted, error } = await supabase
        .from("onboarding_checklist_tasks")
        .insert([
          {
            onboarding_request_id: selectedHire.id,
            task_name: taskForm.task_name.trim(),
            description: taskForm.description.trim() || null,
            category: taskForm.category,
            assigned_to: assignedTo,
            assigned_to_role: taskForm.assigned_to_role.trim() || null,
            due_date: taskForm.due_date || null,
            priority: taskForm.priority,
            sort_order: hireTasks.length + 1,
            completed: false,
          },
        ])
        .select("id")
        .maybeSingle();

      setSubmitting(false);

      if (error) {
        toast("Error", "Failed to create task", "error");
      } else {
        toast("Task Added", "Checklist item added successfully", "success");
        setShowAddModal(false);

        if (assignedTo) {
          notifyAssigneeOfChecklistTask({
            taskName: taskForm.task_name.trim(),
            assignedTo,
            hireName: getHireName(selectedHire),
            dueDate: taskForm.due_date || null,
            taskId: inserted?.id,
            staffList: staff,
          }).catch((err) => console.error("Assignment notification failed:", err));
        }

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
    [selectedHire, taskForm, hireTasks.length, staff, loadData]
  );

  const handleEditTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTask || !taskForm.task_name.trim()) return;

      setSubmitting(true);
      const newAssignedTo = taskForm.assigned_to.trim() || null;
      const wasAssignedTo = selectedTask.assigned_to;

      const { error } = await supabase
        .from("onboarding_checklist_tasks")
        .update({
          task_name: taskForm.task_name.trim(),
          description: taskForm.description.trim() || null,
          category: taskForm.category,
          assigned_to: newAssignedTo,
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

        // Alert notification on system to the employee account if newly assigned or reassigned
        if (newAssignedTo && newAssignedTo !== wasAssignedTo) {
          notifyAssigneeOfChecklistTask({
            taskName: taskForm.task_name.trim(),
            assignedTo: newAssignedTo,
            hireName: getHireName(selectedHire),
            dueDate: taskForm.due_date || null,
            taskId: selectedTask.id,
            staffList: staff,
          }).catch((err) => console.error("Assignment notification failed:", err));
        }

        loadData();
      }
    },
    [selectedTask, taskForm, selectedHire, staff, loadData]
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
