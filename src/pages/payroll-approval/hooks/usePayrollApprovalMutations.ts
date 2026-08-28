import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { toast } from "@/components/Toast";
import type { PayrollRun, PayrollApproval, CreatePayrollRunForm } from "../types";

interface UsePayrollApprovalMutationsProps {
  canManage: boolean;
  submitterName: string;
  roleName?: string;
  targetBranch?: string | null;
  getRunApprovals: (runId: string) => PayrollApproval[];
  loadData: () => Promise<void>;
  setTab: (tab: "pending" | "approved" | "history" | "itemized" | "create") => void;
}

export function usePayrollApprovalMutations({
  canManage,
  submitterName,
  roleName = "Unknown",
  targetBranch,
  getRunApprovals,
  loadData,
  setTab,
}: UsePayrollApprovalMutationsProps) {
  const [actionModal, setActionModal] = useState<{ run: PayrollRun; action: "approve" | "reject" } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [acting, setActing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingBatchRecords, setViewingBatchRecords] = useState<PayrollRun | null>(null);

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

  const handleAction = useCallback(async () => {
    if (!actionModal || !canManage) return;
    setActing(true);
    const { run, action } = actionModal;

    const pendingForRun = getRunApprovals(run.id).filter((a) => a.status === "pending");
    const targetApproval = pendingForRun[0];

    if (targetApproval) {
      const { error: approvalError } = await supabase
        .from("payroll_approvals")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          notes: actionNote || null,
          acted_at: new Date().toISOString(),
        })
        .eq("id", targetApproval.id);

      if (approvalError) {
        setActing(false);
        toast("Error", "Failed to record approval", "error");
        return;
      }
    }

    const remainingPending = pendingForRun.length - (targetApproval ? 1 : 0);
    const finalStatus = action === "reject" ? "rejected" : remainingPending > 0 ? null : "approved";

    if (finalStatus) {
      const { error: runError } = await supabase.from("payroll_runs").update({ status: finalStatus }).eq("id", run.id);
      if (runError) {
        setActing(false);
        toast("Error", "Failed to update payroll run status", "error");
        return;
      }
    }

    setActing(false);
    setActionModal(null);
    setActionNote("");

    toast(
      finalStatus ? `Payroll Run ${finalStatus === "approved" ? "Approved" : "Rejected"}` : "Approval Recorded",
      finalStatus ? `The ${run.period} run for ${run.department} is ${finalStatus}.` : "Waiting on remaining approver in chain.",
      "success"
    );

    if (finalStatus) {
      logActivity({
        module: "payroll",
        action: finalStatus as "approved" | "rejected",
        entityType: "payroll_run",
        entityId: run.id,
        actorName: submitterName,
        actorRole: roleName,
        description: `Payroll run for ${run.period} (${run.department}) was ${finalStatus}`,
        metadata: { period: run.period, department: run.department, total_net: run.total_net },
      });
      notify({
        source: "payroll",
        type: finalStatus === "approved" ? "success" : "warning",
        title: `Payroll run ${finalStatus}`,
        message: `The ${run.period} payroll run for ${run.department} was ${finalStatus}.`,
        entityId: run.id,
      });
    }
    await loadData();
  }, [actionModal, canManage, actionNote, getRunApprovals, submitterName, roleName, loadData]);

  const handleProcess = useCallback(
    async (run: PayrollRun) => {
      if (!canManage || processingId) return;
      setProcessingId(run.id);
      const { error } = await supabase.from("payroll_runs").update({ status: "processed" }).eq("id", run.id);
      setProcessingId(null);

      if (error) {
        toast("Error", "Failed to mark run as processed", "error");
        return;
      }

      toast("Payroll Processed", `Disbursement finalized for ${run.department} (${run.period})`, "success");
      logActivity({
        module: "payroll",
        action: "processed",
        entityType: "payroll_run",
        entityId: run.id,
        actorName: submitterName,
        actorRole: roleName,
        description: `Payroll run for ${run.period} (${run.department}) was processed & paid out`,
        metadata: { period: run.period, department: run.department, total_net: run.total_net },
      });
      notify({
        source: "payroll",
        type: "success",
        title: "Payroll processed",
        message: `The ${run.period} payroll run for ${run.department} has been processed and paid out.`,
        entityId: run.id,
      });
      await loadData();
    },
    [canManage, processingId, submitterName, roleName, loadData]
  );

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

      // Initialize 2-tier approval workflow
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
    actionModal,
    setActionModal,
    actionNote,
    setActionNote,
    acting,
    processingId,
    viewingBatchRecords,
    setViewingBatchRecords,
    createForm,
    setCreateForm,
    creating,
    handleAction,
    handleProcess,
    handleCreate,
  };
}
