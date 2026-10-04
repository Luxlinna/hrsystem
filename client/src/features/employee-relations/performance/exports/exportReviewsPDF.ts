import type { Review } from "../types";

export function exportReviewsPDF(reviews: Review[], title = "Employee Performance Appraisals Report"): boolean {
  const total = reviews.length;
  const submittedCount = reviews.filter((r) => r.status === "submitted").length;
  const draftCount = reviews.filter((r) => r.status === "draft").length;

  const validScores = reviews.map((r) => r.overall_score).filter((s): s is number => typeof s === "number" && s > 0);
  const avgOverall = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : "—";

  const rows = reviews.length > 0
    ? reviews
        .map((r) => {
          const empName = `${r.employee?.first_name || ""} ${r.employee?.last_name || ""}`.trim() || "Employee";
          const dept = r.employee?.department || "—";
          const role = r.employee?.role || "Staff";
          const reviewerName = r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}` : "Manager";
          const period = `${r.quarter} ${r.year}`;
          const scoreStr = r.overall_score ? `${r.overall_score.toFixed(1)} / 5.0` : "—";
          const status = (r.status || "draft").toUpperCase();
          const statusColor = r.status === "submitted" ? "background:#d1fae5;color:#065f46" : "background:#fef3c7;color:#92400e";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${empName}<br/><span style="font-size:10px;color:#64748b">${role}</span></td>
            <td>${dept}</td>
            <td style="font-weight:600">${period}</td>
            <td>${reviewerName}</td>
            <td style="text-align:center;font-weight:700;color:#253C7D">${scoreStr}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statusColor}">
                ${status}
              </span>
            </td>
            <td style="font-size:10px;color:#475569;max-width:200px">${r.strengths || r.comments || "—"}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No performance review records found.</td></tr>`;

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
        <div class="meta">Talent Management &middot; Performance Appraisal &amp; Review Records</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Reviews:</strong> ${total} Evaluations</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Reviews</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${submittedCount}</div><div class="stat-lbl">Completed &amp; Submitted</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${draftCount}</div><div class="stat-lbl">Draft / In Review</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#2563eb">${avgOverall} / 5.0</div><div class="stat-lbl">Average Rating</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Department</th>
          <th>Review Cycle</th>
          <th>Evaluator / Manager</th>
          <th style="text-align:center">Overall Score</th>
          <th>Status</th>
          <th>Key Highlights / Strengths</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Performance Management</div>
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
