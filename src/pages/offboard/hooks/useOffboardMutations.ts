import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type {
  Offboarding,
  EmployeeOption,
  CreateOffboardingForm,
  AddTaskForm,
  EditOffboardingForm,
} from "../types";
import { DEFAULT_EXIT_TASKS, EXIT_REASONS, STATUS_CONFIG } from "../constants";

interface UseOffboardMutationsProps {
  offboardings: Offboarding[];
  employees: EmployeeOption[];
  actorName: string;
  roleName?: string;
  loadData: () => Promise<void>;
}

export function useOffboardMutations({
  offboardings,
  employees,
  actorName,
  roleName = "Unknown",
  loadData,
}: UseOffboardMutationsProps) {
  // Create Modal
  const [createModal, setCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newForm, setNewForm] = useState<CreateOffboardingForm>({
    employee_id: "",
    last_day: "",
    reason: EXIT_REASONS[0],
    notes: "",
    includeDefaultTasks: true,
  });

  // Task Modal
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

  // Edit Modal
  const [editingOffboarding, setEditingOffboarding] = useState<Offboarding | null>(null);
  const [editForm, setEditForm] = useState<EditOffboardingForm>({
    last_day: "",
    reason: "",
    notes: "",
    status: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const toggleTask = useCallback(async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "completed" ? "pending" : "completed";
    const { error } = await supabase.from("offboarding_tasks").update({ status: next }).eq("id", taskId);
    if (error) { toast("Error", "Failed to update task", "error"); return; }
    toast(next === "completed" ? "Task Completed" : "Task Reopened", "", "success");
    loadData();
  }, [loadData]);

  const updateOffboardingStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase
      .from("offboarding_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast("Error", "Failed to update status", "error"); return; }
    toast("Status Updated", STATUS_CONFIG[status]?.label || status, "success");
    const record = offboardings.find((o) => o.id === id);
    const empName = record?.employees
      ? `${record.employees.first_name} ${record.employees.last_name}`
      : "an employee";

    logActivity({
      module: "offboard",
      action: status === "completed" ? "processed" : "updated",
      entityType: "offboarding_request",
      entityId: id,
      actorName,
      actorRole: roleName,
      description: `Offboarding for ${empName} moved to ${STATUS_CONFIG[status]?.label || status}`,
    });

    if (status === "completed") {
      notify({
        source: "offboard",
        type: "info",
        title: "Offboarding completed",
        message: `${empName}'s exit process is complete.`,
        entityId: id,
      });
    }
    loadData();
  }, [offboardings, actorName, roleName, loadData]);

  const deleteOffboarding = useCallback(async (id: string, empName: string) => {
    if (!confirm(`Move offboarding record for "${empName}" to Recycle Bin?`)) return;
    const { error } = await supabase
      .from("offboarding_requests")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) { toast("Error", "Failed to delete offboarding record", "error"); return; }
    toast("Offboarding Deleted", "Record moved to Recycle Bin.", "success");
    loadData();
  }, [actorName, loadData]);

  const createOffboarding = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.employee_id || !newForm.last_day || submitting) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("offboarding_requests")
      .insert([
        {
          employee_id: newForm.employee_id,
          last_day: newForm.last_day,
          reason: newForm.reason,
          notes: newForm.notes.trim(),
          status: "notice_period",
        },
      ])
      .select("id")
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast("Error", "Failed to start offboarding", "error");
      return;
    }

    if (newForm.includeDefaultTasks) {
      const taskInserts = DEFAULT_EXIT_TASKS.map((t) => ({
        offboarding_id: data.id,
        title: t.title,
        type: t.type,
        assignee: t.assignee,
        status: "pending",
        due_date: newForm.last_day,
      }));
      await supabase.from("offboarding_tasks").insert(taskInserts);
    }

    setSubmitting(false);
    setCreateModal(false);
    const emp = employees.find((e) => e.id === newForm.employee_id);
    setNewForm({
      employee_id: "",
      last_day: "",
      reason: EXIT_REASONS[0],
      notes: "",
      includeDefaultTasks: true,
    });
    toast("Offboarding Started", "Employee exit workflow initiated.", "success");
    logActivity({
      module: "offboard",
      action: "created",
      entityType: "offboarding_request",
      entityId: data.id,
      actorName,
      actorRole: roleName,
      description: `Offboarding started for ${emp ? `${emp.first_name} ${emp.last_name}` : "an employee"}`,
    });
    notify({
      source: "offboard",
      type: "warning",
      title: "Offboarding started",
      message: `Exit process started for ${emp ? `${emp.first_name} ${emp.last_name}` : "an employee"}, last day ${newForm.last_day}.`,
      entityId: data.id,
    });
    loadData();
  }, [newForm, submitting, employees, actorName, roleName, loadData]);

  const handleAddTask = useCallback(async (e: React.FormEvent) => {
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
    if (error) { toast("Error", "Failed to add task", "error"); return; }
    toast("Task Added", "Exit checklist task added successfully.", "success");
    setTaskModal({ open: false, offboardingId: null });
    setNewTaskForm({ title: "", type: "IT", assignee: "IT Team", due_date: "" });
    loadData();
  }, [taskModal.offboardingId, newTaskForm, submittingTask, loadData]);

  const openEditModal = useCallback((o: Offboarding) => {
    setEditingOffboarding(o);
    setEditForm({
      last_day: o.last_day ? o.last_day.slice(0, 10) : "",
      reason: o.reason || EXIT_REASONS[0],
      notes: o.notes || "",
      status: o.status || "notice_period",
    });
  }, []);

  const handleSaveEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffboarding || savingEdit) return;
    setSavingEdit(true);

    const { error } = await supabase
      .from("offboarding_requests")
      .update({
        last_day: editForm.last_day,
        reason: editForm.reason,
        notes: editForm.notes.trim(),
        status: editForm.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingOffboarding.id);

    setSavingEdit(false);
    if (error) { toast("Error", "Failed to update record", "error"); return; }
    toast("Offboarding Updated", "Changes saved successfully.", "success");
    setEditingOffboarding(null);
    loadData();
  }, [editingOffboarding, editForm, savingEdit, loadData]);

  return {
    createModal,
    setCreateModal,
    submitting,
    newForm,
    setNewForm,
    taskModal,
    setTaskModal,
    newTaskForm,
    setNewTaskForm,
    submittingTask,
    editingOffboarding,
    setEditingOffboarding,
    editForm,
    setEditForm,
    savingEdit,
    toggleTask,
    updateOffboardingStatus,
    deleteOffboarding,
    createOffboarding,
    handleAddTask,
    openEditModal,
    handleSaveEdit,
  };
}
