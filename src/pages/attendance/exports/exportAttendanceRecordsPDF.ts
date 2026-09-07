import type { AttendanceRecord } from "../types";
import { formatTime, calcHours } from "../constants";

export function exportAttendanceRecordsPDF(
  records: AttendanceRecord[],
  title = "Time & Attendance Records Report",
  isFourPunchMode: boolean = false
): boolean {
  const total = records.length;
  const ontimeCount = records.filter((r) => r.status === "ontime" || r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const remoteCount = records.filter((r) => r.status === "remote").length;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "ontime":
      case "present":
        return "background:#ecfdf5;color:#047857;border:1px solid #a7f3d0";
      case "late":
        return "background:#fffbeb;color:#b45309;border:1px solid #fde68a";
      case "absent":
        return "background:#fff1f2;color:#be123c;border:1px solid #fecdd3";
      case "remote":
        return "background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd";
      case "half_day":
        return "background:#fff7ed;color:#c2410c;border:1px solid #fed7aa";
      default:
        return "background:#f8fafc;color:#475569;border:1px solid #e2e8f0";
    }
  };

  const rows = records.length > 0
    ? records
        .map((r) => {
          const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Employee";
          const dept = r.employees?.department || "—";
          const location = r.work_location?.name || r.employees?.branches?.name || "Main Office";
          const status = (r.status || "present").replace(/_/g, " ").toUpperCase();
          const badgeStyle = getStatusBadgeStyle(r.status);
          const totalHours = r.hours_worked ? `${r.hours_worked}h` : calcHours(r.clock_in, r.clock_out);

          if (isFourPunchMode) {
            return `<tr>
              <td style="font-weight:700;color:#1e293b">${empName}</td>
              <td style="color:#64748b">${dept}</td>
              <td style="color:#64748b">${location}</td>
              <td style="font-weight:600;color:#334155">${r.date}</td>
              <td style="text-align:center">
                ${r.clock_in ? `<span style="display:inline-block;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;background:#fffbeb;color:#b45309;border:1px solid #fde68a">${formatTime(r.clock_in)}</span>` : `<span style="color:#cbd5e1">—</span>`}
              </td>
              <td style="text-align:center">
                ${r.break_out ? `<span style="display:inline-block;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa">${formatTime(r.break_out)}</span>` : `<span style="color:#cbd5e1">—</span>`}
              </td>
              <td style="text-align:center">
                ${r.break_in ? `<span style="display:inline-block;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe">${formatTime(r.break_in)}</span>` : `<span style="color:#cbd5e1">—</span>`}
              </td>
              <td style="text-align:center">
                ${r.clock_out ? `<span style="display:inline-block;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe">${formatTime(r.clock_out)}</span>` : `<span style="color:#cbd5e1">—</span>`}
              </td>
              <td style="text-align:center;font-weight:700;color:#1e293b">${totalHours}</td>
              <td style="text-align:center">
                <span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:9px;font-weight:800;letter-spacing:0.3px;${badgeStyle}">
                  ${status}
                </span>
              </td>
              <td style="font-size:10px;color:#64748b">${r.notes || "—"}</td>
            </tr>`;
          }

          return `<tr>
            <td style="font-weight:700;color:#1e293b">${empName}</td>
            <td style="color:#64748b">${dept}</td>
            <td style="color:#64748b">${location}</td>
            <td style="font-weight:600;color:#334155">${r.date}</td>
            <td style="font-weight:600;color:#0f172a">${formatTime(r.clock_in)}</td>
            <td style="font-weight:600;color:#0f172a">
              ${formatTime(r.clock_out)}
              ${r.early_leave_minutes ? `<span style="font-size:9px;color:#d97706;display:block">(${r.early_leave_minutes}m early)</span>` : ""}
            </td>
            <td style="text-align:center;font-weight:700;color:#1e293b">${totalHours}</td>
            <td style="text-align:center">
              <span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:9px;font-weight:800;letter-spacing:0.3px;${badgeStyle}">
                ${status}
              </span>
            </td>
            <td style="text-align:center">${r.late_minutes > 0 ? `<span style="color:#d97706;font-weight:700">${r.late_minutes}m</span>` : "—"}</td>
            <td style="font-size:10px;color:#64748b">${r.notes || "—"}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="${isFourPunchMode ? 11 : 10}" style="text-align:center;padding:24px;color:#64748b;">No attendance logs found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 18px; color: #1e293b; background: #fff; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 12px; margin-bottom: 16px; }
      h1 { font-size: 18px; font-weight: 800; color: #253C7D; margin: 0 0 3px 0; }
      .mode-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 9px; font-weight: 800; text-transform: uppercase; background: ${isFourPunchMode ? "#eef2ff" : "#f1f5f9"}; color: ${isFourPunchMode ? "#4338ca" : "#475569"}; border: 1px solid ${isFourPunchMode ? "#c7d2fe" : "#cbd5e1"}; margin-left: 6px; }
      .meta { font-size: 11px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; text-align: center; }
      .stat-val { font-size: 16px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
      th { text-align: left; padding: 7px 6px; background: #253C7D; color: #fff; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 6px 6px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) { background-color: #fafbfc; }
      .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — ${title} <span class="mode-badge">${isFourPunchMode ? "4-Punch Multi-Session" : "Standard 2-Punch"}</span></h1>
        <div class="meta">Workforce Operations &middot; Attendance Control Center</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Records:</strong> ${total} Entries</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Logs</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${ontimeCount}</div><div class="stat-lbl">On Time / Present</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${lateCount}</div><div class="stat-lbl">Late Check-Ins</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#2563eb">${remoteCount}</div><div class="stat-lbl">Remote Work</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Department</th>
          <th>Location</th>
          <th>Date</th>
          ${
            isFourPunchMode
              ? `<th style="text-align:center;background:#92400e">Morning In</th>
                 <th style="text-align:center;background:#c2410c">Lunch Out</th>
                 <th style="text-align:center;background:#3730a3">Lunch In</th>
                 <th style="text-align:center;background:#1e40af">Evening Out</th>`
              : `<th>Check In</th>
                 <th>Check Out</th>`
          }
          <th style="text-align:center">Hours</th>
          <th style="text-align:center">Status</th>
          ${!isFourPunchMode ? `<th style="text-align:center">Late</th>` : ""}
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Time & Attendance Hub</div>
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
