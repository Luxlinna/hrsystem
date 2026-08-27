import { useState, useEffect, useRef, useCallback } from "react";
import { exportToCSV, exportToExcel, exportToPDF } from "../exportUtils";
import { EXPORT_FORMAT_LABEL } from "../constants";
import type { ReportRow } from "../types";

interface ExportMenuProps {
  activeModule: string;
  reportColumns: string[];
  reportData: ReportRow[];
  dateFrom: string;
  dateTo: string;
  isDateScoped: boolean;
}

type Format = "pdf" | "csv" | "xlsx";

export function ExportMenu({ activeModule, reportColumns, reportData, dateFrom, dateTo, isDateScoped }: ExportMenuProps) {
  const [exporting, setExporting] = useState<Format | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const runExport = useCallback(
    (fmt: Format) => {
      setExporting(fmt);
      if (fmt === "pdf") exportToPDF(activeModule, reportColumns, reportData, dateFrom, dateTo, isDateScoped);
      else if (fmt === "csv") exportToCSV(activeModule, reportColumns, reportData);
      else exportToExcel(activeModule, reportColumns, reportData);
      setTimeout(() => setExporting(null), 800);
    },
    [activeModule, reportColumns, reportData, dateFrom, dateTo, isDateScoped]
  );

  return (
    <div className="relative" ref={exportRef}>
      <button
        onClick={() => setExportOpen((v) => !v)}
        disabled={reportData.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#253C7D] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1F336A] shadow-sm transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
      >
        {exporting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="ri-download-2-line" />}
        {exporting ? `Exporting ${EXPORT_FORMAT_LABEL[exporting]}...` : "Export"}
        <i className={`ri-arrow-down-s-line text-base transition-transform ${exportOpen ? "rotate-180" : ""}`} />
      </button>

      {exportOpen && reportData.length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
          <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Export as</p>
          {[
            { fmt: "pdf" as Format, label: "PDF Document", hint: ".pdf", icon: "ri-file-pdf-line", desc: "Print-ready report", color: "text-red-500" },
            { fmt: "csv" as Format, label: "CSV Spreadsheet", hint: ".csv", icon: "ri-file-text-line", desc: "Comma-separated values", color: "text-emerald-600" },
            { fmt: "xlsx" as Format, label: "Excel Workbook", hint: ".xlsx", icon: "ri-file-excel-2-line", desc: "Microsoft Excel format", color: "text-green-600" },
          ].map((opt) => (
            <button
              key={opt.fmt}
              onClick={() => {
                setExportOpen(false);
                runExport(opt.fmt);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer group"
            >
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white transition-colors shrink-0">
                <i className={`${opt.icon} text-base ${opt.color}`} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-800">{opt.label}</span>
                <span className="block text-[11px] text-gray-400">{opt.desc}</span>
              </span>
              <span className="text-[11px] text-gray-400 font-mono shrink-0">{opt.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
