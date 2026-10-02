import type { Tool, ToolAssignment, ToolUsage } from "../types";

export function exportToolsCSV(
  tools: Tool[],
  assignments: ToolAssignment[],
  usages: ToolUsage[]
): boolean {
  const headers = ["Tool Name", "Category", "Description", "Status", "Active Assignments", "Total Usages", "Created Date"];
  const rows = tools.map((t) => {
    const assignCount = assignments.filter((a) => a.tool_id === t.id && !a.revoked_at).length;
    const usageCount = usages.filter((u) => u.tool_id === t.id).length;
    return [
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      `"${t.status}"`,
      assignCount,
      usageCount,
      `"${t.created_at || ""}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `tools_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
