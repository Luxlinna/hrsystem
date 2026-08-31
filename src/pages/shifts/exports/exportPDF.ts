import type { Shift, ShiftAssignment } from "../types";
import { calculateHours } from "../utils";

export function exportShiftsPDF(
  filteredShifts: Shift[],
  assignments: ShiftAssignment[],
  title = "Workforce Shift Schedule Report"
): boolean {
  if (filteredShifts.length === 0) return false;

  const totalShifts = filteredShifts.length;
  let totalCapacity = 0;
  let totalAssigned = 0;
  let totalHours = 0;

  filteredShifts.forEach((s) => {
    totalCapacity += s.capacity || 0;
    totalAssigned += s.assignmentCount || 0;
    totalHours += calculateHours(s.start_time, s.end_time);
  });

  const coveragePct = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

  const rows = filteredShifts
    .map((s) => {
      const shiftStaff = assignments
        .filter((a) => a.shift_id === s.id)
        .map((a) => `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`.trim())
        .join(", ");
      const hours = calculateHours(s.start_time, s.end_time);
      const isFull = (s.assignmentCount || 0) >= (s.capacity || 1);

      return `<tr>
        <td style="font-weight:700;color:#111">${s.shift_date}</td>
        <td style="font-weight:600;color:#253C7D">${s.name}</td>
        <td>${s.start_time} - ${s.end_time} (${hours}h)</td>
        <td>${s.department || "—"}</td>
        <td>${s.branches?.name || "—"}</td>
        <td style="text-align:center">
          <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${
            isFull ? "background:#d1fae5;color:#065f46" : "background:#fef3c7;color:#92400e"
          }">
            ${s.assignmentCount || 0} / ${s.capacity}
          </span>
        </td>
        <td style="font-size:11px;color:#334155">${shiftStaff || "Unassigned"}</td>
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
        <div class="meta">Workforce Shift Planning &amp; Staffing Roster</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Scheduled Hours:</strong> ${totalHours} Hours</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${totalShifts}</div>
        <div class="stat-lbl">Total Shifts</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#059669">${totalAssigned} / ${totalCapacity}</div>
        <div class="stat-lbl">Assigned Spots</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#2563eb">${coveragePct}%</div>
        <div class="stat-lbl">Staffing Coverage</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#d97706">${totalHours}h</div>
        <div class="stat-lbl">Total Hours</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Shift Name</th>
          <th>Time &amp; Hours</th>
          <th>Department</th>
          <th>Branch</th>
          <th style="text-align:center">Roster Fill</th>
          <th>Assigned Employees</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Confidential Shift Schedule Record</div>
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
