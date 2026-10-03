import { useState, useCallback } from "react";
import type { AnalyticsTabKey, ExportFormat } from "../types";

const getXLSX = () => import("xlsx");

interface UseAnalyticsExportProps {
  activeTab: AnalyticsTabKey;
  deptDistribution: { name: string; value: number }[];
  expenseByCategory: { name: string; value: number }[];
  itAssetsByType: { name: string; value: number }[];
}

export function useAnalyticsExport({
  activeTab,
  deptDistribution,
  expenseByCategory,
  itAssetsByType,
}: UseAnalyticsExportProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const getExportData = useCallback((): { data: Record<string, string | number>[]; filename: string; title: string } => {
    if (activeTab === "overview") {
      return { data: deptDistribution.map((d) => ({ Department: d.name, "Employee Count": d.value })), filename: "workforce-overview", title: "Workforce Overview" };
    } else if (activeTab === "finance") {
      return { data: expenseByCategory.map((d) => ({ Category: d.name, "Total Amount": d.value })), filename: "finance-by-category", title: "Finance by Category" };
    } else if (activeTab === "it") {
      return { data: itAssetsByType.map((d) => ({ "Asset Type": d.name, Count: d.value })), filename: "it-assets", title: "IT Assets" };
    }
    return { data: [], filename: "analytics-export", title: "Analytics Export" };
  }, [activeTab, deptDistribution, expenseByCategory, itAssetsByType]);

  const exportCSV = useCallback(() => {
    setExporting("csv");
    const { data, filename } = getExportData();
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = [headers.join(","), ...data.map((r) => headers.map((h) => `"${r[h]}"`).join(","))];
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setTimeout(() => setExporting(null), 800);
  }, [getExportData]);

  const exportExcel = useCallback(async () => {
    setExporting("xlsx");
    const { data, filename, title } = getExportData();
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const aoa = [headers, ...data.map((r) => headers.map((h) => r[h]))];
      const XLSX = await getXLSX();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = headers.map((col) => ({ wch: Math.max(col.length + 2, 10) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
    setTimeout(() => setExporting(null), 800);
  }, [getExportData]);

  const exportPDF = useCallback(() => {
    setExporting("pdf");
    const { data, title } = getExportData();
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const tableRows = data.map((row) =>
        `<tr>${headers.map((h) => `<td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px">${row[h]}</td>`).join("")}</tr>`
      ).join("");
      const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
        body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
        h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:20px}
        table{width:100%;border-collapse:collapse}
        th{text-align:left;padding:8px 10px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#666}
        td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
        .footer{margin-top:20px;font-size:10px;color:#999;text-align:right}
        @media print{body{padding:0}}
      </style></head><body>
        <h1>HRM_OPS — ${title}</h1>
        <p>Generated: ${new Date().toLocaleString("en-US")} · ${data.length} records</p>
        <table><thead><tr>${headers.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${tableRows}</tbody></table>
        <div class="footer">HRM_OPS HRMS · Confidential</div>
      </body></html>`;
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.onload = () => { win.print(); };
      }
    }
    setTimeout(() => setExporting(null), 800);
  }, [getExportData]);

  const handleExport = useCallback((fmt: ExportFormat) => {
    if (fmt === "pdf") exportPDF();
    else if (fmt === "csv") exportCSV();
    else exportExcel();
  }, [exportPDF, exportCSV, exportExcel]);

  return {
    exporting,
    exportOpen,
    setExportOpen,
    handleExport,
  };
}
