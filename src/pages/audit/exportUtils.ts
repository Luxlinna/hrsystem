import type { AuditLog, ExportFormat } from "./types";

export const getExportCols = () => [
  "Timestamp",
  "Module",
  "Action",
  "Entity Type",
  "Actor",
  "Role",
  "Description",
];

export const getExportRows = (logs: AuditLog[]) =>
  logs.map((l) => [
    new Date(l.created_at).toLocaleString(),
    l.module,
    l.action,
    l.entity_type,
    l.actor_name,
    l.actor_role,
    l.description,
  ]);

export const getExportFilename = () => `audit-log-${new Date().toISOString().substring(0, 10)}`;

export const downloadCSV = (logs: AuditLog[], setExporting: (f: ExportFormat | null) => void) => {
  setExporting("csv");
  const cols = getExportCols();
  const rows = getExportRows(logs).map((r) =>
    r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
  );
  const csv = [cols.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${getExportFilename()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  setTimeout(() => setExporting(null), 800);
};

export const exportExcel = async (logs: AuditLog[], setExporting: (f: ExportFormat | null) => void) => {
  setExporting("xlsx");
  const XLSX = await import("xlsx");
  const aoa = [getExportCols(), ...getExportRows(logs)];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = getExportCols().map((col) => ({ wch: Math.max(col.length + 2, 12) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Audit Log");
  XLSX.writeFile(wb, `${getExportFilename()}.xlsx`);
  setTimeout(() => setExporting(null), 800);
};

export const exportPDF = (logs: AuditLog[], setExporting: (f: ExportFormat | null) => void) => {
  setExporting("pdf");
  const cols = getExportCols();
  const rows = getExportRows(logs);
  const tableRows = rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (v) =>
              `<td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px">${v}</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Audit Log</title><style>
    body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
    h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:20px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:8px 10px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#666}
    td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
    .footer{margin-top:20px;font-size:10px;color:#999;text-align:right}
    @media print{body{padding:0}}
  </style></head><body>
    <h1>HRM_OPS — Activity Audit Log</h1>
    <p>Generated: ${new Date().toLocaleString("en-US")} · ${rows.length} records</p>
    <table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${tableRows}</tbody></table>
    <div class="footer">HRM_OPS HRMS · Confidential</div>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.print();
    };
  }
  setTimeout(() => setExporting(null), 800);
};
