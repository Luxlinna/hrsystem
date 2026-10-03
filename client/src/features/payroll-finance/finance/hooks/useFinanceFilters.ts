import { useState, useMemo, useEffect } from "react";
import type { Expense, DatePreset, ViewMode, CategoryChartItem, MonthlyTimelineItem } from "../types";
import { resolveDateRangeBounds } from "../dateUtils";
import { CATEGORY_COLORS } from "../constants";

export function useFinanceFilters(expenses: Expense[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);

  const dateRangeBounds = useMemo(
    () => resolveDateRangeBounds(datePreset, fromDate, toDate),
    [datePreset, fromDate, toDate]
  );

  const filtered = useMemo(() => {
    return expenses.filter((d) => {
      if (categoryFilter !== "All Categories" && d.category !== categoryFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (branchFilter !== "all" && d.branch_id !== branchFilter) return false;

      if (dateRangeBounds) {
        if (d.date < dateRangeBounds.start || d.date > dateRangeBounds.end) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cat = (d.category || "").toLowerCase();
        const desc = (d.description || "").toLowerCase();
        const submitter = (d.submitted_by || "").toLowerCase();
        const branch = (d.branches?.name || "").toLowerCase();
        const amt = String(d.amount);
        const date = (d.date || "").toLowerCase();

        if (
          !cat.includes(q) &&
          !desc.includes(q) &&
          !submitter.includes(q) &&
          !branch.includes(q) &&
          !amt.includes(q) &&
          !date.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, categoryFilter, statusFilter, branchFilter, dateRangeBounds, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);
  const pagedExpenses = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Aggregate KPIs
  const totalAmount = useMemo(() => filtered.reduce((s, d) => s + Number(d.amount || 0), 0), [filtered]);
  const paidAmount = useMemo(
    () => filtered.filter((d) => d.status === "paid").reduce((s, d) => s + Number(d.amount || 0), 0),
    [filtered]
  );
  const approvedAmount = useMemo(
    () => filtered.filter((d) => d.status === "approved").reduce((s, d) => s + Number(d.amount || 0), 0),
    [filtered]
  );
  const pendingAmount = useMemo(
    () => filtered.filter((d) => d.status === "pending").reduce((s, d) => s + Number(d.amount || 0), 0),
    [filtered]
  );

  // Category Breakdown Data
  const categoryChartData: CategoryChartItem[] = useMemo(() => {
    const acc: Record<string, number> = {};
    filtered.forEach((e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
    });
    return Object.entries(acc)
      .map(([name, value]) => ({
        name,
        value: +value.toFixed(2),
        fill: CATEGORY_COLORS[name] || "#253C7D",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Monthly Spending Timeline Data
  const monthlyTimelineData: MonthlyTimelineItem[] = useMemo(() => {
    const acc: Record<string, { total: number; paid: number }> = {};
    expenses.forEach((e) => {
      const month = e.date ? e.date.slice(0, 7) : "Unknown";
      if (!acc[month]) acc[month] = { total: 0, paid: 0 };
      acc[month].total += Number(e.amount || 0);
      if (e.status === "paid") acc[month].paid += Number(e.amount || 0);
    });

    return Object.entries(acc)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, val]) => ({
        month,
        total: +(val.total / 1000).toFixed(1),
        paid: +(val.paid / 1000).toFixed(1),
      }));
  }, [expenses]);

  return {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    branchFilter,
    setBranchFilter,
    datePreset,
    setDatePreset,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    viewMode,
    setViewMode,
    pageSize,
    setPageSize,
    page,
    setPage,
    filtered,
    totalPages,
    safePage,
    pageStart,
    pageEnd,
    pagedExpenses,
    totalAmount,
    paidAmount,
    approvedAmount,
    pendingAmount,
    categoryChartData,
    monthlyTimelineData,
  };
}
