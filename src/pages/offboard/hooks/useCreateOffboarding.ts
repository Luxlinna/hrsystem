import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type { EmployeeOption, CreateOffboardingForm } from "../types";
import { DEFAULT_EXIT_TASKS, EXIT_REASONS } from "../constants";

interface UseCreateOffboardingProps {
  employees: EmployeeOption[];
  actorName: string;
  roleName: string;
  loadData: () => Promise<void>;
}

export function useCreateOffboarding({
  employees,
  actorName,
  roleName,
  loadData,
}: UseCreateOffboardingProps) {
  const [createModal, setCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newForm, setNewForm] = useState<CreateOffboardingForm>({
    employee_id: "",
    last_day: "",
    reason: EXIT_REASONS[0],
    notes: "",
    includeDefaultTasks: true,
  });

  const createOffboarding = useCallback(
    async (e: React.FormEvent) => {
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
      const emp = employees.find((x) => x.id === newForm.employee_id);
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
    },
    [newForm, submitting, employees, actorName, roleName, loadData]
  );

  return {
    createModal,
    setCreateModal,
    submitting,
    newForm,
    setNewForm,
    createOffboarding,
  };
}
