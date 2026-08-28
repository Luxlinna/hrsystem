import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { Tool, Employee, ToolAssignment, ToolUsage } from "../types";

export function useToolsData() {
  const { isSuperAdmin, effectiveBranchId, userBranchId, userBranchName } = useBranchScope();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' tools/activity.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const [tools, setTools] = useState<Tool[]>([]);
  const [assignments, setAssignments] = useState<ToolAssignment[]>([]);
  const [usages, setUsages] = useState<ToolUsage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setTools([]);
      setAssignments([]);
      setUsages([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [toolsRes, empRes] = await Promise.all([
      supabase
        .from("tools")
        .select("*")
        .or(`branch_id.is.null,branch_id.eq.${targetBranch}`)
        .order("id"),
      supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id")
        .eq("branch_id", targetBranch)
        .is("deleted_at", null)
        .order("first_name"),
    ]);

    const toolList = (toolsRes.data as Tool[]) || [];
    const empList = (empRes.data as Employee[]) || [];
    const empIds = new Set(empList.map((e) => e.id));

    setTools(toolList);
    setEmployees(empList);

    if (toolList.length > 0 && empList.length > 0) {
      const toolIds = toolList.map((t) => t.id);
      const [assignRes, usageRes] = await Promise.all([
        supabase
          .from("tool_assignments")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id)")
          .in("tool_id", toolIds)
          .is("revoked_at", null),
        supabase
          .from("tool_usages")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id)")
          .in("tool_id", toolIds)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const filteredAssignments = ((assignRes.data as unknown as ToolAssignment[]) || []).filter(
        (a: any) => empIds.has(a.employee_id) || a.employees?.branch_id === targetBranch
      );

      const filteredUsages = ((usageRes.data as unknown as ToolUsage[]) || []).filter(
        (u: any) => empIds.has(u.employee_id) || u.employees?.branch_id === targetBranch
      );

      setAssignments(filteredAssignments);
      setUsages(filteredUsages);
    } else {
      setAssignments([]);
      setUsages([]);
    }
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    tools,
    assignments,
    usages,
    employees,
    loading,
    loadData,
  };
}
