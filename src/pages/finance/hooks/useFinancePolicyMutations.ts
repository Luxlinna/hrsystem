import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { BranchFinancePolicy } from "../types";

interface UseFinancePolicyMutationsProps {
  actorName: string;
  actorRole: string;
  targetBranch?: string | null;
  loadData: () => Promise<void>;
  setBranchPolicy: React.Dispatch<React.SetStateAction<BranchFinancePolicy | null>>;
}

export function useFinancePolicyMutations({
  actorName,
  actorRole,
  targetBranch,
  loadData,
  setBranchPolicy,
}: UseFinancePolicyMutationsProps) {
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const handleSavePolicy = useCallback(
    async (policyData: Partial<BranchFinancePolicy>) => {
      if (!targetBranch) {
        toast("Error", "Please select a specific branch first", "error");
        return;
      }
      setSavingPolicy(true);

      const payload = {
        branch_id: targetBranch,
        monthly_budget: policyData.monthly_budget,
        per_expense_cap: policyData.per_expense_cap,
        allow_custom_categories: policyData.allow_custom_categories,
        custom_categories: policyData.custom_categories,
        approval_threshold_medium: policyData.approval_threshold_medium,
        approval_threshold_high: policyData.approval_threshold_high,
        require_receipts_above: policyData.require_receipts_above,
        auto_reject_exceeding_budget: policyData.auto_reject_exceeding_budget,
        notes: policyData.notes,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("branch_finance_policies")
        .upsert(payload, { onConflict: "branch_id" })
        .select()
        .single();

      setSavingPolicy(false);
      if (error) {
        toast("Error", error.message || "Failed to update financial policy", "error");
        return;
      }

      setBranchPolicy(data as BranchFinancePolicy);
      setPolicyModalOpen(false);
      toast("Policy Saved", "Branch financial controls and limits updated.", "success");
      logActivity({
        module: "finance",
        action: "updated",
        entityType: "branch_finance_policy",
        actorName,
        actorRole,
        description: `Updated financial controls and budget policies for branch`,
      });
      loadData();
    },
    [targetBranch, actorName, actorRole, loadData, setBranchPolicy]
  );

  return {
    policyModalOpen,
    setPolicyModalOpen,
    savingPolicy,
    handleSavePolicy,
  };
}
