import type { BenefitPlan, Enrollment } from "../types";

export function exportBenefitPlansPDF(
  plans: BenefitPlan[],
  enrollments: Enrollment[],
  title = "Employee Benefit Programs & Insurance Catalog"
): boolean {
  const total = plans.length;
  const activeCount = plans.filter((p) => p.status === "active").length;
  const totalEligible = plans.reduce((acc, p) => acc + (p.eligible_count || 0), 0);
  const totalEnrolled = enrollments.filter((e) => e.status === "enrolled").length;

  const rows = plans.length > 0
    ? plans
        .map((p) => {
          const enrCount = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
          const statusStr = (p.status || "active").toUpperCase();
          const statColor =
            p.status === "active"
              ? "background:#d1fae5;color:#065f46"
              : "background:#f1f5f9;color:#475569";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${p.name}<br/><span style="font-size:10px;color:#64748b">${p.type.toUpperCase()}</span></td>
            <td style="font-weight:600">${p.provider}</td>
            <td style="text-align:right">$${Number(p.coverage_amount || 0).toLocaleString()}</td>
            <td style="text-align:right">$${Number(p.employee_contribution || 0).toLocaleString()}/mo</td>
            <td style="text-align:center">${p.eligible_count || 0}</td>
            <td style="text-align:center;font-weight:700;color:#253C7D">${enrCount}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${statusStr}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No benefit plans found.</td></tr>`;

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
        <div class="meta">Benefits Administration &middot; Company Insurance Programs</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Programs:</strong> ${total} Plans</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Plans</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${activeCount}</div><div class="stat-lbl">Active Programs</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${totalEligible}</div><div class="stat-lbl">Eligible Positions</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">${totalEnrolled}</div><div class="stat-lbl">Active Enrollments</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Plan &amp; Category</th>
          <th>Insurance Provider</th>
          <th style="text-align:right">Max Coverage</th>
          <th style="text-align:right">Employee Cost</th>
          <th style="text-align:center">Eligible</th>
          <th style="text-align:center">Enrolled</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Benefits &amp; Health Administration</div>
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
