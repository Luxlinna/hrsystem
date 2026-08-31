import type { ITAsset } from "../types";

export function exportITAssetsPDF(assets: ITAsset[], title = "IT Hardware & Equipment Inventory Report"): boolean {
  const total = assets.length;
  const activeCount = assets.filter((a) => a.status === "active").length;
  const inventoryCount = assets.filter((a) => a.status === "inventory").length;
  const maintenanceCount = assets.filter((a) => a.status === "maintenance").length;
  const retiredCount = assets.filter((a) => a.status === "retired").length;

  const rows = assets.length > 0
    ? assets
        .map((a) => {
          const empName = a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : "Unassigned (In Stock)";
          const dept = a.employees?.department || "IT Inventory";
          const statusStr = (a.status || "active").toUpperCase();
          const branchName = a.branches?.name || "General";

          const statColor =
            a.status === "active"
              ? "background:#d1fae5;color:#065f46"
              : a.status === "inventory"
              ? "background:#e0f2fe;color:#0369a1"
              : a.status === "maintenance"
              ? "background:#fef3c7;color:#92400e"
              : "background:#f1f5f9;color:#475569";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${a.name}<br/><span style="font-size:10px;color:#64748b">${a.type.toUpperCase()}</span></td>
            <td style="font-mono;font-weight:600">${a.asset_tag}</td>
            <td style="font-mono;font-size:10px">${a.serial_number || "—"}</td>
            <td>${branchName}</td>
            <td style="font-weight:600">${empName}<br/><span style="font-size:10px;color:#64748b">${dept}</span></td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${statusStr}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No IT asset records found.</td></tr>`;

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
        <div class="meta">IT Infrastructure &middot; Endpoint Equipment Register</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Assets:</strong> ${total} Items</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Registered</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">${activeCount}</div><div class="stat-lbl">Active &amp; Deployed</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">${inventoryCount}</div><div class="stat-lbl">In Stock Inventory</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">${maintenanceCount + retiredCount}</div><div class="stat-lbl">Maintenance / Retired</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Asset &amp; Type</th>
          <th>Asset Tag</th>
          <th>Serial Number</th>
          <th>Branch Location</th>
          <th>Assigned Employee</th>
          <th>Deployment Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; IT Assets &amp; Infrastructure</div>
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
