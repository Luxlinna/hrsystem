import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { CreatePayrollRunForm } from "../types";

interface UseCreatePayrollRunMutationProps {
  canManage: boolean;
  submitterName: string;
  targetBranch?: string | null;
  loadData: () => Promise<void>;
  setTab: (tab: "pending" | "approved" | "history" | "itemized" | "create") => void;
}

export function useCreatePayrollRunMutation({
  canManage,
  submitterName,
  targetBranch,
  loadData,
  setTab,
}: UseCreatePayrollRunMutationProps) {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const [createForm, setCreateForm] = useState<CreatePayrollRunForm>({
    period: currentPeriod,
    department: "Engineering",
    total_base: "125000",
    total_bonus: "8500",
    total_deductions: "11200",
    employee_count: "24",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!createForm.period || !createForm.total_base || !canManage || creating) return;
      setCreating(true);

      const base = Number(createForm.total_base);
      const bonus = Number(createForm.total_bonus || 0);
      const deductions = Number(createForm.total_deductions || 0);
      const net = base + bonus - deductions;

      const { data, error } = await supabase
        .from("payroll_runs")
        .insert({
          period: createForm.period,
          department: createForm.department,
          total_base: base,
          total_bonus: bonus,
          total_deductions: deductions,
          total_net: net,
          employee_count: Number(createForm.employee_count || 0),
          status: "pending_approval",
          submitted_by: submitterName,
          submitted_at: new Date().toISOString(),
          notes: createForm.notes ? createForm.notes.trim() : null,
          branch_id: targetBranch || null,
        })
        .select()
        .single();

      if (error || !data) {
        toast("Error", "Failed to create payroll run", "error");
        setCreating(false);
        return;
      }

      await supabase.from("payroll_approvals").insert([
        { run_id: data.id, approver_name: "HR Director", approver_role: "Chief People Officer", status: "pending" },
        { run_id: data.id, approver_name: "Finance Director", approver_role: "Chief Financial Officer", status: "pending" },
      ]);

      setCreating(false);
      toast("Payroll Run Created", "Submitted into the multi-stage approval queue.", "success");
      setTab("pending");
      await loadData();
    },
    [createForm, canManage, creating, submitterName, targetBranch, setTab, loadData]
  );

  return {
    createForm,
    setCreateForm,
    creating,
    handleCreate,
  };
}
