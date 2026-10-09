import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import type { ComplaintSuggestion, ComplaintStats } from "../types";

export function useComplaintsData() {
  const { targetBranch, userBranchId, isPartnerBranchBlocked } = useBranchScope();
  const { isEmployee, isAdmin, isSuperAdmin, isLineManager } = usePermissions();
  const { employee: myEmployee } = useMyEmployee();
  const activeBranch = targetBranch || userBranchId || null;

  const [records, setRecords] = useState<ComplaintSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateOption, setFilterDateOption] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("complaints_suggestions")
      .select(
        `*,
         employees(first_name, last_name, role, department, avatar_url, branch_id),
         branches(id, name)`
      )
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    // Scoping for employees / partner branches
    if (isEmployee && !isAdmin && !isSuperAdmin && !isLineManager && myEmployee?.id) {
      query = query.eq("employee_id", myEmployee.id);
    } else if (isPartnerBranchBlocked && activeBranch) {
      query = query.eq("branch_id", activeBranch);
    }

    const { data, error } = await query;
    if (!error && data) {
      setRecords(data as unknown as ComplaintSuggestion[]);
    } else {
      setRecords([]);
    }
    setLoading(false);
  }, [activeBranch, isPartnerBranchBlocked, isEmployee, isAdmin, isSuperAdmin, isLineManager, myEmployee?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered view
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const empName = `${r.employees?.last_name ?? ""} ${r.employees?.first_name ?? ""}`.toLowerCase();
        const subj = (r.subject || "").toLowerCase();
        const det = (r.details || "").toLowerCase();
        const tgt = (r.target_to || "").toLowerCase();
        const rem = (r.remark ?? "").toLowerCase();
        const sug = (r.suggestion ?? "").toLowerCase();

        if (
          !empName.includes(q) &&
          !subj.includes(q) &&
          !det.includes(q) &&
          !tgt.includes(q) &&
          !rem.includes(q) &&
          !sug.includes(q)
        ) {
          return false;
        }
      }

      if (filterStatus !== "all" && r.status !== filterStatus) return false;

      // Date range filtering
      if (filterDateOption && filterDateOption !== "all") {
        const rawDateStr = r.entry_date || r.created_at;
        if (!rawDateStr) return false;
        const entryD = new Date(rawDateStr);
        if (isNaN(entryD.getTime())) return false;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (filterDateOption === "today") {
          if (entryD < todayStart || entryD > todayEnd) return false;
        } else if (filterDateOption === "this_week") {
          const day = todayStart.getDay();
          const s = new Date(todayStart);
          s.setDate(todayStart.getDate() - (day === 0 ? 6 : day - 1));
          const e = new Date(s);
          e.setDate(s.getDate() + 6);
          e.setHours(23, 59, 59, 999);
          if (entryD < s || entryD > e) return false;
        } else if (filterDateOption === "this_month") {
          const s = new Date(now.getFullYear(), now.getMonth(), 1);
          const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          if (entryD < s || entryD > e) return false;
        } else if (filterDateOption === "this_year") {
          const s = new Date(now.getFullYear(), 0, 1);
          const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          if (entryD < s || entryD > e) return false;
        } else if (filterDateOption === "custom") {
          if (startDate) {
            const s = new Date(startDate);
            s.setHours(0, 0, 0, 0);
            if (entryD < s) return false;
          }
          if (endDate) {
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            if (entryD > e) return false;
          }
        }
      }

      return true;
    });
  }, [records, searchQuery, filterStatus, filterDateOption, startDate, endDate]);

  const stats: ComplaintStats = useMemo(() => {
    return {
      total: records.length,
      pending: records.filter((r) => r.status === "pending").length,
      inReview: records.filter((r) => r.status === "in_review").length,
      resolved: records.filter((r) => r.status === "resolved").length,
    };
  }, [records]);

  return {
    records,
    filtered,
    loading,
    stats,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterDateOption,
    setFilterDateOption,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loadData,
  };
}
