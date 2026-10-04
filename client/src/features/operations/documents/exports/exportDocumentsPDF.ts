import type { Document } from "../types";

export function exportDocumentsPDF(documents: Document[], title = "Corporate Knowledge & Document Catalog Report"): boolean {
  const total = documents.length;
  const activeCount = documents.filter((d) => d.status === "active").length;
  const templatesCount = documents.filter((d) => d.is_template).length;
  const totalDownloads = documents.reduce((acc, d) => acc + (d.download_count || 0), 0);

  const rows = documents.length > 0
    ? documents
        .map((d) => {
          const categoryStr = (d.category || "General").toUpperCase();
          const typeStr = (d.file_type || "FILE").toUpperCase();
          const sizeStr = d.file_size_kb ? `${d.file_size_kb} KB` : "—";
          const versionStr = d.version || "v1.0";
          const dateStr = d.created_at ? new Date(d.created_at).toLocaleDateString() : "—";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${d.title}<br/><span style="font-size:10px;color:#64748b">${categoryStr}${d.subcategory ? ` &middot; ${d.subcategory}` : ""}</span></td>
            <td><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#eff6ff;color:#1d4ed8">${typeStr}</span></td>
            <td>${versionStr}</td>
            <td>${sizeStr}</td>
            <td>${d.author_name || "—"}</td>
            <td>${dateStr}</td>
            <td style="text-align:center">${d.download_count || 0}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No documents found.</td></tr>`;

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
        <div class="meta">Knowledge Base &middot; Corporate SOPs, Policies &amp; Files</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Files:</strong> ${total} Files</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Documents</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${activeCount}</div><div class="stat-lbl">Active &amp; Available</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${templatesCount}</div><div class="stat-lbl">Official Templates</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">${totalDownloads}</div><div class="stat-lbl">Total Downloads</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Document Title &amp; Category</th>
          <th>File Type</th>
          <th>Version</th>
          <th>File Size</th>
          <th>Author</th>
          <th>Uploaded Date</th>
          <th style="text-align:center">Downloads</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Document Management</div>
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
