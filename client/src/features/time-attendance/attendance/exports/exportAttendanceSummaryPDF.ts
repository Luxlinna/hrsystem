import type { EmployeeSummaryItem } from "../types";
import { formatBiometricId } from "@/lib/biometricUtils";

export function exportAttendanceSummaryPDF(
  summaries: EmployeeSummaryItem[],
  title = "Workforce Attendance Summary & Scorecard"
): boolean {
  const total = summaries.length;
  const avgRate = total > 0 ? Math.round(summaries.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / total) : 0;
  const totalHours = summaries.reduce((acc, s) => acc + (s.totalHours || 0), 0);

  const rows = summaries.length > 0
    ? summaries
        .map((s, idx) => {
          const empName = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Employee";
          const rawBio = s.biometric_user_id || s.employee_code;
          const bName = Array.isArray(s.branches) ? s.branches[0]?.name : (s.branches?.name || s.site || "");
          const bioId = formatBiometricId(rawBio, bName);
          const dept = s.department || "—";
          const role = s.position || s.role || "Staff";

          const rateColor =
            s.attendanceRate >= 90
              ? "color:#15803d;font-weight:700"
              : s.attendanceRate >= 75
              ? "color:#b45309;font-weight:700"
              : "color:#b91c1c;font-weight:700";

          return `<tr>
            <td style="text-align:center;color:#64748b;font-size:8px">${idx + 1}</td>
            <td style="font-size:8px">
              <div style="font-weight:600;color:#0f172a">${empName}</div>
              ${bioId ? `<div style="font-size:7px;font-family:monospace;color:#475569">${bioId}</div>` : ""}
            </td>
            <td style="font-size:8px;color:#1e293b">${dept}</td>
            <td style="font-size:8px;color:#334155">${role}</td>
            <td style="text-align:center;font-weight:600;font-size:8px">${s.present || 0}</td>
            <td style="text-align:center;color:#b45309;font-weight:600;font-size:8px">${s.late || 0}</td>
            <td style="text-align:center;color:#b91c1c;font-weight:600;font-size:8px">${s.absent || 0}</td>
            <td style="text-align:center;color:#0369a1;font-weight:600;font-size:8px">${s.remote || 0}</td>
            <td style="text-align:center;font-weight:700;color:#0f172a;font-size:8px">${Number(s.totalHours || 0).toFixed(1)} hrs</td>
            <td style="text-align:center;font-size:8px;${rateColor}">${Math.round(s.attendanceRate || 0)}%</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="10" style="text-align:center;padding:16px;color:#64748b;">No employee summaries found.</td></tr>`;

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
        <div class="meta">Workforce Management &middot; Timesheet &amp; Attendance Scorecard</div>
      </div>
      <div class="meta-right">
        <div><strong>Print Date:</strong> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
        <div><strong>Audited:</strong> ${total} Employees &nbsp;|&nbsp; <strong>Avg Rate:</strong> ${avgRate}% &nbsp;|&nbsp; <strong>Logged Hours:</strong> ${totalHours.toFixed(1)} hrs</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:24px;text-align:center">No.</th>
          <th>Employee Name</th>
          <th>Department</th>
          <th>Position</th>
          <th style="text-align:center">Present</th>
          <th style="text-align:center">Late</th>
          <th style="text-align:center">Absent</th>
          <th style="text-align:center">Remote</th>
          <th style="text-align:center">Hours</th>
          <th style="text-align:center">Rate</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Attendance Scorecard</div>
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
