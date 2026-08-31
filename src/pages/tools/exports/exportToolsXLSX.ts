import type { Tool, ToolAssignment, ToolUsage } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportToolsXLSX(
  tools: Tool[],
  assignments: ToolAssignment[],
  usages: ToolUsage[]
): Promise<boolean> {
  const data = tools.length > 0
    ? tools.map((t) => {
        const assignCount = assignments.filter((a) => a.tool_id === t.id && !a.revoked_at).length;
        const usageCount = usages.filter((u) => u.tool_id === t.id).length;
        return {
          "Tool ID": t.id,
          "Tool Name": t.name,
          Category: t.category,
          Description: t.description || "",
          Status: (t.status || "active").toUpperCase(),
          "Active Assignments": assignCount,
          "Total Usages": usageCount,
          "Created Date": t.created_at ? new Date(t.created_at).toLocaleDateString() : "—",
        };
      })
    : [{
        "Tool ID": "—",
        "Tool Name": "No tools found",
        Category: "—",
        Description: "—",
        Status: "—",
        "Active Assignments": 0,
        "Total Usages": 0,
        "Created Date": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ToolsCatalog");
  XLSX.writeFile(wb, `tools_catalog_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
