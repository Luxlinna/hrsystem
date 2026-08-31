import type { Course } from "../types";

export function exportCoursesPDF(courses: Course[], title = "Training Courses & Curriculum Directory"): boolean {
  const total = courses.length;
  const activeCount = courses.filter((c) => c.status === "active").length;
  const onlineCount = courses.filter((c) => c.format === "online" || c.format === "self_paced").length;
  const inPersonCount = courses.filter((c) => c.format === "in_person" || c.format === "hybrid").length;

  const rows = courses.length > 0
    ? courses
        .map((c) => {
          const scope = c.branch_id ? c.branches?.name || "Branch Specific" : "Company-Wide (Admin)";
          const status = (c.status || "active").toUpperCase();
          const statusColor = c.status === "active" ? "background:#d1fae5;color:#065f46" : "background:#f1f5f9;color:#475569";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${c.title}</td>
            <td>${c.category}</td>
            <td><span style="font-weight:600">${scope}</span></td>
            <td>${c.instructor || "Internal"}</td>
            <td>${c.format.replace(/_/g, " ").toUpperCase()}</td>
            <td style="text-align:center">${c.duration_hours ? `${c.duration_hours} hrs` : "—"}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statusColor}">
                ${status}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No training courses found.</td></tr>`;

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
        <div class="meta">Learning &amp; Development &middot; Course Catalog</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Courses:</strong> ${total} Modules</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Courses</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${activeCount}</div><div class="stat-lbl">Active Curricula</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${onlineCount}</div><div class="stat-lbl">Online / Self-Paced</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${inPersonCount}</div><div class="stat-lbl">In-Person / Hybrid</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Course Title</th>
          <th>Category</th>
          <th>Branch Scope</th>
          <th>Instructor / Facilitator</th>
          <th>Format</th>
          <th style="text-align:center">Duration</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Training Operations</div>
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
