import { useState, useEffect, useCallback, useMemo } from "react";
import type { Employee, TreeNode } from "../types";
import { buildTree, subtreeMatchesFilters } from "../orgChartUtils";
import { toast } from "@/components/Toast";

export function useOrgChartTree(
  employees: Employee[],
  deptFilter: string,
  searchTerm: string
) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Check whether any employee in the current branch has subordinates
  const hasExpandableNodes = useMemo(() => {
    const ids = new Set(employees.map((e) => e.id));
    return employees.some((e) => e.reports_to && ids.has(e.reports_to));
  }, [employees]);

  // Initial setup: on load or branch change, start with roots expanded
  useEffect(() => {
    if (employees.length > 0) {
      const empIds = new Set(employees.map((e) => e.id));
      const topLevel = employees.filter((e) => !e.reports_to || !empIds.has(e.reports_to));
      setExpandedIds(new Set(topLevel.map((e) => e.id)));
    } else {
      setExpandedIds(new Set());
    }
  }, [employees]);

  useEffect(() => {
    const t = buildTree(employees);
    const applyExpanded = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => {
        const forceExpand =
          (Boolean(searchTerm) || Boolean(deptFilter)) &&
          n.children.some((c) => subtreeMatchesFilters(c, searchTerm, deptFilter));
        return {
          ...n,
          expanded: expandedIds.has(n.id) || forceExpand,
          children: applyExpanded(n.children),
        };
      });
    setTree(applyExpanded(t));
  }, [employees, expandedIds, deptFilter, searchTerm]);

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    // Expand every node that has subordinates
    const parentIds = new Set<string>();
    employees.forEach((e) => {
      if (employees.some((sub) => sub.reports_to === e.id)) {
        parentIds.add(e.id);
      }
    });

    if (parentIds.size === 0) {
      toast(
        "Hierarchy Info",
        "All employee cards are already shown at top level. Assign managers in Directory List to build reporting teams.",
        "info"
      );
      return;
    }

    setExpandedIds(parentIds);
    toast("Organization Chart", `Expanded all ${parentIds.size} team${parentIds.size > 1 ? "s" : ""}.`, "success");
  }, [employees]);

  const collapseAll = useCallback(() => {
    if (!hasExpandableNodes) {
      toast(
        "Hierarchy Info",
        "No subordinate reporting branches to collapse. All employees are already at top level.",
        "info"
      );
      return;
    }

    setExpandedIds(new Set());
    toast("Organization Chart", "Collapsed all subordinate branches.", "success");
  }, [hasExpandableNodes]);

  return {
    tree,
    expandedIds,
    setExpandedIds,
    toggleNode,
    expandAll,
    collapseAll,
    hasExpandableNodes,
  };
}
