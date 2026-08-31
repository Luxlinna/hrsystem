import type { EmployeeSummaryItem } from "../types";

export function exportAttendanceSummaryPDF(
  summaries: EmployeeSummaryItem[],
  title = "Workforce Attendance Summary & Scorecard"
): boolean {
  const total = summaries.length;
  const avgRate = total > 0 ? Math.round(summaries.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / total) : 0;
  const totalHours = summaries.reduce((acc, s) => acc + (s.totalHours || 0), 0);

  const rows = summaries.length > 0
    ? summaries
        .map((s) => {
          const empName = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Employee";
          const dept = s.department || "—";
          const role = s.role || "Staff";
          const rateColor =
            s.attendanceRate >= 90
              ? "color:#059669;font-weight:700"
              : s.attendanceRate >= 75
              ? "color:#d97706;font-weight:700"
              : "color:#dc2626;font-weight:700";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${empName}<br/><span style="font-size:10px;color:#64748b">${role}</span></td>
            <td>${dept}</td>
            <td style="text-align:center;font-weight:600">${s.present || 0}</td>
            <td style="text-align:center;color:#d97706;font-weight:600">${s.late || 0}</td>
            <td style="text-align:center;color:#dc2626;font-weight:600">${s.absent || 0}</td>
            <td style="text-align:center;color:#0284c7;font-weight:600">${s.remote || 0}</td>
            <td style="text-align:center;font-weight:700">${Number(s.totalHours || 0).toFixed(1)} hrs</td>
            <td style="text-align:center;${rateColor}">${Math.round(s.attendanceRate || 0)}%</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" style="text-align:center;padding:24px;color:#64748b;">No employee summaries found.</td></tr>`;

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
        <div class="meta">Workforce Management &middot; Timesheet &amp; Attendance Scorecard</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Employees Audited:</strong> ${total} Members</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Active Workforce</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${avgRate}%</div><div class="stat-lbl">Average Attendance Rate</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#2563eb">${totalHours.toFixed(1)} hrs</div><div class="stat-lbl">Cumulative Logged Hours</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Department</th>
          <th style="text-align:center">Present Days</th>
          <th style="text-align:center">Late Days</th>
          <th style="text-align:center">Absent Days</th>
          <th style="text-align:center">Remote Days</th>
          <th style="text-align:center">Total Hours</th>
          <th style="text-align:center">Attendance Rate</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Attendance Scorecard</div>
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
