import type { ToolUsage, Tool } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportToolUsagesXLSX(
  usages: ToolUsage[],
  tools: Tool[]
): Promise<boolean> {
  const getToolName = (toolId: number) => {
    const t = tools.find((tool) => tool.id === toolId);
    return t ? t.name : `Tool #${toolId}`;
  };

  const data = usages.length > 0
    ? usages.map((u) => {
        const empName = u.employees ? `${u.employees.first_name} ${u.employees.last_name}` : "System User";
        const dept = u.employees?.department || "—";

        return {
          "Log ID": u.id,
          "Tool Name": getToolName(u.tool_id),
          Employee: empName,
          Department: dept,
          Action: u.action.toUpperCase(),
          "Executed At": u.created_at ? new Date(u.created_at).toLocaleString() : "—",
        };
      })
    : [{
        "Log ID": "—",
        "Tool Name": "No usage logs found",
        Employee: "—",
        Department: "—",
        Action: "—",
        "Executed At": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ToolActivity");
  XLSX.writeFile(wb, `tool_activity_audit_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
