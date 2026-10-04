import type { ToolUsage, Tool } from "../types";

export function exportToolUsagesPDF(
  usages: ToolUsage[],
  tools: Tool[],
  title = "Internal Tools Live Activity & Usage Audit Log"
): boolean {
  const total = usages.length;

  const getToolName = (toolId: number) => {
    const t = tools.find((tool) => tool.id === toolId);
    return t ? t.name : `Tool #${toolId}`;
  };

  const rows = usages.length > 0
    ? usages
        .map((u) => {
          const empName = u.employees ? `${u.employees.first_name} ${u.employees.last_name}` : "System User";
          const dept = u.employees?.department || "General";
          const toolName = getToolName(u.tool_id);
          const dateStr = u.created_at ? new Date(u.created_at).toLocaleString("en-US") : "—";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${toolName}</td>
            <td style="font-weight:600">${empName}<br/><span style="font-size:10px;color:#64748b">${dept}</span></td>
            <td><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#f1f5f9;color:#334155">${u.action.toUpperCase()}</span></td>
            <td>${dateStr}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4" style="text-align:center;padding:24px;color:#64748b;">No usage records found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 portrait; margin: 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 14px; margin-bottom: 18px; }
      h1 { font-size: 20px; font-weight: 800; color: #253C7D; margin: 0 0 4px 0; }
      .meta { font-size: 11px; color: #64748b; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
      th { text-align: left; padding: 8px 8px; background: #253C7D; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — ${title}</h1>
        <div class="meta">Audit Log &middot; Tool Execution History</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Invocations:</strong> ${total} Logs</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Tool Name</th>
          <th>Employee Details</th>
          <th>Action / Operation</th>
          <th>Execution Timestamp</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Tool Activity Audit</div>
      <div>Page 1 of 1</div>
    </div>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  }
  return true;
}
