import { memo, useRef, useEffect, useState } from "react";
import { EXPORT_FORMAT_LABEL } from "../constants";

interface ReportsHeaderProps {
  reportDataLength: number;
  exporting: "pdf" | "csv" | "xlsx" | null;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
}

export const ReportsHeader = memo(function ReportsHeader({
  reportDataLength,
  exporting,
  onExportPDF,
  onExportCSV,
  onExportExcel,
}: ReportsHeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close the export dropdown when clicking anywhere outside of it.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Reports &amp; Export Center
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live DB
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Generate, preview, and export HR reports per module</p>
      </div>

      <div className="relative" ref={exportRef}>
        <button
          onClick={() => setExportOpen((v) => !v)}
          disabled={reportDataLength === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#253C7D] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1F336A] shadow-sm transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          {exporting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <i className="ri-download-2-line" />
          )}
          {exporting ? `Exporting ${EXPORT_FORMAT_LABEL[exporting]}...` : "Export"}
          <i
            className={`ri-arrow-down-s-line text-base transition-transform ${
              exportOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {exportOpen && reportDataLength > 0 && (
          <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
            <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Export as
            </p>
            {[
              {
                fmt: "pdf" as const,
                label: "PDF Document",
                hint: ".pdf",
                icon: "ri-file-pdf-line",
                desc: "Print-ready report",
                color: "text-red-500",
                action: onExportPDF,
              },
              {
                fmt: "csv" as const,
                label: "CSV Spreadsheet",
                hint: ".csv",
                icon: "ri-file-text-line",
                desc: "Comma-separated values",
                color: "text-emerald-600",
                action: onExportCSV,
              },
              {
                fmt: "xlsx" as const,
                label: "Excel Workbook",
                hint: ".xlsx",
                icon: "ri-file-excel-2-line",
                desc: "Microsoft Excel format",
                color: "text-green-600",
                action: onExportExcel,
              },
            ].map((opt) => (
              <button
                key={opt.fmt}
                onClick={() => {
                  setExportOpen(false);
                  opt.action();
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
    </div>
  );
});
