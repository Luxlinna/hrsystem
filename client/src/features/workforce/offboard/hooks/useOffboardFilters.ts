import { useState, useMemo } from "react";
import type { Offboarding, EmployeeOption, EnrichedOffboardingTask } from "../types";

export function useOffboardFilters(offboardings: Offboarding[], employees: EmployeeOption[]) {
  const [tab, setTab] = useState<"active" | "completed" | "tasks" | "analytics">("active");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTaskType, setFilterTaskType] = useState("all");

  const departments = useMemo(() => {
    const set = new Set<string>();
    offboardings.forEach((o) => {
      if (o.employees?.department) set.add(o.employees.department);
    });
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [offboardings, employees]);

  const activeOffboardings = useMemo(
    () => offboardings.filter((o) => o.status !== "completed"),
    [offboardings]
  );

  const completedOffboardings = useMemo(
    () => offboardings.filter((o) => o.status === "completed"),
    [offboardings]
  );

  const filteredOffboardings = useMemo(() => {
    const list = tab === "completed" ? completedOffboardings : activeOffboardings;
    return list.filter((o) => {
      if (filterDepartment !== "all" && o.employees?.department !== filterDepartment) return false;
      if (filterBranch !== "all" && o.employees?.branch_id !== filterBranch) return false;
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}`.toLowerCase();
        const roleName = (o.employees?.role || "").toLowerCase();
        const deptName = (o.employees?.department || "").toLowerCase();
        const reason = (o.reason || "").toLowerCase();
        const matchTasks = (o.tasks || []).some((t) => t.title.toLowerCase().includes(q));
        if (!empName.includes(q) && !roleName.includes(q) && !deptName.includes(q) && !reason.includes(q) && !matchTasks) {
          return false;
        }
      }
      return true;
    });
  }, [tab, activeOffboardings, completedOffboardings, filterDepartment, filterBranch, filterStatus, searchQuery]);

  const allTasks: EnrichedOffboardingTask[] = useMemo(() => {
    return offboardings.flatMap((o) =>
      (o.tasks || []).map((t) => ({
        ...t,
        offboardingStatus: o.status,
        employeeName: `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}`,
        employeeRole: o.employees?.role || "Team Member",
        employeeDept: o.employees?.department || "General",
        employeeAvatar: o.employees?.avatar_url,
        last_day: o.last_day,
      }))
    );
  }, [offboardings]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (filterTaskType !== "all" && t.type !== filterTaskType) return false;
      if (filterDepartment !== "all" && t.employeeDept !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = t.title.toLowerCase().includes(q);
        const empMatch = t.employeeName.toLowerCase().includes(q);
        const assigneeMatch = t.assignee.toLowerCase().includes(q);
        if (!titleMatch && !empMatch && !assigneeMatch) return false;
      }
      return true;
    });
  }, [allTasks, filterTaskType, filterDepartment, searchQuery]);

  // Operational metrics
  const totalActiveCount = activeOffboardings.length;
  const inClearanceCount = activeOffboardings.filter((o) => o.status === "clearance").length;
  const totalCompletedCount = completedOffboardings.length;
  const pendingTasksCount = allTasks.filter((t) => t.status === "pending").length;
  const overdueTasksCount = allTasks.filter(
    (t) => t.status === "pending" && t.due_date && new Date(t.due_date + "T00:00:00") < new Date()
  ).length;

  // Chart data
  const reasonChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    offboardings.forEach((o) => {
      const r = o.reason || "Unspecified";
      counts[r] = (counts[r] || 0) + 1;
    });
    const colors = ["#253C7D", "#0284C7", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#64748B"];
    return Object.entries(counts).map(([reason, count], idx) => ({
      name: reason,
      value: count,
      fill: colors[idx % colors.length],
    }));
  }, [offboardings]);

  const deptChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    offboardings.forEach((o) => {
      const d = o.employees?.department || "General";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([department, count]) => ({
      department,
      count,
    }));
  }, [offboardings]);

  return {
    tab,
    setTab,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterDepartment,
    setFilterDepartment,
    filterBranch,
    setFilterBranch,
    filterStatus,
    setFilterStatus,
    filterTaskType,
    setFilterTaskType,
    departments,
    activeOffboardings,
    completedOffboardings,
    filteredOffboardings,
    allTasks,
    filteredTasks,
    totalActiveCount,
    inClearanceCount,
    totalCompletedCount,
    pendingTasksCount,
    overdueTasksCount,
    reasonChartData,
    deptChartData,
  };
}
