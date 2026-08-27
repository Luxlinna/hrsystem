import { useState, useMemo } from "react";
import type { LeaveRequest, Employee } from "../types";
import { LEAVE_TYPE_CONFIG } from "../constants";

export function useLeaveCalendarFilters(leaves: LeaveRequest[], employees: Employee[]) {
  const [viewMode, setViewMode] = useState<"month" | "timeline" | "agenda">("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"approved" | "pending" | "all">("approved");

  // Agenda Pagination
  const [agendaPage, setAgendaPage] = useState(1);
  const [agendaPageSize, setAgendaPageSize] = useState(8);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(set).sort();
  }, [employees]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      if (l.status === "cancelled") return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (deptFilter !== "all" && l.employees?.department !== deptFilter) return false;
      if (typeFilter !== "all" && l.leave_type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${l.employees?.first_name || ""} ${l.employees?.last_name || ""}`.toLowerCase();
        const dept = (l.employees?.department || "").toLowerCase();
        const roleName = (l.employees?.role || "").toLowerCase();
        const reason = (l.reason || "").toLowerCase();
        const typeLabel = (LEAVE_TYPE_CONFIG[l.leave_type]?.label || l.leave_type).toLowerCase();
        if (
          !fullName.includes(q) &&
          !dept.includes(q) &&
          !roleName.includes(q) &&
          !reason.includes(q) &&
          !typeLabel.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [leaves, statusFilter, deptFilter, typeFilter, searchQuery]);

  const totalAgendaPages = Math.max(1, Math.ceil(filteredLeaves.length / agendaPageSize));
  const safeAgendaPage = Math.min(agendaPage, totalAgendaPages);
  const pagedAgendaLeaves = useMemo(() => {
    const start = (safeAgendaPage - 1) * agendaPageSize;
    return filteredLeaves.slice(start, start + agendaPageSize);
  }, [filteredLeaves, safeAgendaPage, agendaPageSize]);

  return {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    deptFilter,
    setDeptFilter,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    agendaPage,
    setAgendaPage,
    agendaPageSize,
    setAgendaPageSize,
    departments,
    filteredLeaves,
    totalAgendaPages,
    safeAgendaPage,
    pagedAgendaLeaves,
  };
}
