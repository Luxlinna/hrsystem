import type { Announcement } from "../types";

export function exportAnnouncementsPDF(
  announcements: Announcement[],
  title = "Corporate Announcements & Broadcast Register"
): boolean {
  const total = announcements.length;
  const urgentCount = announcements.filter((a) => a.priority === "urgent" || a.priority === "high").length;
  const pinnedCount = announcements.filter((a) => a.pinned).length;
  const totalViews = announcements.reduce((acc, a) => acc + (a.view_count || 0), 0);

  const rows = announcements.length > 0
    ? announcements
        .map((a) => {
          const categoryStr = (a.category || "General").toUpperCase();
          const priorityStr = (a.priority || "normal").toUpperCase();
          const dateStr = a.published_at || a.created_at ? new Date(a.published_at || a.created_at).toLocaleDateString() : "—";
          const priColor =
            a.priority === "urgent"
              ? "background:#fee2e2;color:#991b1b"
              : a.priority === "high"
              ? "background:#ffedd5;color:#9a3412"
              : "background:#f1f5f9;color:#475569";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${a.title}<br/><span style="font-size:10px;color:#64748b">${categoryStr}</span></td>
            <td>${a.author_name} &middot; <span style="font-size:10px;color:#64748b">${a.author_role}</span></td>
            <td>${a.visible_to || "All Staff"}</td>
            <td>${dateStr}</td>
            <td style="text-align:center">${a.view_count || 0}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${priColor}">
                ${priorityStr}${a.pinned ? " &bull; PINNED" : ""}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No announcements found.</td></tr>`;

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
        <div class="meta">Corporate Communications &middot; Company Broadcast Center</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Articles:</strong> ${total} Broadcasts</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Published</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#dc2626">${urgentCount}</div><div class="stat-lbl">Urgent Bulletins</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${pinnedCount}</div><div class="stat-lbl">Pinned Posts</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#253C7D">${totalViews}</div><div class="stat-lbl">Total Readership</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Announcement Title &amp; Category</th>
          <th>Author Details</th>
          <th>Target Audience</th>
          <th>Published Date</th>
          <th style="text-align:center">Views</th>
          <th>Priority</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Broadcast Communications</div>
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
