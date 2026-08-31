import type { Enrollment } from "../types";

export function exportCertificatesPDF(certificates: Enrollment[], title = "Employee Training Certifications Register"): boolean {
  const total = certificates.length;

  const rows = certificates.length > 0
    ? certificates
        .map((c) => {
          const empName = `${c.employees?.first_name || ""} ${c.employees?.last_name || ""}`.trim() || "Staff Member";
          const dept = c.employees?.department || "—";
          const courseTitle = c.training_courses?.title || "Training Module";
          const completedDate = c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "—";
          const scoreStr = c.score !== null ? `${c.score}%` : "PASSED";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${empName}</td>
            <td>${dept}</td>
            <td style="font-weight:600">${courseTitle}</td>
            <td>${completedDate}</td>
            <td style="text-align:center;font-weight:700;color:#059669">${scoreStr}</td>
            <td><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#d1fae5;color:#065f46">CERTIFIED</span></td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No certified learners found.</td></tr>`;

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
      .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 18px; }
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
        <div class="meta">Talent Development &middot; Official Certifications Register</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Certified:</strong> ${total} Certificates</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val" style="color:#059669">${total}</div><div class="stat-lbl">Total Issued Certifications</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">100%</div><div class="stat-lbl">Curriculum Mastery</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Certified Employee</th>
          <th>Department</th>
          <th>Course / Curriculum</th>
          <th>Completion Date</th>
          <th style="text-align:center">Final Score</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Certificate Verification</div>
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
