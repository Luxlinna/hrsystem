import type { Employee, WorkLog } from "../types";

export function exportSelfDailyReportsPDF(
  logs: WorkLog[],
  employee: Employee | null,
  title = "My Daily Work Reports & Activities"
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const dept = employee?.department || "General";
  const total = logs.length;

  const rows = logs.length > 0
    ? logs
        .map((l) => {
          const dateStr = l.log_date ? new Date(l.log_date).toLocaleDateString() : "—";
          const timeRange = l.start_time && l.end_time ? `${l.start_time} - ${l.end_time}` : "Full Day";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${dateStr}</td>
            <td style="font-weight:600">${timeRange}</td>
            <td style="font-weight:600">${l.activity || "—"}</td>
            <td style="font-size:10px">${l.notes || "—"}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4" style="text-align:center;padding:24px;color:#64748b;">No daily reports found.</td></tr>`;

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
        <div><strong>Total Submissions:</strong> ${total} Logs</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Daily Logs Submitted</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${dept}</div><div class="stat-lbl">Assigned Department</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">${employee?.role || "Staff"}</div><div class="stat-lbl">Position</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time Window</th>
          <th>Completed Activity / Deliverables</th>
          <th>Notes &amp; Details</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Employee Self-Service</div>
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
