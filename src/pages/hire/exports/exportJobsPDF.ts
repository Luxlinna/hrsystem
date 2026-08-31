import type { Job } from "../types";

export function exportJobsPDF(jobs: Job[], title = "Job Postings & Vacancies Report"): boolean {
  const total = jobs.length;
  const activeCount = jobs.filter((j) => j.status === "active").length;
  const closedCount = jobs.filter((j) => j.status === "closed" || j.status === "filled").length;
  const draftCount = jobs.filter((j) => j.status === "draft").length;

  const rows = jobs.length > 0
    ? jobs
        .map((j) => `<tr>
          <td style="font-weight:700;color:#253C7D">${j.title}</td>
          <td>${j.department}</td>
          <td>${j.branches?.name || j.location || "All Branches"}</td>
          <td>${j.type}</td>
          <td>$${Number(j.salary_min || 0).toLocaleString()} - $${Number(j.salary_max || 0).toLocaleString()}</td>
          <td>
            <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${
              j.status === "active" ? "background:#d1fae5;color:#065f46" : "background:#f1f5f9;color:#475569"
            }">${(j.status || "DRAFT").toUpperCase()}</span>
          </td>
          <td>${j.posted_at ? new Date(j.posted_at).toLocaleDateString() : "—"}</td>
        </tr>`)
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No job openings found.</td></tr>`;

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
        <div class="meta">Talent Acquisition &middot; Job Openings &amp; Vacancies Directory</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Positions:</strong> ${total} Roles</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Postings</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${activeCount}</div><div class="stat-lbl">Active Vacancies</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#64748b">${closedCount}</div><div class="stat-lbl">Closed / Filled</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#f59e0b">${draftCount}</div><div class="stat-lbl">Draft Postings</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Job Title</th>
          <th>Department</th>
          <th>Branch / Location</th>
          <th>Type</th>
          <th>Salary Range</th>
          <th>Status</th>
          <th>Posted Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Career Opportunities</div>
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
