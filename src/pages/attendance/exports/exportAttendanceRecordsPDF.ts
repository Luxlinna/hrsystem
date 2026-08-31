import type { AttendanceRecord } from "../types";

export function exportAttendanceRecordsPDF(
  records: AttendanceRecord[],
  title = "Time & Attendance Records Report"
): boolean {
  const total = records.length;
  const ontimeCount = records.filter((r) => r.status === "ontime" || r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const remoteCount = records.filter((r) => r.status === "remote").length;

  const rows = records.length > 0
    ? records
        .map((r) => {
          const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Employee";
          const dept = r.employees?.department || "—";
          const location = r.work_location?.name || r.employees?.branches?.name || "Main Office";
          const status = (r.status || "present").replace(/_/g, " ").toUpperCase();
          const statusColor =
            r.status === "ontime" || r.status === "present"
              ? "background:#d1fae5;color:#065f46"
              : r.status === "late"
              ? "background:#fef3c7;color:#92400e"
              : r.status === "absent"
              ? "background:#fee2e2;color:#991b1b"
              : "background:#e0f2fe;color:#0369a1";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${empName}</td>
            <td>${dept}</td>
            <td>${location}</td>
            <td style="font-weight:600">${r.date}</td>
            <td>${r.clock_in || "—"}</td>
            <td>${r.clock_out || "—"}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statusColor}">
                ${status}
              </span>
            </td>
            <td style="text-align:center">${r.late_minutes > 0 ? `${r.late_minutes}m` : "—"}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" style="text-align:center;padding:24px;color:#64748b;">No attendance logs found.</td></tr>`;

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
        <div class="meta">Workforce Operations &middot; Attendance Records Log</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Records:</strong> ${total} Entries</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Logs</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${ontimeCount}</div><div class="stat-lbl">Present / On Time</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${lateCount}</div><div class="stat-lbl">Late Check-Ins</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#2563eb">${remoteCount}</div><div class="stat-lbl">Remote Work</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Department</th>
          <th>Location / Branch</th>
          <th>Date</th>
          <th>Clock In</th>
          <th>Clock Out</th>
          <th>Status</th>
          <th style="text-align:center">Late Duration</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Attendance Directory</div>
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
