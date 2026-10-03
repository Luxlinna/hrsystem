import type { ToolUsage, Tool } from "../types";

export function exportToolUsagesCSV(
  usages: ToolUsage[],
  tools: Tool[]
): boolean {
  const getToolName = (toolId: number) => {
    const t = tools.find((tool) => tool.id === toolId);
    return t ? t.name : `Tool #${toolId}`;
  };

  const headers = ["Tool Name", "Employee", "Department", "Action", "Executed At"];
  const rows = usages.map((u) => [
    `"${getToolName(u.tool_id).replace(/"/g, '""')}"`,
    `"${u.employees ? `${u.employees.first_name} ${u.employees.last_name}` : ""}"`,
    `"${u.employees?.department || ""}"`,
    `"${u.action}"`,
    `"${u.created_at || ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `tool_activity_audit_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
