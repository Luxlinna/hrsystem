import type { Employee, AccountStatus } from "../types";

export function exportEmployeesPDF(
  employees: Employee[],
  _accountStatus: Record<string, AccountStatus> = {},
  title = "Employee Workforce & Form Information Directory"
): boolean {
  const total = employees.length;
  const activeCount = employees.filter((e) => (e.status || "active") === "active").length;
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
          const khName = e.kh_name ? `<div style="font-size:8px;color:#64748b">${e.kh_name}</div>` : "";
          const pos = e.position || e.role || "Staff";
          const level = e.employee_level || e.employment_type || "—";
          const dept = e.department || "—";
          const bu = e.branches?.name || e.code_bu || "HQ";
          const site = e.work_locations?.name || e.working_location || "Main Site";
          const join = e.join_date || e.start_date || "—";
          const contract = e.contract_type || "UDC";
          const contractEnd = e.contract_end_date || e.fdc_end_date || "Continuous";
          const rate = e.basic_salary != null ? `${e.basic_salary} ${e.contract_rate_currency || "USD"}` : e.contract_rate != null ? `${e.contract_rate} ${e.contract_rate_currency || "USD"}` : "—";
          const freq = e.tax_salary_frequency || e.contract_rate_frequency || "Monthly";
          const nid = e.national_id_number || (e.identifications?.[0]?.identification_number ?? "");
          const bank = e.bank_name || (e.bank_accounts?.[0]?.payment_method ?? "");
          const bankAcc = e.bank_account_number || (e.bank_accounts?.[0]?.account_number ?? "");
          const statusBadge = getStatusBadgeStyle(e.status || "active");

          return `<tr>
            <td style="text-align:center;color:#64748b;font-size:8.5px">${idx + 1}</td>
            <td>
              <div style="font-weight:700;color:#1e293b;font-size:9.5px">${empName}</div>
              <div style="font-size:8px;color:#253C7D;font-family:monospace;font-weight:600">${code}</div>
              ${khName}
              ${e.gender ? `<span style="font-size:7.5px;color:#64748b;background:#f1f5f9;padding:1px 4px;border-radius:2px">${e.gender}</span>` : ""}
            </td>
            <td>
              <div style="color:#253C7D;font-weight:600">${pos}</div>
              <div style="font-size:8px;color:#64748b">${level}</div>
            </td>
            <td>
              <div style="color:#334155;font-weight:500">${dept}</div>
              <div style="font-size:8px;color:#64748b">${bu} &bull; ${site}</div>
            </td>
            <td style="color:#334155;white-space:nowrap;font-size:8.5px">
              <div><strong>Join:</strong> ${join}</div>
              <div style="color:#64748b;font-size:8px"><strong>Type:</strong> ${e.employment_type || "Full Time"}</div>
            </td>
            <td>
              <div style="color:#334155;font-weight:500">${contract}</div>
              <div style="font-size:8px;color:#64748b">End: ${contractEnd}</div>
            </td>
            <td>
              <div style="font-weight:700;color:#047857;font-family:monospace">${rate}</div>
              <div style="font-size:8px;color:#64748b">${freq}</div>
              ${bank ? `<div style="font-size:7.5px;color:#94a3b8">${bank} ${bankAcc ? `(${bankAcc})` : ""}</div>` : ""}
            </td>
            <td style="text-align:center">
              <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;letter-spacing:0.3px;${statusBadge}">
                ${(e.status || "active").replace(/_/g, " ").toUpperCase()}
              </span>
            </td>
            <td style="font-size:8.5px">
              <div style="color:#334155;font-weight:500">${e.phone || "—"}</div>
              <div style="color:#64748b">${e.email || "—"}</div>
              ${nid ? `<div style="font-size:7.5px;color:#94a3b8">NID: ${nid}</div>` : ""}
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="9" style="text-align:center;padding:24px;color:#64748b;">No employees found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 8mm; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin: 0;
        padding: 8px;
        color: #1e293b;
        background: #fff;
        font-size: 9px;
      }
      .header-box {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #253C7D;
        padding-bottom: 8px;
        margin-bottom: 8px;
      }
      h1 { font-size: 15px; font-weight: 800; color: #253C7D; margin: 0 0 2px 0; }
      .meta { font-size: 9px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; text-align: center; }
      .stat-val { font-size: 14px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 1px; }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 8.5px; }
      th { text-align: left; padding: 5px 4px; background: #253C7D; color: #fff; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
      td { padding: 4px 4px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
      tr:nth-child(even) { background-color: #fafbfc; }
      .footer { margin-top: 12px; font-size: 8px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — ${title}</h1>
        <div class="meta">Workforce Operations &middot; Employee Master Form Records</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Workforce:</strong> ${total} Staff</div>
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
          <th style="width:24px;text-align:center">No.</th>
          <th>Employee Details</th>
          <th>Position &amp; Level</th>
          <th>Dept &amp; Business Unit / Site</th>
          <th>Joining Terms</th>
          <th>Contract Details</th>
          <th>Compensation</th>
          <th style="text-align:center">Status</th>
          <th>Contact &amp; Identifiers</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Employee Directory Master Export</div>
      <div>Confidential &middot; Authorized Personnel Only</div>
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
