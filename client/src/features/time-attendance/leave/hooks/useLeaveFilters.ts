import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { LeaveRequest, Employee } from "../types";
import { getLeaveEmployeeName } from "../utils/leaveDisplayUtils";

export function useLeaveFilters(
  requests: LeaveRequest[],
  employees: Employee[],
  onInspectRequest?: (req: LeaveRequest) => void
) {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"requests" | "balances" | "calendar">(
    initialTab === "calendar" || initialTab === "balances" || initialTab === "requests"
      ? initialTab
      : "requests"
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const parsedPage = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPageState] = useState<number>(!isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1);

  const [, setSearchParams] = useSearchParams();
  const setPage = useCallback((newPageOrFn: number | ((prev: number) => number)) => {
    setPageState((prev) => {
      const resolved = typeof newPageOrFn === "function" ? newPageOrFn(prev) : newPageOrFn;
      const validPage = Math.max(1, resolved);
      setSearchParams((sp) => {
        const next = new URLSearchParams(sp);
        if (validPage > 1) {
          next.set("page", String(validPage));
        } else {
          next.delete("page");
        }
        return next;
      });
      return validPage;
    });
  }, [setSearchParams]);

  // Deep link highlight
  const highlightId = searchParams.get("highlight");
  const handledTargetRef = useRef<string | null>(null);

  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam === "calendar" || tabParam === "balances" || tabParam === "requests") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const targetId = highlightId || searchParams.get("requestId");
    if (!targetId || handledTargetRef.current === targetId) return;

    const req = requests.find((r) => r.id === targetId || r.employee_id === targetId);
    if (req) {
      handledTargetRef.current = targetId;
      setStatusFilter("all");
      const idx = requests.indexOf(req);
      if (idx !== -1) setPage(Math.floor(idx / pageSize) + 1);
      setActiveTab("requests");
      onInspectRequest?.(req);
      const t = setTimeout(() => {
        const desktopEl = document.getElementById(`leave-request-desktop-${req.id}`);
        const mobileEl = document.getElementById(`leave-request-mobile-${req.id}`);
        const el =
          (desktopEl && desktopEl.offsetParent !== null && desktopEl) ||
          (mobileEl && mobileEl.offsetParent !== null && mobileEl) ||
          desktopEl ||
          mobileEl;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(t);
    }

    // Direct fallback fetch if request is cross-branch or not yet in array
    supabase
      .from("leave_requests")
      .select("id, employee_id, leave_type, start_date, end_date, days, status, reason, created_at, employees(id, first_name, last_name, display_name, full_name, role, department, avatar_url, email, branch_id, reports_to, employee_code, biometric_user_id)")
      .or(`id.eq.${targetId},employee_id.eq.${targetId}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: fetched }) => {
        if (fetched) {
          handledTargetRef.current = targetId;
          const normalized = {
            ...fetched,
            employees: Array.isArray(fetched.employees) ? fetched.employees[0] : fetched.employees || null,
          } as LeaveRequest;
          setStatusFilter("all");
          setActiveTab("requests");
          onInspectRequest?.(normalized);
        }
      });
  }, [highlightId, searchParams, requests, pageSize, onInspectRequest, setPage]);

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
        const empName = getLeaveEmployeeName(r.employees).toLowerCase();
        const empFirstLast = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const empCode = (r.employees?.employee_code || r.employees?.biometric_user_id || "").toLowerCase();
        const empRole = (r.employees?.role || "").toLowerCase();
        const empDept = (r.employees?.department || "").toLowerCase();
        const leaveType = (r.leave_type || "").toLowerCase();
        const reason = (r.reason || "").toLowerCase();
        if (
          !empName.includes(q) &&
          !empFirstLast.includes(q) &&
          !empCode.includes(q) &&
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
  }, [page, totalPages, setPage]);

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
