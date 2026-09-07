import type { Employee, AccountStatus } from "../types";

export function exportEmployeesPDF(
  employees: Employee[],
  accountStatus: Record<string, AccountStatus> = {},
  title = "Employee Workforce Directory Report"
): boolean {
  const total = employees.length;
  const activeCount = employees.filter((e) => e.status === "active").length;
  const onboardingCount = employees.filter((e) => e.status === "onboarding").length;
  const onLeaveCount = employees.filter((e) => e.status === "on_leave").length;
  const inactiveCount = employees.filter((e) => e.status === "inactive" || e.status === "suspended").length;

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
      case "inactive":
      default:
        return "background:#f8fafc;color:#475569;border:1px solid #e2e8f0";
    }
  };

  const getAccountBadgeStyle = (acc?: AccountStatus) => {
    if (acc?.hasAccount) return "background:#ecfdf5;color:#047857";
    if (acc?.invited) return "background:#fffbeb;color:#b45309";
    return "background:#f1f5f9;color:#64748b";
  };

  const rows = employees.length > 0
    ? employees
        .map((e) => {
          const empName = `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Employee";
          const dept = e.department || "—";
          const role = e.role || "Staff";
          const branch = e.branches?.name || "Headquarters";
          const email = e.email || "—";
          const phone = e.phone || "—";
          const acc = accountStatus[e.email];
          const accLabel = acc?.hasAccount ? "Active" : acc?.invited ? "Invited" : "No Account";
          const statusBadge = getStatusBadgeStyle(e.status);
          const accBadge = getAccountBadgeStyle(acc);

          return `<tr>
            <td style="font-weight:700;color:#1e293b">${empName}</td>
            <td style="color:#253C7D;font-weight:600">${role}</td>
            <td style="color:#475569">${dept}</td>
            <td style="color:#475569">${branch}</td>
            <td style="font-size:10px;color:#334155">${email}</td>
            <td style="font-size:10px;color:#475569">${phone}</td>
            <td style="text-align:center">
              <span style="display:inline-block;padding:2px 7px;border-radius:6px;font-size:9px;font-weight:800;letter-spacing:0.3px;${statusBadge}">
                ${(e.status || "active").replace(/_/g, " ").toUpperCase()}
              </span>
            </td>
            <td style="text-align:center">
              <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;${accBadge}">
                ${accLabel}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" style="text-align:center;padding:24px;color:#64748b;">No employees found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 18px; color: #1e293b; background: #fff; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 12px; margin-bottom: 16px; }
      h1 { font-size: 18px; font-weight: 800; color: #253C7D; margin: 0 0 3px 0; }
      .meta { font-size: 11px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; text-align: center; }
      .stat-val { font-size: 16px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
      th { text-align: left; padding: 7px 6px; background: #253C7D; color: #fff; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 6px 6px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) { background-color: #fafbfc; }
      .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
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
      <div class="stat-card"><div class="stat-val" style="color:#059669">${activeCount}</div><div class="stat-lbl">Active Employees</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${onboardingCount}</div><div class="stat-lbl">Onboarding</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#2563eb">${onLeaveCount}</div><div class="stat-lbl">On Leave</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Role / Position</th>
          <th>Department</th>
          <th>Branch / Site</th>
          <th>Email</th>
          <th>Phone</th>
          <th style="text-align:center">Status</th>
          <th style="text-align:center">Account</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Employee Directory</div>
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
