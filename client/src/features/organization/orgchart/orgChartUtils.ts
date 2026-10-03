import type { Employee, TreeNode } from "./types";

export function buildTree(
  employees: Employee[],
  parentId: string | null = null,
  depth = 0,
  visited: Set<string> = new Set()
): TreeNode[] {
  const empIds = new Set(employees.map((e) => e.id));

  // If top level (parentId === null), include employees with no reports_to OR whose manager is not in this employee list
  const matchesParent = (e: Employee) => {
    if (parentId === null) {
      return !e.reports_to || !empIds.has(e.reports_to);
    }
    return e.reports_to === parentId;
  };

  return employees
    .filter((e) => matchesParent(e) && !visited.has(e.id))
    .map((e) => ({
      ...e,
      children: buildTree(employees, e.id, depth + 1, new Set(visited).add(e.id)),
      depth,
      expanded: depth < 2,
    }));
}

export function nodeMatchesFilters(
  n: TreeNode,
  searchTerm: string,
  deptFilter: string
): boolean {
  const deptOk = !deptFilter || n.department === deptFilter;
  const searchOk =
    !searchTerm ||
    `${n.first_name} ${n.last_name} ${n.role} ${n.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  return deptOk && searchOk;
}

export function subtreeMatchesFilters(
  n: TreeNode,
  searchTerm: string,
  deptFilter: string
): boolean {
  return (
    nodeMatchesFilters(n, searchTerm, deptFilter) ||
    n.children.some((c) => subtreeMatchesFilters(c, searchTerm, deptFilter))
  );
}

export function getDescendantIds(
  id: string,
  employees: Employee[]
): Set<string> {
  const ids = new Set<string>();
  const walk = (managerId: string) => {
    const directReports = employees.filter((e) => e.reports_to === managerId);
    for (const e of directReports) {
      if (!ids.has(e.id)) {
        ids.add(e.id);
        walk(e.id);
      }
    }
  };
  walk(id);
  return ids;
}
