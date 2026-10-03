import type { Employee, OutsideWorkTask } from "../types";

export function exportSelfWorkOutsidePDF(
  tasks: OutsideWorkTask[],
  employee: Employee | null,
  title = "My Outside Work & Fieldwork History"
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const dept = employee?.department || "General";
  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.work_status === "checked_out").length;

  const rows = tasks.length > 0
    ? tasks
        .map((t) => {
          const inTime = t.work_checked_in_at ? new Date(t.work_checked_in_at).toLocaleString("en-US") : "—";
          const outTime = t.work_checked_out_at ? new Date(t.work_checked_out_at).toLocaleString("en-US") : "—";
          const statusStr = (t.work_status || "pending").toUpperCase();
          const statColor =
            t.work_status === "checked_out"
              ? "background:#d1fae5;color:#065f46"
              : t.work_status === "checked_in"
              ? "background:#e0f2fe;color:#0369a1"
              : "background:#fef3c7;color:#92400e";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${t.title}</td>
            <td style="font-size:10px">${t.work_address || "Client Location"}</td>
            <td>${inTime}</td>
            <td>${outTime}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${statusStr}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b;">No outside work tasks found.</td></tr>`;

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
      .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
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
        <div class="meta">Employee: <strong>${empName}</strong> &middot; Department: <strong>${dept}</strong></div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Tasks:</strong> ${total} Field Assignments</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Field Tasks Logged</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${completedCount}</div><div class="stat-lbl">Completed Fieldwork</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">${employee?.role || "Staff"}</div><div class="stat-lbl">Staff Role</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Task Title</th>
          <th>Work Location / Address</th>
          <th>Check-In Timestamp</th>
          <th>Check-Out Timestamp</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Fieldwork &amp; Outside Check-In</div>
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
