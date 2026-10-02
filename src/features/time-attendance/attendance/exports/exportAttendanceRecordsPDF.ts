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
  const ontimeCount = records.filter((r) => !r.status || r.status === "ontime" || r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late" || (r.late_minutes && r.late_minutes > 0)).length;
  const earlyCount = records.filter((r) => r.early_leave_minutes && r.early_leave_minutes > 0).length;
  const errorCount = records.filter((r) => !r.clock_in || (!r.clock_out && r.date < new Date().toISOString().slice(0, 10))).length;

  const renderStatusBadge = (status: string) => {
    if (!status) return `<span style="color:#94a3b8;font-size:7.5px">—</span>`;
    const s = status.toLowerCase();
    let style = "background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;";
    if (s.includes("holiday")) style = "background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;";
    else if (s.includes("error")) style = "background:#fff1f2;color:#be123c;border:1px solid #fecdd3;";
    else if (s.includes("working now")) style = "background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;";
    else if (s.includes("late")) style = "background:#fffbeb;color:#b45309;border:1px solid #fde68a;";
    else if (s.includes("early")) style = "background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;";
    else if (s.includes("remote")) style = "background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4;";

    return `<span style="display:inline-block;padding:1.5px 5px;border-radius:3px;font-size:7.5px;font-weight:700;${style}">${status}</span>`;
  };

  const rowsHtml = records.length > 0
    ? records.map((r, idx) => {
        const row = mapRecordToExportRow(r, idx, shifts);
        const punchCell = isFourPunchMode
          ? `<div style="font-size:7.5px;color:#334155">${row.clockIn} - ${row.breakOut}</div><div style="font-size:7.5px;color:#334155">${row.breakIn} - ${row.clockOut}</div>`
          : `<span style="font-weight:600;color:#0f172a;font-size:8px">${row.clockIn} - ${row.clockOut}</span>`;

        return `<tr>
          <td style="text-align:center;color:#64748b;font-size:8px">${row.no}</td>
          <td style="white-space:nowrap;font-size:8px">
            <div style="font-weight:600;color:#0f172a">${row.dateStr}</div>
            <div style="font-size:7px;color:#64748b">${row.dayOfWeek}</div>
          </td>
          <td style="font-size:8px">
            <div style="font-weight:600;color:#0f172a">${row.employeeName}</div>
            <div style="font-size:7px;font-family:monospace;color:#475569">${row.biometricId}</div>
          </td>
          <td style="font-size:8px;color:#334155">${row.position}</td>
          <td style="white-space:nowrap;font-size:8px">
            <div style="font-weight:600;color:#1e293b">${row.department}</div>
            <div style="font-size:7px;color:#64748b">${row.location}</div>
          </td>
          <td style="white-space:nowrap;font-size:8px">
            <div style="color:#334155">${row.scheduleTitle}</div>
            <div style="font-size:7px;color:#64748b">${row.scheduledHours}</div>
          </td>
          <td style="text-align:center;font-size:8px">${punchCell}</td>
          <td style="text-align:center;font-weight:600;color:#047857;font-size:8px">${row.workedHours}</td>
          <td style="text-align:center">${renderStatusBadge(row.status)}</td>
          <td style="font-size:7.5px;color:#64748b;max-width:120px">${row.notes}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="10" style="text-align:center;padding:16px;color:#64748b;">No attendance logs found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin: 0; padding: 0; color: #0f172a; background: #fff; font-size: 8.5px; line-height: 1.35;
      }
      .header-box {
        display: flex; justify-content: space-between; align-items: flex-end;
        border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;
      }
      h1 { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.2px; text-transform: uppercase; }
      .meta { font-size: 8px; color: #475569; }
      .meta-right { text-align: right; font-size: 8px; color: #475569; }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 8px; }
      th {
        text-align: left; padding: 5px 4px; background: #f1f5f9; color: #0f172a;
        font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
        border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a;
      }
      td { padding: 4px 4px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
      tr:nth-child(even) { background-color: #fafbfc; }
      .footer { margin-top: 12px; font-size: 7.5px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — ${title}</h1>
        <div class="meta">Workforce Operations &middot; Time &amp; Attendance Report &middot; ${isFourPunchMode ? "4-Punch Multi-Session" : "Standard 2-Punch"}</div>
      </div>
      <div class="meta-right">
        <div><strong>Print Date:</strong> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
        <div><strong>Total Logs:</strong> ${total} &nbsp;|&nbsp; <strong>On Time:</strong> ${ontimeCount} &nbsp;|&nbsp; <strong>Late:</strong> ${lateCount}${earlyCount ? ` &nbsp;|&nbsp; <strong>Early:</strong> ${earlyCount}` : ""}${errorCount ? ` &nbsp;|&nbsp; <strong>Exceptions:</strong> ${errorCount}` : ""}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:24px;text-align:center">No.</th>
          <th>Date</th>
          <th>Employee</th>
          <th>Position</th>
          <th>Department &amp; Site</th>
          <th>Schedules</th>
          <th style="text-align:center">Clock In - Out</th>
          <th style="text-align:center">Hours</th>
          <th style="text-align:center">Status</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Time &amp; Attendance Report</div>
      <div>Confidential &middot; Internal Operational Use Only</div>
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
