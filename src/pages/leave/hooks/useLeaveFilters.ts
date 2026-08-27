import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { LeaveRequest, Employee } from "../types";

export function useLeaveFilters(requests: LeaveRequest[], employees: Employee[]) {
  const [activeTab, setActiveTab] = useState<"requests" | "balances" | "calendar">("requests");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Deep link highlight
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    if (!highlightId || requests.length === 0) return;
    const idx = requests.findIndex((r) => r.id === highlightId);
    if (idx === -1) return;
    setStatusFilter("all");
    setPage(Math.floor(idx / pageSize) + 1);
    setActiveTab("requests");
    const t = setTimeout(() => {
      const desktopEl = document.getElementById(`leave-request-desktop-${highlightId}`);
      const mobileEl = document.getElementById(`leave-request-mobile-${highlightId}`);
      const el =
        (desktopEl && desktopEl.offsetParent !== null && desktopEl) ||
        (mobileEl && mobileEl.offsetParent !== null && mobileEl) ||
        desktopEl ||
        mobileEl;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 150);
    return () => clearTimeout(t);
  }, [highlightId, requests, pageSize]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (leaveTypeFilter !== "all" && r.leave_type !== leaveTypeFilter) return false;
      if (departmentFilter !== "all" && r.employees?.department !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const empRole = (r.employees?.role || "").toLowerCase();
        const empDept = (r.employees?.department || "").toLowerCase();
        const leaveType = (r.leave_type || "").toLowerCase();
        const reason = (r.reason || "").toLowerCase();
        if (
          !empName.includes(q) &&
          !empRole.includes(q) &&
          !empDept.includes(q) &&
          !leaveType.includes(q) &&
          !reason.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, leaveTypeFilter, departmentFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filteredRequests.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filteredRequests.length);
  const pagedRows = filteredRequests.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return {
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    leaveTypeFilter,
    setLeaveTypeFilter,
    pageSize,
    setPageSize,
    page,
    setPage,
    departments,
    filteredRequests,
    totalPages,
    safePage,
    pageStart,
    pageEnd,
    pagedRows,
  };
}
