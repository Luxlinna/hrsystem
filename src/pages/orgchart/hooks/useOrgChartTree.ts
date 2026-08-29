import { useState, useEffect, useCallback } from "react";
import type { Employee, TreeNode } from "../types";
import { buildTree, subtreeMatchesFilters } from "../orgChartUtils";

export function useOrgChartTree(
  employees: Employee[],
  deptFilter: string,
  searchTerm: string
) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (employees.length > 0) {
      const empIds = new Set(employees.map((e) => e.id));
      const topLevel = employees.filter((e) => !e.reports_to || !empIds.has(e.reports_to));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        let added = false;
        for (const e of topLevel) {
          if (!next.has(e.id) && !next.has(`collapsed_${e.id}`)) {
            next.add(e.id);
            added = true;
          }
        }
        return added ? next : prev;
      });
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
          expanded:
            expandedIds.has(n.id) ||
            (n.depth < 1 && !expandedIds.has(`collapsed_${n.id}`)) ||
            forceExpand,
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
        next.add(`collapsed_${id}`);
      } else {
        next.add(id);
        next.delete(`collapsed_${id}`);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(employees.map((e) => e.id)));
  }, [employees]);

  const collapseAll = useCallback(() => {
    const topLevel = employees.filter((e) => !e.reports_to);
    setExpandedIds(new Set(topLevel.map((e) => e.id)));
  }, [employees]);

  return {
    tree,
    expandedIds,
    setExpandedIds,
    toggleNode,
    expandAll,
    collapseAll,
  };
}
