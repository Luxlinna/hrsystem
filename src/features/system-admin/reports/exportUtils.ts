import * as XLSX from "xlsx";
import { cellValue, reportFileName } from "./reportsUtils";
import { MODULES } from "./constants";
import type { ReportRow } from "./types";

export const exportToCSV = (
  activeModule: string,
  reportColumns: string[],
  reportData: ReportRow[]
) => {
  const module = MODULES.find((m) => m.id === activeModule);
  const header = reportColumns.join(",");
  const rows = reportData.map((row) =>
    reportColumns
      .map((col) => {
        const v = String(cellValue(row, col) ?? "");
        return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      })
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportFileName(module?.label || "report")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToExcel = (
  activeModule: string,
  reportColumns: string[],
  reportData: ReportRow[]
) => {
  const module = MODULES.find((m) => m.id === activeModule);
  const aoa = [
    reportColumns,
    ...reportData.map((row) => reportColumns.map((col) => cellValue(row, col) ?? "")),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = reportColumns.map((col) => ({ wch: Math.max(col.length + 2, 10) }));
  const wb = XLSX.utils.book_new();
  const sheetName = (module?.label || "Report").replace(/[\[\]:*?/\\]/g, "").slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${reportFileName(module?.label || "report")}.xlsx`);
};

export const exportToPDF = (
  activeModule: string,
  reportColumns: string[],
  reportData: ReportRow[],
  dateFrom: string,
  dateTo: string,
  isDateScoped: boolean
) => {
  const module = MODULES.find((m) => m.id === activeModule);
  const dateRange =
    isDateScoped && (dateFrom || dateTo) ? ` | ${dateFrom || "—"} to ${dateTo || "—"}` : "";

  const tableRows = reportData
    .map(
      (row) =>
        `<tr>${reportColumns
          .map((col) => {
            const v = cellValue(row, col);
            let val = String(v ?? "—");
            if (
              col.includes("Salary") ||
              col.includes("Pay") ||
              col.includes("Bonus") ||
              col.includes("Deduct") ||
              col === "Amount"
            ) {
              val = `$${Number(v || 0).toLocaleString()}`;
            }
            return `<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#334155">${val}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>${module?.label || "Report"} - HRM_OPS</title><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:24px;color:#0f172a}
    h1{font-size:20px;font-weight:700;margin:0 0 4px 0;color:#1e293b}
    p{font-size:12px;color:#64748b;margin:0 0 16px 0}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th{text-align:left;padding:8px 10px;background:#f1f5f9;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#475569;border-bottom:2px solid #cbd5e1}
    td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#334155}
    tr:nth-child(even){background:#fafafa}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}
    @media print{body{padding:0} @page{size:landscape;margin:12mm}}
  </style></head><body>
    <h1>HRM_OPS — ${module?.label}</h1>
    <p>Generated: ${new Date().toLocaleString("en-US")}${dateRange} · <strong>${reportData.length} records</strong></p>
    <table><thead><tr>${reportColumns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${tableRows}</tbody></table>
    <div class="footer">
      <span>HRM_OPS HRMS · Confidential Report</span>
      <span>${new Date().toLocaleDateString("en-US")}</span>
    </div>
  </body></html>`;

  try {
    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        try {
          win.print();
        } catch (e) {
          console.error("Print error:", e);
        }
      }, 250);
    } else {
      window.print();
    }
  } catch (err) {
    console.error("exportPDF error:", err);
    window.print();
  }
};
