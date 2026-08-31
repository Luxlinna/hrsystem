import type { Employee, AttendanceRecord } from "../types";

export function exportSelfAttendancePDF(
  records: AttendanceRecord[],
  employee: Employee | null,
  title = "My Attendance & Clock-In/Out History"
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const dept = employee?.department || "General";
  const total = records.length;
  const totalHours = records.reduce((acc, r) => acc + (Number(r.hours_worked) || 0), 0);
  const lateCount = records.filter((r) => r.status === "late" || (r.late_minutes && r.late_minutes > 0)).length;

  const rows = records.length > 0
    ? records
        .map((r) => {
          const dateStr = r.date ? new Date(r.date).toLocaleDateString() : "—";
          const clockIn = r.clock_in ? new Date(`2000-01-01T${r.clock_in}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";
          const clockOut = r.clock_out ? new Date(`2000-01-01T${r.clock_out}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";
          const hours = r.hours_worked != null ? `${Number(r.hours_worked).toFixed(1)} hrs` : "—";
          const statColor =
            r.status === "ontime" || r.status === "present"
              ? "background:#d1fae5;color:#065f46"
              : r.status === "late"
              ? "background:#fef3c7;color:#92400e"
              : r.status === "absent"
              ? "background:#fee2e2;color:#991b1b"
              : "background:#e0f2fe;color:#0369a1";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${dateStr}</td>
            <td>${clockIn}</td>
            <td>${clockOut}</td>
            <td style="text-align:center;font-weight:700">${hours}</td>
            <td style="text-align:center;color:#b45309">${r.late_minutes ? `${r.late_minutes}m` : "—"}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${(r.status || "present").toUpperCase()}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No attendance records found.</td></tr>`;

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
        <div><strong>Total Logs:</strong> ${total} Days</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Logged Days</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${totalHours.toFixed(1)} hrs</div><div class="stat-lbl">Total Hours Worked</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#b45309">${lateCount}</div><div class="stat-lbl">Late Arrivals</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Clock In</th>
          <th>Clock Out</th>
          <th style="text-align:center">Hours Worked</th>
          <th style="text-align:center">Late Mins</th>
          <th>Status</th>
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
