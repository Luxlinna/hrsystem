import type { Employee } from "../types";

export interface SelfPayslip {
  id: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: string;
}

export function exportSelfPayslipsPDF(
  payslips: SelfPayslip[],
  employee: Employee | null,
  title = "My Payroll & Payslips History"
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const dept = employee?.department || "General";
  const total = payslips.length;
  const totalNet = payslips.reduce((acc, p) => acc + Number(p.net_pay || 0), 0);

  const rows = payslips.length > 0
    ? payslips
        .map((p) => {
          const gross = Number(p.base_salary || 0) + Number(p.bonus || 0);
          const statColor =
            p.status === "paid"
              ? "background:#d1fae5;color:#065f46"
              : p.status === "processed"
              ? "background:#e0f2fe;color:#0369a1"
              : "background:#fef3c7;color:#92400e";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${p.month}</td>
            <td style="text-align:right">$${Number(p.base_salary || 0).toLocaleString()}</td>
            <td style="text-align:right">$${Number(p.bonus || 0).toLocaleString()}</td>
            <td style="text-align:right;font-weight:600">$${gross.toLocaleString()}</td>
            <td style="text-align:right;color:#dc2626">-$${Number(p.deductions || 0).toLocaleString()}</td>
            <td style="text-align:right;font-weight:800;color:#253C7D">$${Number(p.net_pay || 0).toLocaleString()}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${(p.status || "paid").toUpperCase()}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No payslip records found.</td></tr>`;

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
        <div><strong>Total Payslips:</strong> ${total} Periods</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Issued Payslips</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">$${totalNet.toLocaleString()}</div><div class="stat-lbl">Total Net Earned</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">${employee?.role || "Staff"}</div><div class="stat-lbl">Designation</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Pay Period</th>
          <th style="text-align:right">Base Salary</th>
          <th style="text-align:right">Bonus / Allowances</th>
          <th style="text-align:right">Gross Pay</th>
          <th style="text-align:right">Deductions</th>
          <th style="text-align:right">Net Pay</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Employee Self-Service &middot; Confidential</div>
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
