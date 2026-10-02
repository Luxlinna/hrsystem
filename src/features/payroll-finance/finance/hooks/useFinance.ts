import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { Expense } from "../types";
import { exportExpensesCSV } from "../exportUtils";
import { useFinanceData } from "./useFinanceData";
import { useFinanceFilters } from "./useFinanceFilters";
import { useFinanceMutations } from "./useFinanceMutations";

export function useFinance() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const canManage = isAdmin || (!!role && role.name !== "Chairman");

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // 1. Data Layer
  const {
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
  } = useFinanceData();

  // 2. Filter & Analytics Layer
  const filters = useFinanceFilters(expenses);

  // 3. Mutation Layer
  const mutations = useFinanceMutations({
    expenses,
    setExpenses,
    selectedExpense,
    setSelectedExpense,
    canManage: canManage && !isPartnerBranchBlocked,
    actorName,
    actorRole: role?.name || "Unknown",
    targetBranch,
    loadData,
    setBranchPolicy,
  });

  const handleExportCSV = useCallback(() => {
    exportExpensesCSV(filters.filtered);
  }, [filters.filtered]);

  return {
    canManage: canManage && !isPartnerBranchBlocked,
    isSuperAdmin,
    isBranchAdmin,
    isPartnerBranchBlocked,
    userBranchId,
    targetBranch,
    branchPolicy,
    actorName,
    expenses,
    branches,
    loading,
    selectedExpense,
    setSelectedExpense,
    ...filters,
    ...mutations,
    handleExportCSV,
  };
}
