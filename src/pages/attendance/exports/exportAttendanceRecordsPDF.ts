import type { AttendanceRecord } from "../types";
import type { ManagedShift } from "../components/shifts-manager/types";
import { mapRecordToExportRow } from "./attendanceExportRowData";

export function exportAttendanceRecordsPDF(
  records: AttendanceRecord[],
  title = "Time & Attendance Records Report",
  isFourPunchMode: boolean = false,
  shifts: ManagedShift[] = []
): boolean {
  const total = records.length;
  const ontimeCount = records.filter((r) => r.status === "ontime" || r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late" || (r.late_minutes && r.late_minutes > 0)).length;
  const remoteCount = records.filter((r) => r.status === "remote").length;

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("holiday")) return "background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe";
    if (s.includes("error")) return "background:#fff1f2;color:#be123c;border:1px solid #fecdd3";
    if (s.includes("working now")) return "background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe";
    if (s.includes("late")) return "background:#fffbeb;color:#b45309;border:1px solid #fde68a";
    if (s.includes("remote")) return "background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4";
    return "background:#ecfdf5;color:#047857;border:1px solid #a7f3d0";
  };

  const rowsHtml = records.length > 0
    ? records.map((r, idx) => {
        const row = mapRecordToExportRow(r, idx, shifts);
        const badgeStyle = getStatusBadgeStyle(row.status);
        const punchCell = isFourPunchMode
          ? `<div style="font-size:8.5px;color:#334155">${row.clockIn} - ${row.breakOut}</div><div style="font-size:8.5px;color:#334155">${row.breakIn} - ${row.clockOut}</div>`
          : `<span style="font-weight:600;color:#0f172a">${row.clockIn} - ${row.clockOut}</span>`;

        return `<tr>
          <td style="text-align:center;color:#64748b;font-weight:700">${row.no}</td>
          <td style="white-space:nowrap;font-weight:600;color:#1e293b">${row.dateStr}<br/><span style="font-size:8.5px;color:#64748b">${row.dayOfWeek}</span></td>
          <td style="font-weight:700;color:#1e293b">${row.employeeName}<br/><span style="font-size:8.5px;font-family:monospace;color:#253C7D;background:#eef2ff;padding:1px 4px;border-radius:3px">${row.biometricId}</span></td>
          <td style="color:#475569">${row.designation}</td>
          <td style="white-space:nowrap"><span style="font-weight:700;font-size:9px;color:#1e293b">${row.department}</span><br/><span style="font-size:8.5px;color:#64748b">${row.location}</span></td>
          <td style="white-space:nowrap"><span style="font-weight:600;font-size:9px;color:#334155">${row.scheduleTitle}</span><br/><span style="font-size:8.5px;color:#64748b">${row.scheduledHours}</span></td>
          <td style="text-align:center">${punchCell}</td>
          <td style="text-align:center;font-weight:700;color:#047857">${row.workedHours}</td>
          <td style="text-align:center"><span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:8.5px;font-weight:800;${badgeStyle}">${row.status}</span></td>
          <td style="text-align:right;font-weight:700;color:#253C7D;font-family:monospace">${row.salary}</td>
          <td style="font-size:8.5px;color:#64748b">${row.notes}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="11" style="text-align:center;padding:24px;color:#64748b;">No attendance logs found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 14px; color: #1e293b; background: #fff; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 10px; margin-bottom: 12px; }
      h1 { font-size: 17px; font-weight: 800; color: #253C7D; margin: 0 0 2px 0; }
      .mode-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; background: #eef2ff; color: #253C7D; border: 1px solid #c7d2fe; margin-left: 6px; }
      .meta { font-size: 10px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px; text-align: center; }
      .stat-val { font-size: 15px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 1px; }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9.5px; }
      th { text-align: left; padding: 6px 5px; background: #253C7D; color: #fff; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
      td { padding: 5px 5px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) { background-color: #fafbfc; }
      .footer { margin-top: 16px; font-size: 8.5px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; }
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
        <div><strong>Total Logs:</strong> ${total} Entries</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Logs</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${ontimeCount}</div><div class="stat-lbl">On Time / Present</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${lateCount}</div><div class="stat-lbl">Late Arrivals</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#2563eb">${remoteCount}</div><div class="stat-lbl">Remote Work</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:25px;text-align:center">No.</th>
          <th>Date</th>
          <th>Employee</th>
          <th>Designation</th>
          <th>Department</th>
          <th>Schedules</th>
          <th style="text-align:center">Clock In-Out</th>
          <th style="text-align:center">Hours</th>
          <th style="text-align:center">Status</th>
          <th style="text-align:right">Salary</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
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
