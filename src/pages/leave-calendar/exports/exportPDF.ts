import type { LeaveRequest } from "../types";
import { LEAVE_TYPE_CONFIG, MONTHS } from "../constants";

export function exportCalendarPDF(
  filteredLeaves: LeaveRequest[],
  month: number,
  year: number
): boolean {
  if (filteredLeaves.length === 0) return false;

  const monthName = MONTHS[month];
  const title = `Leave Schedule — ${monthName} ${year}`;
  const total = filteredLeaves.length;
  const approved = filteredLeaves.filter((r) => r.status === "approved").length;
  const pending = filteredLeaves.filter((r) => r.status === "pending").length;
  const totalDays = filteredLeaves.reduce((acc, r) => acc + (Number(r.days) || 0), 0);

  const rows = filteredLeaves
    .map((r) => {
      const name = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Unknown";
      const dept = r.employees?.department || "—";
      const leaveType = LEAVE_TYPE_CONFIG[r.leave_type]?.label || r.leave_type;
      const statusColor =
        r.status === "approved"
          ? "background:#d1fae5;color:#065f46"
          : r.status === "pending"
          ? "background:#fef3c7;color:#92400e"
          : "background:#fee2e2;color:#991b1b";

      return `<tr>
        <td style="font-weight:700;color:#111">${name}</td>
        <td>${dept}</td>
        <td><span style="font-weight:600;color:#253C7D">${leaveType}</span></td>
        <td>${r.start_date} &rarr; ${r.end_date}</td>
        <td style="text-align:center;font-weight:700">${r.days}d</td>
        <td>
          <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statusColor}">
            ${(r.status || "").toUpperCase()}
          </span>
        </td>
        <td style="font-size:11px;color:#64748b">${r.reason || "—"}</td>
      </tr>`;
    })
    .join("");

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
        <div class="meta">Team Availability &amp; Absence Schedule Calendar</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Scheduled Absence:</strong> ${totalDays} Days</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${total}</div>
        <div class="stat-lbl">Scheduled Events</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#059669">${approved}</div>
        <div class="stat-lbl">Approved Leaves</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#d97706">${pending}</div>
        <div class="stat-lbl">Pending Review</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Department</th>
          <th>Leave Type</th>
          <th>Period</th>
          <th style="text-align:center">Days</th>
          <th>Status</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Confidential Leave Calendar Schedule</div>
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
