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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "color:#15803d";
      case "onboarding": return "color:#b45309";
      case "on_leave": return "color:#4338ca";
      case "suspended": return "color:#b91c1c";
      default: return "color:#475569";
    }
  };

  const rows = employees.length > 0
    ? employees
        .map((e, idx) => {
          const empName = e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Employee";
          const code = e.employee_code || e.id.slice(0, 8);
          const khName = e.kh_name ? `<div style="font-size:7.5px;color:#64748b">${e.kh_name}</div>` : "";
          const pos = e.position || e.role || "Staff";
          const level = e.employee_level || e.employment_type || "—";
          const dept = e.department || "—";
          const bu = e.branches?.name || e.code_bu || "HQ";
          const site = e.work_locations?.name || e.working_location || "Main Site";
          const join = e.join_date || e.start_date || "—";
          const contract = e.contract_type || "UDC";
          const contractEnd = e.contract_end_date || e.fdc_end_date || "Continuous";
          const nid = e.national_id_number || (e.identifications?.[0]?.identification_number ?? "");
          const stColor = getStatusColor(e.status || "active");

          return `<tr>
            <td style="text-align:center;color:#64748b;font-size:8px">${idx + 1}</td>
            <td>
              <div style="font-weight:600;color:#0f172a;font-size:9px">${empName}</div>
              <div style="font-size:7.5px;color:#475569;font-family:monospace">${code}</div>
              ${khName}
            </td>
            <td>
              <div style="color:#0f172a;font-weight:600">${pos}</div>
              <div style="font-size:7.5px;color:#64748b">${level}</div>
            </td>
            <td>
              <div style="color:#1e293b;font-weight:500">${dept}</div>
              <div style="font-size:7.5px;color:#64748b">${bu} &bull; ${site}</div>
            </td>
            <td style="white-space:nowrap;font-size:8px">
              <div><strong>Join:</strong> ${join}</div>
              <div style="color:#64748b;font-size:7.5px">${e.employment_type || "Full Time"}</div>
            </td>
            <td style="font-size:8px">
              <div style="font-weight:500">${contract}</div>
              <div style="font-size:7.5px;color:#64748b">End: ${contractEnd}</div>
            </td>
            <td style="text-align:center;font-size:8px;font-weight:700;${stColor}">
              ${(e.status || "active").replace(/_/g, " ").toUpperCase()}
            </td>
            <td style="font-size:8px">
              <div style="color:#1e293b">${e.phone || "—"}</div>
              <div style="color:#64748b">${e.email || "—"}</div>
              ${nid ? `<div style="font-size:7px;color:#94a3b8">NID: ${nid}</div>` : ""}
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" style="text-align:center;padding:16px;color:#64748b;">No employees found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin: 0; padding: 0; color: #0f172a; background: #fff; font-size: 8.5px; line-height: 1.35;
      }
      .header-box {
        display: flex; justify-content: space-between; align-items: flex-end;
        border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;
      }
      h1 { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.2px; text-transform: uppercase; }
      .meta { font-size: 8px; color: #475569; }
      .meta-right { text-align: right; font-size: 8px; color: #475569; }
      .summary-bar {
        background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;
        padding: 5px 10px; margin-bottom: 10px; font-size: 8px; color: #334155;
        display: flex; justify-content: space-between; align-items: center;
      }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 8px; }
      th {
        text-align: left; padding: 5px 4px; background: #f1f5f9; color: #0f172a;
        font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
        border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a;
      }
      td { padding: 4px 4px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
      tr:nth-child(even) { background-color: #fafbfc; }
      .footer { margin-top: 12px; font-size: 7.5px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — Workforce Directory</h1>
        <div class="meta">Master Employee Directory &middot; Operational Records</div>
      </div>
      <div class="meta-right">
        <div><strong>Print Date:</strong> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
        <div><strong>Total:</strong> ${total} Employees &nbsp;|&nbsp; <strong>Active:</strong> ${activeCount} &nbsp;|&nbsp; <strong>Onboarding:</strong> ${onboardingCount} &nbsp;|&nbsp; <strong>On Leave:</strong> ${onLeaveCount}</div>
      </div>
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
          <th style="text-align:center">Status</th>
          <th>Contact &amp; Identifiers</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Employee Directory Report</div>
      <div>Confidential &middot; Internal Operational Use Only</div>
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
