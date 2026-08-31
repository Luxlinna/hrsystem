import type { Offboarding } from "../types";

export function exportOffboardingsPDF(
  offboardings: Offboarding[],
  title = "Offboarding & Employee Departure Report"
): boolean {
  const total = offboardings.length;
  const inClearance = offboardings.filter((o) => o.status === "clearance" || o.status === "in_progress").length;
  const completed = offboardings.filter((o) => o.status === "completed").length;
  const initiated = offboardings.filter((o) => o.status === "initiated" || o.status === "pending").length;

  const rows = offboardings.length > 0
    ? offboardings
        .map((o) => {
          const empName = `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}`.trim() || "Employee";
          const dept = o.employees?.department || "—";
          const branch = o.employees?.branches?.name || "Main Branch";
          const role = o.employees?.role || "Staff";
          const tasks = o.tasks || [];
          const completedTasks = tasks.filter((t) => t.status === "completed").length;
          const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
          const status = (o.status || "initiated").replace(/_/g, " ").toUpperCase();
          const statusColor =
            o.status === "completed"
              ? "background:#d1fae5;color:#065f46"
              : o.status === "clearance" || o.status === "in_progress"
              ? "background:#e0f2fe;color:#0369a1"
              : "background:#fef3c7;color:#92400e";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${empName}<br/><span style="font-size:10px;color:#64748b">${role}</span></td>
            <td>${dept}</td>
            <td>${branch}</td>
            <td style="font-weight:600">${o.last_day || "—"}</td>
            <td>${o.reason || "Departure"}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statusColor}">
                ${status}
              </span>
            </td>
            <td style="font-weight:700;text-align:center">${completedTasks}/${tasks.length} (${progress}%)</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No offboarding records found.</td></tr>`;

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
        <div class="meta">Employee Lifecycle &middot; Offboarding &amp; Exit Management Log</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Records:</strong> ${total} Employees</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Departures</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${inClearance}</div><div class="stat-lbl">In Clearance</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${completed}</div><div class="stat-lbl">Completed Exits</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#f59e0b">${initiated}</div><div class="stat-lbl">Initiated / Pending</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Department</th>
          <th>Branch</th>
          <th>Last Working Day</th>
          <th>Departure Reason</th>
          <th>Status</th>
          <th style="text-align:center">Clearance Tasks</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Offboarding Operations</div>
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
