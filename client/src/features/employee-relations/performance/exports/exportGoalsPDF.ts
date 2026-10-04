import type { Goal, Employee } from "../types";

export function exportGoalsPDF(goals: Goal[], employees: Employee[], title = "Employee Goals & OKR Tracking"): boolean {
  const employeeMap = new Map<string, Employee>();
  employees.forEach((e) => employeeMap.set(e.id, e));

  const total = goals.length;
  const completedCount = goals.filter((g) => g.status === "completed" || g.progress >= 100).length;
  const onTrackCount = goals.filter((g) => g.status === "on_track" || (g.progress > 0 && g.progress < 100)).length;
  const avgProgress = total > 0 ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / total) : 0;

  const rows = goals.length > 0
    ? goals
        .map((g) => {
          const emp = employeeMap.get(g.employee_id);
          const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Team Member";
          const dept = emp?.department || "—";
          const status = (g.status || "in_progress").replace(/_/g, " ").toUpperCase();
          const statusColor =
            g.progress >= 100 || g.status === "completed"
              ? "background:#d1fae5;color:#065f46"
              : g.status === "on_track"
              ? "background:#e0f2fe;color:#0369a1"
              : "background:#fef3c7;color:#92400e";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${g.title}<br/><span style="font-size:10px;color:#64748b;font-weight:400">${g.description || ""}</span></td>
            <td>${empName}</td>
            <td>${dept}</td>
            <td style="font-weight:600">${g.target_date || "—"}</td>
            <td style="text-align:center;font-weight:700">${g.progress || 0}%</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statusColor}">
                ${status}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No employee goals found.</td></tr>`;

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
        <div class="meta">Talent Development &middot; Objectives &amp; Key Results (OKR) Tracker</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Objectives:</strong> ${total} Goals</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Goals</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${completedCount}</div><div class="stat-lbl">Completed (100%)</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${onTrackCount}</div><div class="stat-lbl">In Progress / On Track</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#2563eb">${avgProgress}%</div><div class="stat-lbl">Average Completion</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Goal Title &amp; Description</th>
          <th>Assigned Employee</th>
          <th>Department</th>
          <th>Target Date</th>
          <th style="text-align:center">Progress</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Goals Management</div>
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
