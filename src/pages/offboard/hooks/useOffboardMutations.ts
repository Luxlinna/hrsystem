import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type {
  Offboarding,
  EmployeeOption,
  EditOffboardingForm,
} from "../types";
import { EXIT_REASONS, STATUS_CONFIG } from "../constants";
import { useOffboardTaskMutations } from "./useOffboardTaskMutations";
import { useCreateOffboarding } from "./useCreateOffboarding";

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
  const [editingOffboarding, setEditingOffboarding] = useState<Offboarding | null>(null);
  const [editForm, setEditForm] = useState<EditOffboardingForm>({
    last_day: "",
    reason: "",
    notes: "",
    status: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const taskMutations = useOffboardTaskMutations({ loadData });
  const createMutations = useCreateOffboarding({
    employees,
    actorName,
    roleName,
    loadData,
  });

  const updateOffboardingStatus = useCallback(
    async (id: string, status: string) => {
      const { error } = await supabase
        .from("offboarding_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        toast("Error", "Failed to update status", "error");
        return;
      }

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
    },
    [offboardings, actorName, roleName, loadData]
  );

  const deleteOffboarding = useCallback(
    async (id: string, empName: string) => {
      if (!confirm(`Move offboarding record for "${empName}" to Recycle Bin?`)) return;
      const { error } = await supabase
        .from("offboarding_requests")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", id);

      if (error) {
        toast("Error", "Failed to delete offboarding record", "error");
        return;
      }
      toast("Offboarding Deleted", "Record moved to Recycle Bin.", "success");
      loadData();
    },
    [actorName, loadData]
  );

  const openEditModal = useCallback((o: Offboarding) => {
    setEditingOffboarding(o);
    setEditForm({
      last_day: o.last_day ? o.last_day.slice(0, 10) : "",
      reason: o.reason || EXIT_REASONS[0],
      notes: o.notes || "",
      status: o.status || "notice_period",
    });
  }, []);

  const handleSaveEdit = useCallback(
    async (e: React.FormEvent) => {
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
      if (error) {
        toast("Error", "Failed to update record", "error");
        return;
      }
      toast("Offboarding Updated", "Changes saved successfully.", "success");
      setEditingOffboarding(null);
      loadData();
    },
    [editingOffboarding, editForm, savingEdit, loadData]
  );

  return {
    createModal: createMutations.createModal,
    setCreateModal: createMutations.setCreateModal,
    submitting: createMutations.submitting,
    newForm: createMutations.newForm,
    setNewForm: createMutations.setNewForm,
    createOffboarding: createMutations.createOffboarding,
    taskModal: taskMutations.taskModal,
    setTaskModal: taskMutations.setTaskModal,
    newTaskForm: taskMutations.newTaskForm,
    setNewTaskForm: taskMutations.setNewTaskForm,
    submittingTask: taskMutations.submittingTask,
    toggleTask: taskMutations.toggleTask,
    handleAddTask: taskMutations.handleAddTask,
    editingOffboarding,
    setEditingOffboarding,
    editForm,
    setEditForm,
    savingEdit,
    updateOffboardingStatus,
    deleteOffboarding,
    openEditModal,
    handleSaveEdit,
  };
}
