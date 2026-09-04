import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Branch } from "../types";

export function useBranchesData() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBranches = useCallback(async () => {
    const [branchesRes, empRes] = await Promise.all([
      supabase
        .from("branches")
        .select(
          "id, name, location, manager_name, employee_count, status, created_at, latitude, longitude, geofence_radius_m, work_start_time, work_end_time, late_grace_minutes, early_leave_grace_minutes, deleted_at, deleted_by"
        )
        .is("deleted_at", null),
      supabase
        .from("employees")
        .select("id, branch_id, status")
        .is("deleted_at", null),
    ]);

    const branchesList: Branch[] = branchesRes.data || [];
    const employeesList = empRes.data || [];

    // Map actual employees count per branch from the employees table
    const countMap: Record<string, number> = {};
    for (const emp of employeesList) {
      if (emp.branch_id) {
        countMap[emp.branch_id] = (countMap[emp.branch_id] || 0) + 1;
      }
    }

    const calculatedBranches = branchesList.map((branch) => ({
      ...branch,
      employee_count: countMap[branch.id] ?? 0,
    }));

    // Sort by employee count descending, then by name
    calculatedBranches.sort(
      (a, b) => (b.employee_count - a.employee_count) || a.name.localeCompare(b.name)
    );

    setBranches(calculatedBranches);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBranches();
    const channel = supabase
      .channel("branches-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, () => loadBranches())
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => loadBranches())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBranches]);

  return {
    branches,
    setBranches,
    loading,
    loadBranches,
  };
}
