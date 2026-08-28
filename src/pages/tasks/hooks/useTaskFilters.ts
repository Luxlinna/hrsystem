import { useState, useMemo } from "react";
import type { Task, TaskViewMode, TaskSortField, TaskSortOrder } from "../types";
import { PRIORITY_META } from "../constants";
import { isOverdue } from "../taskUtils";

export function useTaskFilters(tasks: Task[], currentEmployeeId?: string | null) {
  const [viewMode, setViewMode] = useState<TaskViewMode>("board");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickTab, setQuickTab] = useState<"all" | "team" | "my" | "urgent">("all");
  const [outsideWorkOnly, setOutsideWorkOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortField, setSortField] = useState<TaskSortField>("created_at");
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>("desc");

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (quickTab === "my" && currentEmployeeId && t.assigned_to !== currentEmployeeId) return false;
        if (quickTab === "team" && currentEmployeeId && t.assigned_to === currentEmployeeId) return false;
        if (quickTab === "urgent" && t.priority !== "high" && t.priority !== "urgent") return false;
        if (assigneeFilter !== "all" && t.assigned_to !== assigneeFilter) return false;
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (outsideWorkOnly && !t.is_outside_work) return false;
        if (overdueOnly && !isOverdue(t)) return false;
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = (t.description || "").toLowerCase().includes(q);
          const matchAssignee = `${t.employees?.first_name || ""} ${t.employees?.last_name || ""}`
            .toLowerCase()
            .includes(q);
          return matchTitle || matchDesc || matchAssignee;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === "due_date") {
          const aD = a.due_date || "9999-99-99";
          const bD = b.due_date || "9999-99-99";
          diff = aD.localeCompare(bD);
        } else if (sortField === "priority") {
          diff = (PRIORITY_META[b.priority]?.weight || 0) - (PRIORITY_META[a.priority]?.weight || 0);
        } else if (sortField === "title") {
          diff = a.title.localeCompare(b.title);
        } else {
          diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return sortOrder === "asc" ? diff : -diff;
      });
  }, [
    tasks,
    quickTab,
    currentEmployeeId,
    assigneeFilter,
    priorityFilter,
    statusFilter,
    outsideWorkOnly,
    overdueOnly,
    search,
    sortField,
    sortOrder,
  ]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const overdue = tasks.filter((t) => isOverdue(t)).length;
    const outside = tasks.filter((t) => t.is_outside_work).length;
    return { total, completed, inProgress, blocked, overdue, outside };
  }, [tasks]);

  return {
    viewMode,
    setViewMode,
    search,
    setSearch,
    assigneeFilter,
    setAssigneeFilter,
    priorityFilter,
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    quickTab,
    setQuickTab,
    outsideWorkOnly,
    setOutsideWorkOnly,
    overdueOnly,
    setOverdueOnly,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    filteredTasks,
    stats,
  };
}
