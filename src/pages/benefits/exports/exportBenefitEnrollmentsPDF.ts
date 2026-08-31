import type { Enrollment } from "../types";

export function exportBenefitEnrollmentsPDF(
  enrollments: Enrollment[],
  title = "Employee Benefit Enrollments & Coverage Register"
): boolean {
  const total = enrollments.length;
  const enrolledCount = enrollments.filter((e) => e.status === "enrolled").length;
  const optedOutCount = enrollments.filter((e) => e.status === "opted_out").length;

  const rows = enrollments.length > 0
    ? enrollments
        .map((e) => {
          const empName = e.employees ? `${e.employees.first_name} ${e.employees.last_name}` : "Employee";
          const dept = e.employees?.department || "—";
          const role = e.employees?.role || "—";
          const planName = e.benefit_plans?.name || "General Benefit";
          const provider = e.benefit_plans?.provider || "—";
          const statusStr = (e.status || "enrolled").toUpperCase();
          const dateStr = e.created_at ? new Date(e.created_at).toLocaleDateString() : "—";

          const statColor =
            e.status === "enrolled"
              ? "background:#d1fae5;color:#065f46"
              : "background:#fee2e2;color:#991b1b";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${empName}<br/><span style="font-size:10px;color:#64748b">${dept} &middot; ${role}</span></td>
            <td style="font-weight:600">${planName}<br/><span style="font-size:10px;color:#64748b">${provider}</span></td>
            <td>${dateStr}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${statusStr}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4" style="text-align:center;padding:24px;color:#64748b;">No enrollment records found.</td></tr>`;

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
        <div class="meta">Benefits Administration &middot; Employee Enrollment Roster</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Enrollments:</strong> ${total} Records</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Records</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${enrolledCount}</div><div class="stat-lbl">Active Enrollees</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#dc2626">${optedOutCount}</div><div class="stat-lbl">Opted Out</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee Details</th>
          <th>Assigned Benefit Plan</th>
          <th>Enrollment Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Benefits Administration</div>
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
