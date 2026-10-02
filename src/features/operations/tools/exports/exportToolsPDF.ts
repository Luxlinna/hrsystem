import type { Tool, ToolAssignment, ToolUsage } from "../types";

export function exportToolsPDF(
  tools: Tool[],
  assignments: ToolAssignment[],
  usages: ToolUsage[],
  title = "Internal Workforce Tools Catalog & Inventory"
): boolean {
  const total = tools.length;
  const activeCount = tools.filter((t) => t.status === "active").length;
  const totalAssignments = assignments.filter((a) => !a.revoked_at).length;
  const totalUsages = usages.length;

  const rows = tools.length > 0
    ? tools
        .map((t) => {
          const assignCount = assignments.filter((a) => a.tool_id === t.id && !a.revoked_at).length;
          const usageCount = usages.filter((u) => u.tool_id === t.id).length;
          const statusStr = (t.status || "active").toUpperCase();
          const statColor =
            t.status === "active"
              ? "background:#d1fae5;color:#065f46"
              : "background:#f1f5f9;color:#475569";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${t.name}</td>
            <td><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#eff6ff;color:#1d4ed8">${t.category}</span></td>
            <td style="font-size:10px">${t.description || "—"}</td>
            <td style="text-align:center;font-weight:700">${assignCount}</td>
            <td style="text-align:center;font-weight:700;color:#253C7D">${usageCount}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${statusStr}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No tools found in catalog.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 14px; margin-bottom: 18px; }
      h1 { font-size: 20px; font-weight: 800; color: #253C7D; margin: 0 0 4px 0; }
      .meta { font-size: 11px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; text-align: center; }
      .stat-val { font-size: 18px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
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
        <div class="meta">Workforce Infrastructure &middot; Tool Registry &amp; Permissions</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Tools:</strong> ${total} Applications</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Registered Tools</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${activeCount}</div><div class="stat-lbl">Active &amp; Available</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${totalAssignments}</div><div class="stat-lbl">Active Permissions</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">${totalUsages}</div><div class="stat-lbl">Total Usages</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Tool Name</th>
          <th>Category</th>
          <th>Description</th>
          <th style="text-align:center">Assigned Users</th>
          <th style="text-align:center">Invocations</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; System Tools &amp; Permissions</div>
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
