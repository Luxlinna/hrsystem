import type { PayrollRun } from "../types";

export function exportPayrollRunsPDF(runs: PayrollRun[], tabName = "All Batches", title = "Payroll Runs & Batch Authorization Report"): boolean {
  const total = runs.length;
  const totalNet = runs.reduce((acc, r) => acc + Number(r.total_net || 0), 0);
  const totalStaff = runs.reduce((acc, r) => acc + Number(r.employee_count || 0), 0);
  const pendingCount = runs.filter((r) => r.status === "pending" || r.status === "tier1_approved").length;

  const rows = runs.length > 0
    ? runs
        .map((r) => {
          const status = (r.status || "pending").replace(/_/g, " ").toUpperCase();
          const statusColor =
            r.status === "processed"
              ? "background:#d1fae5;color:#065f46"
              : r.status === "approved" || r.status === "tier2_approved"
              ? "background:#e0f2fe;color:#0369a1"
              : r.status === "rejected"
              ? "background:#fee2e2;color:#991b1b"
              : "background:#fef3c7;color:#92400e";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${r.period}</td>
            <td style="font-weight:600">${r.department || "All Departments"}</td>
            <td style="text-align:center">${r.employee_count || 0}</td>
            <td style="text-align:right">$${Number(r.total_base || 0).toLocaleString()}</td>
            <td style="text-align:right;color:#059669">+$${Number(r.total_bonus || 0).toLocaleString()}</td>
            <td style="text-align:right;color:#dc2626">-$${Number(r.total_deductions || 0).toLocaleString()}</td>
            <td style="text-align:right;font-weight:800;color:#253C7D">$${Number(r.total_net || 0).toLocaleString()}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statusColor}">
                ${status}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" style="text-align:center;padding:24px;color:#64748b;">No payroll batch runs found.</td></tr>`;

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
        <div class="meta">Governance &middot; Scope: ${tabName}</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Batches:</strong> ${total} Runs</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Batches</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${pendingCount}</div><div class="stat-lbl">Pending Authorization</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${totalStaff}</div><div class="stat-lbl">Employees Covered</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">$${totalNet.toLocaleString()}</div><div class="stat-lbl">Total Net Disbursement</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Period</th>
          <th>Department</th>
          <th style="text-align:center">Staff Count</th>
          <th style="text-align:right">Base Pay</th>
          <th style="text-align:right">Bonuses</th>
          <th style="text-align:right">Deductions</th>
          <th style="text-align:right">Net Total</th>
          <th>Approval Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Payroll Governance</div>
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
