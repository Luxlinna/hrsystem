import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { OnboardingHire, ChecklistTask, TaskForm } from "../types";
import { STANDARD_TASK_TEMPLATES } from "../constants";
import { getHireName, matchDocAndTask } from "../checklistUtils";

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
  const [submitting, setSubmitting] = useState(false);
  const [populatingDefaults, setPopulatingDefaults] = useState(false);
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

  const toggleTask = useCallback(
    async (task: ChecklistTask) => {
      if (selectedHire?.status === "pending") {
        toast("Pending Approval", "Please click 'Approve Journey' before completing checklist tasks.", "info");
        return;
      }
      if (task.assigned_to !== completerName) {
        toast(
          "Unassigned or Assigned to Other Staff",
          task.assigned_to
            ? `Only ${task.assigned_to} can check this task.`
            : "Please edit and assign this task to a staff member first.",
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

      toast(
        newCompleted ? "Task Completed" : "Marked Pending",
        `"${task.task_name}" updated`,
        newCompleted ? "success" : "info"
      );

      // Bidirectional sync with onboarding_documents
      try {
        const { data: relatedDocs } = await supabase
          .from("onboarding_documents")
          .select("id, document_name")
          .eq("onboarding_request_id", task.onboarding_request_id);

        if (relatedDocs && relatedDocs.length > 0) {
          const matchingDocs = relatedDocs.filter((d) => matchDocAndTask(d.document_name, task.task_name));
          for (const d of matchingDocs) {
            await supabase
              .from("onboarding_documents")
              .update({
                status: newCompleted ? "complete" : "pending",
              })
              .eq("id", d.id);
          }
        }
      } catch (e) {
        console.error("Doc sync error:", e);
      }

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
    [selectedHire, isTaskLocked, completerName, setTasks, loadData]
  );

  const handleQuickAssignToMe = useCallback(
    async (task: ChecklistTask) => {
      const { error } = await supabase
        .from("onboarding_checklist_tasks")
        .update({
          assigned_to: completerName,
          assigned_to_role: "HR",
        })
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

  const handlePopulateDefaultTasks = useCallback(async () => {
    if (!selectedHire) return;
    setPopulatingDefaults(true);

    const existingNames = new Set(hireTasks.map((t) => t.task_name.toLowerCase().trim()));
    const toInsert = STANDARD_TASK_TEMPLATES.filter((tpl) => !existingNames.has(tpl.task_name.toLowerCase().trim())).map(
      (tpl, idx) => ({
        onboarding_request_id: selectedHire.id,
        task_name: tpl.task_name,
        description: tpl.description,
        category: tpl.category,
        priority: tpl.priority,
        sort_order: hireTasks.length + idx + 1,
        completed: false,
      })
    );

    if (toInsert.length === 0) {
      toast("Up to Date", "All standard checklist tasks already exist for this candidate", "info");
      setPopulatingDefaults(false);
      return;
    }

    const { error } = await supabase.from("onboarding_checklist_tasks").insert(toInsert);
    setPopulatingDefaults(false);

    if (error) {
      toast("Error", "Failed to load default checklist tasks", "error");
    } else {
      toast("Checklist Loaded", `Added ${toInsert.length} standard tasks`, "success");
      loadData();
    }
  }, [selectedHire, hireTasks, loadData]);

  const handleMarkAllComplete = useCallback(
    async (categoryKey?: string) => {
      if (!selectedHire) return;
      const targetTasks = hireTasks.filter((t) => (!categoryKey || t.category === categoryKey) && !t.completed);
      if (targetTasks.length === 0) {
        toast("Info", "No pending tasks to mark complete", "info");
        return;
      }

      if (!confirm(`Mark all ${targetTasks.length} pending task(s) as completed?`)) return;

      const ids = targetTasks.map((t) => t.id);
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("onboarding_checklist_tasks")
        .update({
          completed: true,
          completed_at: now,
          completed_by: completerName,
        })
        .in("id", ids);

      if (error) {
        toast("Error", "Failed to complete tasks", "error");
      } else {
        toast("Completed", `Marked ${targetTasks.length} tasks as completed`, "success");
        loadData();
      }
    },
    [selectedHire, hireTasks, completerName, loadData]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (!confirm("Are you sure you want to remove this checklist item?")) return;
      const { error } = await supabase
        .from("onboarding_checklist_tasks")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: completerName,
        })
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
    toggling,
    submitting,
    populatingDefaults,
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
    toggleTask,
    handleQuickAssignToMe,
    handlePopulateDefaultTasks,
    handleMarkAllComplete,
    handleDeleteTask,
    handleAddTask,
    handleEditTask,
    openEditModal,
    openDetailsModal,
  };
}
