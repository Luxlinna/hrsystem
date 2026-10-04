import { useState, useMemo } from "react";
import type { Tool, Employee, ToolAssignment, ToolUsage, ToolsTab, ToolsViewMode } from "../types";

interface UseToolsFiltersProps {
  tools: Tool[];
  employees: Employee[];
  assignments: ToolAssignment[];
  usages: ToolUsage[];
}

export function useToolsFilters({
  tools,
  employees,
  assignments,
  usages,
}: UseToolsFiltersProps) {
  const [tab, setTab] = useState<ToolsTab>("tools");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ToolsViewMode>("cards");

  // Aggregate Metrics
  const activeTools = useMemo(() => tools.filter((t) => t.status === "active").length, [tools]);
  const totalAssignments = useMemo(() => assignments.length, [assignments]);
  const totalUsages = useMemo(() => usages.length, [usages]);
  const avgUsagePerTool = tools.length > 0 ? Math.round(totalUsages / tools.length) : 0;

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    tools.forEach((t) => t.category && set.add(t.category));
    return ["All", ...Array.from(set)];
  }, [tools]);

  // Distinct Employee Departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.department && set.add(e.department));
    return ["All", ...Array.from(set).sort()];
  }, [employees]);

  // Filtered tools
  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (t.name || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [tools, categoryFilter, searchQuery]);

  return {
    tab,
    setTab,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    activeTools,
    totalAssignments,
    totalUsages,
    avgUsagePerTool,
    categories,
    departments,
    filteredTools,
  };
}
