import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { BranchPayrollPolicy } from "../types";

interface UseBranchPolicyMutationsProps {
  targetBranch: string | null;
  actorName: string;
  loadData: () => Promise<void>;
  setBranchPolicy: React.Dispatch<React.SetStateAction<BranchPayrollPolicy | null>>;
}

export function useBranchPolicyMutations({
  targetBranch,
  actorName,
  loadData,
  setBranchPolicy,
}: UseBranchPolicyMutationsProps) {
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const handleSavePolicy = useCallback(
    async (policyUpdates: Partial<BranchPayrollPolicy>) => {
      if (!targetBranch) {
        toast("Error", "Please select a branch to configure its payroll policy.", "error");
        return;
      }

      setSavingPolicy(true);
      const payload = {
        branch_id: targetBranch,
        ...policyUpdates,
        updated_by: actorName,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("branch_payroll_policies")
        .upsert(payload, { onConflict: "branch_id" });

      setSavingPolicy(false);

      if (error) {
        toast("Error", "Failed to update branch payroll policy: " + error.message, "error");
        return;
      }

      toast("Policy Saved", "Branch payroll policy updated successfully.", "success");
      setBranchPolicy((prev) => (prev ? { ...prev, ...payload } : (payload as BranchPayrollPolicy)));
      setPolicyModalOpen(false);
      loadData();
    },
    [targetBranch, actorName, setBranchPolicy, loadData]
  );

  return {
    policyModalOpen,
    setPolicyModalOpen,
    savingPolicy,
    handleSavePolicy,
  };
}
