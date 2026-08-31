import type { ITTicket } from "../types";

export function exportITTicketsPDF(tickets: ITTicket[], title = "IT Helpdesk & Incident Tickets Report"): boolean {
  const total = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
  const criticalCount = tickets.filter((t) => t.priority === "critical" || t.priority === "high").length;

  const rows = tickets.length > 0
    ? tickets
        .map((t) => {
          const statusStr = (t.status || "open").replace(/_/g, " ").toUpperCase();
          const priorityStr = (t.priority || "medium").toUpperCase();
          const branchName = t.branches?.name || "General";
          const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString() : "—";

          const statColor =
            t.status === "resolved" || t.status === "closed"
              ? "background:#d1fae5;color:#065f46"
              : t.status === "in_progress"
              ? "background:#e0f2fe;color:#0369a1"
              : "background:#fef3c7;color:#92400e";

          const priColor =
            t.priority === "critical"
              ? "background:#fee2e2;color:#991b1b"
              : t.priority === "high"
              ? "background:#ffedd5;color:#9a3412"
              : t.priority === "medium"
              ? "background:#fef3c7;color:#92400e"
              : "background:#f1f5f9;color:#475569";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${t.title}<br/><span style="font-size:10px;color:#64748b">${t.category}</span></td>
            <td style="font-weight:600">${t.requester_name}</td>
            <td>${branchName}</td>
            <td>${dateStr}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${priColor}">
                ${priorityStr}
              </span>
            </td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${statusStr}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No support tickets found.</td></tr>`;

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
        <div class="meta">Helpdesk &middot; IT Support Tickets &amp; Service Incidents</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Tickets:</strong> ${total} Cases</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Logged</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${openCount}</div><div class="stat-lbl">Open Tickets</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#dc2626">${criticalCount}</div><div class="stat-lbl">Critical / High Priority</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${resolvedCount}</div><div class="stat-lbl">Resolved / Closed</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Ticket Title &amp; Category</th>
          <th>Requester</th>
          <th>Branch</th>
          <th>Created Date</th>
          <th>Priority</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; IT Support Operations</div>
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
