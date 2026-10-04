import type { PayrollRecord } from "../types";

export function exportPayrollPDF(
  records: PayrollRecord[],
  periodLabel = "Current Payroll Period",
  title = "Comprehensive Payroll & Compensation Summary"
): boolean {
  const total = records.length;
  const totalBase = records.reduce((acc, r) => acc + Number(r.base_salary || 0), 0);
  const totalBonus = records.reduce((acc, r) => acc + Number(r.bonus || 0), 0);
  const totalDeductions = records.reduce((acc, r) => acc + Number(r.deductions || 0), 0);
  const totalNet = records.reduce((acc, r) => acc + Number(r.net_pay || 0), 0);

  const rows = records.length > 0
    ? records
        .map((r) => {
          const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown Employee";
          const dept = r.employees?.department || "—";
          const role = r.employees?.role || "—";
          const gross = Number(r.base_salary || 0) + Number(r.bonus || 0);
          const status = (r.status || "pending").toUpperCase();
          const statusColor =
            r.status === "paid"
              ? "background:#d1fae5;color:#065f46"
              : r.status === "processed"
              ? "background:#e0f2fe;color:#0369a1"
              : "background:#fef3c7;color:#92400e";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${empName}<br/><span style="font-size:10px;color:#64748b">${dept} &middot; ${role}</span></td>
            <td style="text-align:center">${r.month}</td>
            <td style="text-align:right">$${Number(r.base_salary || 0).toLocaleString()}</td>
            <td style="text-align:right;color:#059669">+$${Number(r.bonus || 0).toLocaleString()}</td>
            <td style="text-align:right;font-weight:600">$${gross.toLocaleString()}</td>
            <td style="text-align:right;color:#dc2626">-$${Number(r.deductions || 0).toLocaleString()}</td>
            <td style="text-align:right;font-weight:800;color:#253C7D">$${Number(r.net_pay || 0).toLocaleString()}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statusColor}">
                ${status}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" style="text-align:center;padding:24px;color:#64748b;">No payroll records found.</td></tr>`;

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
        <div class="meta">Compensation &middot; ${periodLabel}</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Headcount:</strong> ${total} Employees</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">$${totalBase.toLocaleString()}</div><div class="stat-lbl">Total Base Salaries</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">+$${totalBonus.toLocaleString()}</div><div class="stat-lbl">Total Bonuses</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#dc2626">-$${totalDeductions.toLocaleString()}</div><div class="stat-lbl">Total Deductions</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">$${totalNet.toLocaleString()}</div><div class="stat-lbl">Net Payroll Outlay</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee Details</th>
          <th style="text-align:center">Period</th>
          <th style="text-align:right">Base Pay</th>
          <th style="text-align:right">Bonus</th>
          <th style="text-align:right">Gross Pay</th>
          <th style="text-align:right">Deductions</th>
          <th style="text-align:right">Net Pay</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Payroll Operations</div>
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
