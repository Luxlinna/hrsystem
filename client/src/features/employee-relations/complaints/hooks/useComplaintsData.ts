import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { ComplaintSuggestion, ComplaintStats } from "../types";

export function useComplaintsData() {
  const { targetBranch, userBranchId, isPartnerBranchBlocked } = useBranchScope();
  const activeBranch = targetBranch || userBranchId || null;

  const [records, setRecords] = useState<ComplaintSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("complaints_suggestions")
      .select(
        `*,
         employees(first_name, last_name, role, department, avatar_url),
         branches(id, name)`
      )
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    // Strict dynamic BU scoping
    if (activeBranch && !isPartnerBranchBlocked) {
      query = query.eq("branch_id", activeBranch);
    }

    const { data, error } = await query;
    if (!error && data) {
      setRecords(data as unknown as ComplaintSuggestion[]);
    } else {
      setRecords([]);
    }
    setLoading(false);
  }, [activeBranch, isPartnerBranchBlocked]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered view
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const empName = `${r.employees?.first_name ?? ""} ${r.employees?.last_name ?? ""}`.toLowerCase();
        const subj = r.subject.toLowerCase();
        const det = r.details.toLowerCase();
        const tgt = r.target_to.toLowerCase();
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

      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterDateFrom && r.entry_date < filterDateFrom) return false;
      if (filterDateTo && r.entry_date > filterDateTo) return false;

      return true;
    });
  }, [records, searchQuery, filterType, filterStatus, filterDateFrom, filterDateTo]);

  // KPI Metrics
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
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    loadData,
  };
}
