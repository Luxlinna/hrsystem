import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { Employee, Branch } from "../types";

export function useOrgChartData(
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, effectiveBranchId, userBranchId } = useBranchScope();
  const canEditManager = isAdmin || Boolean(role?.employees_manage);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const targetBranch = effectiveBranchId || (!isSuperAdmin ? userBranchId : null);

    let query = supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url, reports_to, status, branch_id, email, phone, branches(id, name)")
      .is("deleted_at", null)
      .order("department")
      .order("first_name");

    if (targetBranch) {
      query = query.eq("branch_id", targetBranch);
    }

    let branchQuery = supabase.from("branches").select("id, name").order("name");
    if (targetBranch) {
      branchQuery = branchQuery.eq("id", targetBranch);
    }

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
  }, [setExpandedIds, effectiveBranchId, isSuperAdmin, userBranchId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    canEditManager,
    employees,
    branches,
    isSuperAdmin,
    effectiveBranchId,
    userBranchId,
    setEmployees,
    loading,
    loadEmployees,
  };
}
