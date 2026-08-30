import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { toast } from "@/components/Toast";
import type { PayrollRun, PayrollApproval } from "../types";
import { useCreatePayrollRunMutation } from "./useCreatePayrollRunMutation";

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

  const createMutations = useCreatePayrollRunMutation({
    canManage,
    submitterName,
    targetBranch,
    loadData,
    setTab,
  });

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

  return {
    actionModal,
    setActionModal,
    actionNote,
    setActionNote,
    acting,
    processingId,
    viewingBatchRecords,
    setViewingBatchRecords,
    createForm: createMutations.createForm,
    setCreateForm: createMutations.setCreateForm,
    creating: createMutations.creating,
    handleAction,
    handleProcess,
    handleCreate: createMutations.handleCreate,
  };
}
