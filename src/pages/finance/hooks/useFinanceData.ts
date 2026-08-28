import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { Expense, Branch, BranchFinancePolicy } from "../types";
import { DEFAULT_BRANCH_FINANCE_POLICY } from "../constants";

export function useFinanceData() {
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId } = useBranchScope();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' financial data.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchPolicy, setBranchPolicy] = useState<BranchFinancePolicy | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch branches
      const { data: branchData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      setBranches((branchData as Branch[]) || []);

      // 2. Strict Partner Branch Isolation: If user does not belong to this branch, block access
      if (isPartnerBranchBlocked || !targetBranch) {
        setExpenses([]);
        setBranchPolicy(null);
        setLoading(false);
        return;
      }

      // 3. Fetch branch-specific finance policy
      const { data: policyData } = await supabase
        .from("branch_finance_policies")
        .select("*")
        .eq("branch_id", targetBranch)
        .maybeSingle();

      if (policyData) {
        setBranchPolicy(policyData as BranchFinancePolicy);
      } else {
        setBranchPolicy({
          branch_id: targetBranch,
          ...DEFAULT_BRANCH_FINANCE_POLICY,
        } as BranchFinancePolicy);
      }

      // 4. Fetch branch-scoped expense records
      const { data: expData } = await supabase
        .from("expense_records")
        .select("*, branches(id, name)")
        .is("deleted_at", null)
        .or(`branch_id.eq.${targetBranch},branch_id.is.null`)
        .order("date", { ascending: false });

      setExpenses((expData as unknown as Expense[]) || []);
    } catch (err) {
      console.error("Failed to load finance data:", err);
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    isSuperAdmin,
    isBranchAdmin,
    isPartnerBranchBlocked,
    userBranchId,
    targetBranch,
    expenses,
    setExpenses,
    branchPolicy,
    setBranchPolicy,
    branches,
    loading,
    loadData,
  };
}
