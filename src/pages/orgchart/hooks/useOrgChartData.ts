import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { Employee, Branch } from "../types";

export function useOrgChartData(
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const canEditManager = (isAdmin || Boolean(role?.employees_manage)) && !isPartnerBranchBlocked;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setEmployees([]);
      setBranches([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const query = supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url, reports_to, status, branch_id, email, phone, branches(id, name)")
      .is("deleted_at", null)
      .eq("branch_id", targetBranch)
      .order("department")
      .order("first_name");

    const branchQuery = supabase.from("branches").select("id, name").eq("id", targetBranch).order("name");

    const [{ data: empData }, { data: branchData }] = await Promise.all([
      query,
      branchQuery,
    ]);

    const list = (empData || []) as unknown as Employee[];
    const empIds = new Set(list.map((e) => e.id));
    setEmployees(list);
    setBranches((branchData || []) as unknown as Branch[]);

    // Root nodes: no reports_to OR manager not in this branch list
    const topLevel = list.filter((e) => !e.reports_to || !empIds.has(e.reports_to));
    setExpandedIds(new Set(topLevel.map((e) => e.id)));
    setLoading(false);
  }, [setExpandedIds, isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    canEditManager,
    employees,
    branches,
    loading,
    loadEmployees,
  };
}
