import { useState, useMemo } from "react";
import type { OnboardingHire, ChecklistTask } from "../types";
import { isOverdue } from "../checklistUtils";

export function useChecklistFilters(
  hires: OnboardingHire[],
  hireTasks: ChecklistTask[]
) {
  // Candidate filters
  const [hireSearch, setHireSearch] = useState("");
  const [hireStatusTab, setHireStatusTab] = useState<"all" | "in_progress" | "completed" | "pending">("all");

  // Task filters
  const [taskSearch, setTaskSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "overdue">("all");
  const [viewLayout, setViewLayout] = useState<"category" | "list" | "urgency">("category");

  const filteredHires = useMemo(() => {
    return hires.filter((h) => {
      const name = h.employees ? `${h.employees.first_name} ${h.employees.last_name}`.toLowerCase() : "new hire";
      const role = (h.employees?.role || "").toLowerCase();
      const dept = (h.employees?.department || "").toLowerCase();
      const branch = (h.employees?.branches?.name || "").toLowerCase();
      const q = hireSearch.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || role.includes(q) || dept.includes(q) || branch.includes(q);
      if (!matchesSearch) return false;

      if (hireStatusTab === "completed") return h.status === "completed";
      if (hireStatusTab === "pending") return h.status === "pending";
      if (hireStatusTab === "in_progress") return h.status === "approved" || h.status === "in_progress";
      return true;
    });
  }, [hires, hireSearch, hireStatusTab]);

  const displayTasks = useMemo(() => {
    return hireTasks.filter((t) => {
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;

      if (filterStatus === "completed" && !t.completed) return false;
      if (filterStatus === "pending" && (t.completed || isOverdue(t))) return false;
      if (filterStatus === "overdue" && !isOverdue(t)) return false;

      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const matchesName = t.task_name.toLowerCase().includes(q);
        const matchesDesc = (t.description || "").toLowerCase().includes(q);
        const matchesAssignee = (t.assigned_to || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesAssignee) return false;
      }
      return true;
    });
  }, [hireTasks, filterCategory, filterPriority, filterStatus, taskSearch]);

  return {
    hireSearch,
    setHireSearch,
    hireStatusTab,
    setHireStatusTab,
    taskSearch,
    setTaskSearch,
    filterCategory,
    setFilterCategory,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    viewLayout,
    setViewLayout,
    filteredHires,
    displayTasks,
  };
}
