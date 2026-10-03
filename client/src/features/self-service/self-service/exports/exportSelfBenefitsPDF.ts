import type { Employee } from "../types";

export interface SelfBenefitEnrollment {
  id: string;
  status: string;
  created_at: string;
  plan_id: string;
  benefit_plans: {
    name: string;
    type: string;
    provider: string;
    description?: string;
    coverage_amount: number;
    employee_contribution: number;
  } | null;
}

export function exportSelfBenefitsPDF(
  enrollments: SelfBenefitEnrollment[],
  employee: Employee | null,
  title = "My Benefits Coverage & Insurance Programs"
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const dept = employee?.department || "General";
  const total = enrollments.length;
  const activeCount = enrollments.filter((e) => e.status === "enrolled" || e.status === "active").length;
  const totalMonthlyCost = enrollments
    .filter((e) => e.status === "enrolled" || e.status === "active")
    .reduce((acc, e) => acc + (Number(e.benefit_plans?.employee_contribution) || 0), 0);

  const rows = enrollments.length > 0
    ? enrollments
        .map((e) => {
          const planName = e.benefit_plans?.name || "General Benefit";
          const typeStr = (e.benefit_plans?.type || "perk").toUpperCase();
          const provider = e.benefit_plans?.provider || "—";
          const coverage = e.benefit_plans?.coverage_amount ? `$${Number(e.benefit_plans.coverage_amount).toLocaleString()}` : "—";
          const cost = e.benefit_plans?.employee_contribution ? `$${Number(e.benefit_plans.employee_contribution).toLocaleString()}/mo` : "$0";
          const enrolledDate = e.created_at ? new Date(e.created_at).toLocaleDateString() : "—";
          const statColor =
            e.status === "enrolled" || e.status === "active"
              ? "background:#d1fae5;color:#065f46"
              : "background:#fee2e2;color:#991b1b";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${planName}<br/><span style="font-size:10px;color:#64748b">${typeStr}</span></td>
            <td style="font-weight:600">${provider}</td>
            <td style="text-align:right">${coverage}</td>
            <td style="text-align:right;font-weight:600">${cost}</td>
            <td>${enrolledDate}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${(e.status || "enrolled").toUpperCase()}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No active benefit enrollments found.</td></tr>`;

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
        <div><strong>Total Enrolled:</strong> ${total} Programs</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Enrolled Programs</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${activeCount}</div><div class="stat-lbl">Active Coverage</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">$${totalMonthlyCost.toLocaleString()}/mo</div><div class="stat-lbl">Total Contribution</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Plan &amp; Type</th>
          <th>Insurance Provider</th>
          <th style="text-align:right">Max Coverage</th>
          <th style="text-align:right">My Cost / Month</th>
          <th>Enrolled Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Employee Self-Service</div>
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
