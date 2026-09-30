import type { Employee, AccountStatus } from "../types";

export function exportEmployeesPDF(
  employees: Employee[],
  _accountStatus: Record<string, AccountStatus> = {},
  title = "Employee Workforce Directory Report"
): boolean {
  const total = employees.length;
  const activeCount = employees.filter((e) => e.status === "active").length;
  const onboardingCount = employees.filter((e) => e.status === "onboarding").length;
  const onLeaveCount = employees.filter((e) => e.status === "on_leave").length;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "active":
        return "background:#ecfdf5;color:#047857;border:1px solid #a7f3d0";
      case "onboarding":
        return "background:#fffbeb;color:#b45309;border:1px solid #fde68a";
      case "on_leave":
        return "background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe";
      case "suspended":
        return "background:#fff1f2;color:#be123c;border:1px solid #fecdd3";
      default:
        return "background:#f8fafc;color:#475569;border:1px solid #e2e8f0";
    }
  };

  const rows = employees.length > 0
    ? employees
        .map((e, idx) => {
          const empName = e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Employee";
          const code = e.employee_code || e.id.slice(0, 8);
          const khName = e.kh_name ? `<div style="font-size:8.5px;color:#64748b">${e.kh_name}</div>` : "";
          const pos = e.position || e.role || "Staff";
          const level = e.employee_level || e.employment_type || "—";
          const dept = e.department || "—";
          const bu = e.branches?.name || e.code_bu || "HQ";
          const join = e.join_date || e.start_date || "—";
          const contract = e.contract_type || "—";
          const contractEnd = e.contract_end_date || "Never";
          const rate = e.basic_salary != null ? `${e.basic_salary} USD` : e.contract_rate != null ? `${e.contract_rate} USD` : "—";
          const freq = e.tax_salary_frequency || "Monthly";
          const statusBadge = getStatusBadgeStyle(e.status);

          return `<tr>
            <td style="text-align:center;color:#64748b">${idx + 1}</td>
            <td>
              <div style="font-weight:700;color:#1e293b">${empName}</div>
              <div style="font-size:8.5px;color:#64748b;font-family:monospace">${code}</div>
              ${khName}
            </td>
            <td>
              <div style="color:#253C7D;font-weight:600">${pos}</div>
              <span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:600;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;margin-top:2px">${level}</span>
            </td>
            <td>
              <div style="color:#334155;font-weight:500">${dept}</div>
              <div style="font-size:8.5px;color:#64748b">${bu}</div>
            </td>
            <td style="color:#334155;white-space:nowrap">${join}</td>
            <td>
              <div style="color:#334155;font-weight:500">${contract}</div>
              <div style="font-size:8.5px;color:#64748b">${contractEnd}</div>
            </td>
            <td>
              <div style="font-weight:600;color:#1e293b;font-family:monospace">${rate}</div>
              <div style="font-size:8.5px;color:#253C7D">${freq}</div>
            </td>
            <td style="text-align:center">
              <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:8.5px;font-weight:700;letter-spacing:0.3px;${statusBadge}">
                ${(e.status || "active").replace(/_/g, " ").toUpperCase()}
              </span>
            </td>
            <td style="font-size:9px">
              <div style="color:#334155">${e.email || "—"}</div>
              <div style="color:#64748b">${e.phone || "—"}</div>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="9" style="text-align:center;padding:24px;color:#64748b;">No employees found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 14px; color: #1e293b; background: #fff; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 10px; margin-bottom: 12px; }
      h1 { font-size: 16px; font-weight: 800; color: #253C7D; margin: 0 0 2px 0; }
      .meta { font-size: 10px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; text-align: center; }
      .stat-val { font-size: 15px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 1px; }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9.5px; }
      th { text-align: left; padding: 6px 5px; background: #253C7D; color: #fff; font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 5px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
      tr:nth-child(even) { background-color: #fafbfc; }
      .footer { margin-top: 16px; font-size: 8.5px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — ${title}</h1>
        <div class="meta">Workforce Operations &middot; Employee Master Directory</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Workforce:</strong> ${total} Employees</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Headcount</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${activeCount}</div><div class="stat-lbl">Active</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${onboardingCount}</div><div class="stat-lbl">Onboarding</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#2563eb">${onLeaveCount}</div><div class="stat-lbl">On Leave</div></div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:26px;text-align:center">No.</th>
          <th>Employee</th>
          <th>Position & Level</th>
          <th>Department & BU</th>
          <th>Joining Date</th>
          <th>Contract</th>
          <th>Rate</th>
          <th style="text-align:center">Status</th>
          <th>Contact</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Employee Directory</div>
      <div>Confidential &middot; For Internal HR Use Only</div>
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
