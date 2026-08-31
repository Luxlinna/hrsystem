import type { DisciplinaryRecord } from "../types";

export function exportDisciplinaryPDF(records: DisciplinaryRecord[], title = "Employee Disciplinary & PIP Incidents Report"): boolean {
  const total = records.length;
  const openCount = records.filter((r) => r.status === "open" || r.status === "in_progress").length;
  const pipCount = records.filter((r) => r.type?.toLowerCase().includes("pip") || r.pip_start_date).length;
  const criticalCount = records.filter((r) => r.severity === "critical" || r.severity === "high").length;
  const resolvedCount = records.filter((r) => r.status === "resolved" || r.status === "closed").length;

  const rows = records.length > 0
    ? records
        .map((r) => {
          const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown Employee";
          const dept = r.employees?.department || "—";
          const caseTitle = r.title || "Disciplinary Incident";
          const typeStr = (r.type || "General").toUpperCase();
          const severityStr = (r.severity || "low").toUpperCase();
          const statusStr = (r.status || "open").toUpperCase();

          const sevColor =
            r.severity === "critical"
              ? "background:#fee2e2;color:#991b1b"
              : r.severity === "high"
              ? "background:#ffedd5;color:#9a3412"
              : r.severity === "medium"
              ? "background:#fef3c7;color:#92400e"
              : "background:#f1f5f9;color:#475569";

          const statColor =
            r.status === "resolved" || r.status === "closed"
              ? "background:#d1fae5;color:#065f46"
              : r.status === "in_progress"
              ? "background:#e0f2fe;color:#0369a1"
              : "background:#fee2e2;color:#991b1b";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${empName}<br/><span style="font-size:10px;color:#64748b">${dept}</span></td>
            <td style="font-weight:600">${caseTitle}<br/><span style="font-size:10px;color:#64748b">${typeStr}</span></td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${sevColor}">
                ${severityStr}
              </span>
            </td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${statusStr}
              </span>
            </td>
            <td>${r.incident_date || "—"}</td>
            <td>${r.follow_up_date || "—"}</td>
            <td>${r.action_taken || "Under Review"}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No disciplinary records found.</td></tr>`;

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
        <div class="meta">Employee Relations &middot; Incident Tracking &amp; PIP Directory</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Cases:</strong> ${total} Records</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Incidents</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${openCount}</div><div class="stat-lbl">Open / Under Review</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#b91c1c">${criticalCount}</div><div class="stat-lbl">High / Critical Severity</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${resolvedCount}</div><div class="stat-lbl">Resolved / Closed</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Case &amp; Incident Type</th>
          <th>Severity</th>
          <th>Status</th>
          <th>Incident Date</th>
          <th>Follow Up Due</th>
          <th>Action Taken / Outcome</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Disciplinary Operations</div>
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
