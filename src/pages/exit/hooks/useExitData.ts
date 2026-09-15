import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { EmployeeExit } from "../types";

export function useExitData() {
  const { targetBranch, userBranchId, isPartnerBranchBlocked } = useBranchScope();
  const activeBranch = targetBranch || userBranchId || null;
  const [exits, setExits] = useState<EmployeeExit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterExitType, setFilterExitType] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const empJoin = activeBranch && !isPartnerBranchBlocked ? "employees!inner" : "employees";
    let query = supabase
      .from("employee_exits")
      .select(
        `*, ${empJoin}(first_name, last_name, role, department, avatar_url, branch_id, branches(id, name))`
      )
      .order("last_working_day", { ascending: false });

    // Scope to branch via joined employees
    if (activeBranch && !isPartnerBranchBlocked) {
      query = query.eq("employees.branch_id", activeBranch);
    }

    const { data, error } = await query;
    if (!error) setExits((data as unknown as EmployeeExit[]) || []);
    setLoading(false);
  }, [activeBranch, isPartnerBranchBlocked]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtered exits ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return exits.filter((ex) => {
      const empName = `${ex.employees?.first_name ?? ""} ${ex.employees?.last_name ?? ""}`.toLowerCase();
      const buName = (ex.employees?.branches?.name ?? "").toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      if (q && !empName.includes(q) && !ex.employee_id?.toLowerCase().includes(q) && !buName.includes(q)) return false;
      if (filterExitType !== "all" && ex.exit_type !== filterExitType) return false;
      if (filterDateFrom && ex.last_working_day < filterDateFrom) return false;
      if (filterDateTo   && ex.last_working_day > filterDateTo)   return false;
      return true;
    });
  }, [exits, searchQuery, filterExitType, filterDateFrom, filterDateTo]);

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return {
      total: exits.length,
      thisMonth: exits.filter((e) => e.last_working_day.startsWith(thisMonth)).length,
      resignations: exits.filter((e) => e.exit_type === "resignation").length,
      terminations: exits.filter((e) => e.exit_type === "termination").length,
    };
  }, [exits]);

  return {
    exits,
    filtered,
    loading,
    stats,
    searchQuery, setSearchQuery,
    filterExitType, setFilterExitType,
    filterDateFrom, setFilterDateFrom,
    filterDateTo,   setFilterDateTo,
    loadData,
  };
}
