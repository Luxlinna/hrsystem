import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { EmployeeExit } from "../types";

function parseExitRow(row: any): EmployeeExit {
  let is_blacklisted = Boolean(row.is_blacklisted);
  let remark = row.remark || "";
  let contract_type = row.contract_type || "";
  let severance_pay_info = row.severance_pay_info || null;
  let reason_description = row.reason_description || "";

  if (typeof reason_description === "string" && reason_description.startsWith("[EXIT_META:")) {
    const endIdx = reason_description.indexOf("]");
    if (endIdx !== -1) {
      try {
        const metaStr = reason_description.slice(11, endIdx);
        const meta = JSON.parse(metaStr);
        if (meta.is_blacklisted !== undefined) is_blacklisted = Boolean(meta.is_blacklisted);
        if (meta.remark !== undefined) remark = meta.remark;
        if (meta.contract_type !== undefined) contract_type = meta.contract_type;
        if (meta.severance_pay_info !== undefined) severance_pay_info = meta.severance_pay_info;
        reason_description = reason_description.slice(endIdx + 1);
      } catch {
        // preserve
      }
    }
  }

  return {
    ...row,
    is_blacklisted,
    remark,
    contract_type,
    severance_pay_info,
    reason_description,
  };
}

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
        `*, ${empJoin}(first_name, last_name, role, department, avatar_url, branch_id, biometric_user_id, employee_code, contract_type, branches(id, name))`
      )
      .order("last_working_day", { ascending: false });

    // Scope to branch via joined employees
    if (activeBranch && !isPartnerBranchBlocked) {
      query = query.eq("employees.branch_id", activeBranch);
    }

    const { data, error } = await query;
    if (!error) setExits(((data as any[]) || []).map(parseExitRow));
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
