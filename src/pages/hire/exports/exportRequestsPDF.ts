import type { HiringRequest } from "../types";

export function exportRequestsPDF(requests: HiringRequest[], title = "Employee Requisitions & Hiring Requests"): boolean {
  const total = requests.length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const pending = requests.filter((r) => r.status.includes("pending")).length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  const rows = requests.length > 0
    ? requests
        .map((r) => `<tr>
          <td style="font-weight:700;color:#253C7D">${r.title}</td>
          <td>${r.department}</td>
          <td>${r.branches?.name || "All Branches"}</td>
          <td style="text-align:center;font-weight:700">${r.headcount || 1}</td>
          <td><span style="font-weight:700;text-transform:uppercase">${r.urgency}</span></td>
          <td>${r.requested_by_name}</td>
          <td>
            <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${
              r.status === "approved"
                ? "background:#d1fae5;color:#065f46"
                : r.status.includes("pending")
                ? "background:#fef3c7;color:#92400e"
                : "background:#fee2e2;color:#991b1b"
            }">${(r.status || "").replace(/_/g, " ").toUpperCase()}</span>
          </td>
        </tr>`)
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No hiring requests found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 0mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; }
      table.print-page-layout { width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0; }
      table.print-page-layout > thead { display: table-header-group; }
      table.print-page-layout > tfoot { display: table-footer-group; }
      table.print-page-layout > thead > tr > td,
      table.print-page-layout > tfoot > tr > td,
      table.print-page-layout > tbody > tr > td { border: none; padding: 0; margin: 0; }
      .page-header-spacer { height: 8mm; }
      .page-footer-spacer { height: 8mm; }
      .page-container { padding: 0 20mm; box-sizing: border-box; width: 100%; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 14px; margin-bottom: 18px; }
      h1 { font-size: 20px; font-weight: 800; color: #253C7D; margin: 0 0 4px 0; }
      .meta { font-size: 11px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; text-align: center; }
      .stat-val { font-size: 18px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
      table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
      table.data-table th { text-align: left; padding: 8px 8px; background: #253C7D; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      table.data-table td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
      table.data-table tr:nth-child(even) { background-color: #f8fafc; }
      .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
  </head>
  <body>
    <table class="print-page-layout">
      <thead>
        <tr><td><div class="page-header-spacer"></div></td></tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="page-container">
              <div class="header-box">
                <div>
                  <h1>HRM_OPS — ${title}</h1>
                  <div class="meta">Talent Acquisition &middot; Hiring Requisitions Log</div>
                </div>
                <div class="meta" style="text-align:right">
                  <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
                  <div><strong>Total Requisitions:</strong> ${total} Requests</div>
                </div>
              </div>

              <div class="stats-grid">
                <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Requests</div></div>
                <div class="stat-card"><div class="stat-val" style="color:#059669">${approved}</div><div class="stat-lbl">Approved</div></div>
                <div class="stat-card"><div class="stat-val" style="color:#d97706">${pending}</div><div class="stat-lbl">Pending Review</div></div>
                <div class="stat-card"><div class="stat-val" style="color:#dc2626">${rejected}</div><div class="stat-lbl">Rejected</div></div>
              </div>

              <table class="data-table">
                <thead>
                  <tr>
                    <th>Requisition Title</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th style="text-align:center">Headcount</th>
                    <th>Urgency</th>
                    <th>Requested By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>

              <div class="footer">
                <div>HRM_OPS Enterprise HRMS &middot; Headcount Planning</div>
                <div>Page 1 of 1</div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr><td><div class="page-footer-spacer"></div></td></tr>
      </tfoot>
    </table>
  </body>
  </html>`;

  // Print via a hidden iframe to eliminate the persistent "about:blank" tab
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // Fallback
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }
      }, 350);

      return true;
    }
  } catch {
    // Fallback if iframe fails
  }

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 400);
  }
  return true;
}
