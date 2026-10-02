import type { Employee } from "../types";

export function exportOrgChartPDF(
  employees: Employee[],
  branchName?: string,
  title = "Organization Structure & Hierarchy Report"
): boolean {
  const employeeMap = new Map<string, Employee>();
  employees.forEach((e) => employeeMap.set(e.id, e));

  const totalEmployees = employees.length;
  const uniqueDepts = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
  const leadershipCount = employees.filter((e) =>
    /ceo|chairman|chairwoman|director|manager|head|lead|founder|supervisor/i.test(e.role)
  ).length;

  const rows = employees.length > 0
    ? employees
        .map((e) => {
          const mgr = e.reports_to ? employeeMap.get(e.reports_to) : null;
          const mgrName = mgr ? `${mgr.first_name} ${mgr.last_name}` : "Executive / Top Level";
          const directReportsCount = employees.filter((x) => x.reports_to === e.id).length;
          const isLeader = /ceo|chairman|chairwoman|director|manager|head|lead|founder/i.test(e.role);

          return `<tr>
            <td style="font-weight:700;color:#253C7D">
              ${e.first_name} ${e.last_name}
              ${isLeader ? `<span style="display:inline-block;margin-left:4px;padding:1px 5px;background:#dbeafe;color:#1e40af;border-radius:4px;font-size:9px;font-weight:700">LEADER</span>` : ""}
            </td>
            <td style="font-weight:600">${e.role}</td>
            <td>${e.department || "General"}</td>
            <td>${e.branches?.name || branchName || "Main Branch"}</td>
            <td>${mgrName}</td>
            <td style="text-align:center;font-weight:700">${directReportsCount}</td>
            <td style="color:#64748b;font-size:10px">${e.email || "—"}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No employee records found.</td></tr>`;

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
        <div class="meta">Company Hierarchy &middot; ${branchName || "Enterprise Structure"}</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Scope:</strong> ${branchName || "All Operational Branches"}</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${totalEmployees}</div><div class="stat-lbl">Total Team Members</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${uniqueDepts.length}</div><div class="stat-lbl">Active Departments</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${leadershipCount}</div><div class="stat-lbl">Leadership &amp; Managers</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${totalEmployees - leadershipCount}</div><div class="stat-lbl">Individual Contributors</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Designation / Role</th>
          <th>Department</th>
          <th>Branch</th>
          <th>Direct Manager (Reports To)</th>
          <th style="text-align:center">Direct Reports</th>
          <th>Work Email</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Organization Chart Directory</div>
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
