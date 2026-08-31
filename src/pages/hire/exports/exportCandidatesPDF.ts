import type { Candidate } from "../types";

export function exportCandidatesPDF(candidates: Candidate[], title = "Candidate Applicants Roster"): boolean {
  const total = candidates.length;
  const hired = candidates.filter((c) => c.stage === "hired").length;
  const interviewing = candidates.filter((c) => c.stage === "interview").length;
  const reviewing = candidates.filter((c) => c.stage === "screening" || c.stage === "applied").length;

  const rows = candidates.length > 0
    ? candidates
        .map((c) => {
          const jobTitle = c.job_postings?.title || "General Application";
          const dept = c.job_postings?.department || "—";
          const stage = (c.stage || "applied").replace(/_/g, " ").toUpperCase();
          const stageColor =
            c.stage === "hired"
              ? "background:#d1fae5;color:#065f46"
              : c.stage === "interview"
              ? "background:#e0f2fe;color:#0369a1"
              : c.stage === "offer"
              ? "background:#fef3c7;color:#92400e"
              : c.stage === "rejected"
              ? "background:#fee2e2;color:#991b1b"
              : "background:#f1f5f9;color:#475569";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${c.full_name}</td>
            <td>${c.email}<br/><span style="font-size:10px;color:#64748b">${c.phone || "—"}</span></td>
            <td style="font-weight:600">${jobTitle}</td>
            <td>${dept}</td>
            <td>${c.source || "Direct"}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${stageColor}">
                ${stage}
              </span>
            </td>
            <td>${c.applied_at ? new Date(c.applied_at).toLocaleDateString() : "—"}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No candidate applicants found.</td></tr>`;

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
        <div class="meta">Talent Acquisition &middot; Candidate Applicants Pipeline</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Applicants:</strong> ${total} Candidates</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Candidates</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${hired}</div><div class="stat-lbl">Hired Talents</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${interviewing}</div><div class="stat-lbl">Interview Stage</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#64748b">${reviewing}</div><div class="stat-lbl">Reviewing / Applied</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Applicant Name</th>
          <th>Contact Info</th>
          <th>Position Applied</th>
          <th>Department</th>
          <th>Source</th>
          <th>Stage</th>
          <th>Applied Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Candidate Pool</div>
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
