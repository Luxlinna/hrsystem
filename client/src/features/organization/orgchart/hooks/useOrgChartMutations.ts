import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Employee } from "../types";

interface UseOrgChartMutationsProps {
  canEditManager: boolean;
  loadEmployees: () => Promise<void>;
}

export function useOrgChartMutations({
  canEditManager,
  loadEmployees,
}: UseOrgChartMutationsProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editManagerModal, setEditManagerModal] = useState(false);
  const [newManagerId, setNewManagerId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdateManager = useCallback(async () => {
    if (!selectedEmployee || !canEditManager) return;
    setSaving(true);
    const managerId = newManagerId === "none" ? null : newManagerId || null;
    const { error } = await supabase
      .from("employees")
      .update({ reports_to: managerId })
      .eq("id", selectedEmployee.id);
    setSaving(false);
    if (error) {
      toast("Error", "Failed to update reporting manager", "error");
      return;
    }
    toast("Success", "Reporting relationship updated", "success");
    setEditManagerModal(false);
    setSelectedEmployee(null);
    setNewManagerId("");
    loadEmployees();
  }, [selectedEmployee, canEditManager, newManagerId, loadEmployees]);

  const openEditManager = useCallback((emp: Employee) => {
    setSelectedEmployee(emp);
    setNewManagerId(emp.reports_to || "none");
    setEditManagerModal(true);
  }, []);

  return {
    selectedEmployee,
    setSelectedEmployee,
    editManagerModal,
    setEditManagerModal,
    newManagerId,
    setNewManagerId,
    saving,
    handleUpdateManager,
    openEditManager,
  };
}
