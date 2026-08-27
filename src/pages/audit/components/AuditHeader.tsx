import { memo, useRef, useEffect, useState } from "react";
import type { ExportFormat } from "../types";

interface AuditHeaderProps {
  isLive: boolean;
  newCount: number;
  exporting: ExportFormat | null;
  onExport: (format: ExportFormat) => void;
}

export const AuditHeader = memo(function AuditHeader({
  isLive,
  newCount,
  exporting,
  onExport,
}: AuditHeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const exportOptions = [
    { fmt: "pdf" as const, label: "PDF Document", hint: ".pdf", icon: "ri-file-pdf-line", color: "text-red-500" },
    { fmt: "csv" as const, label: "CSV Spreadsheet", hint: ".csv", icon: "ri-file-text-line", color: "text-emerald-600" },
    { fmt: "xlsx" as const, label: "Excel Workbook", hint: ".xlsx", icon: "ri-file-excel-line", color: "text-green-600" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Activity Audit Log
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time tracking of all HR system changes</p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isLive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
          {isLive ? "Live" : "Connecting..."}
        </div>

        {newCount > 0 && (
          <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-medium animate-bounce">
            +{newCount} new
          </span>
        )}

        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#253C7D] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1F336A] shadow-sm transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {exporting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <i className="ri-download-2-line" />
            )}
            {exporting ? `Exporting ${exporting.toUpperCase()}...` : "Export"}
            <i className={`ri-arrow-down-s-line text-base transition-transform ${exportOpen ? "rotate-180" : ""}`} />
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
              <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Export as</p>
              {exportOptions.map((opt) => (
                <button
                  key={opt.fmt}
                  onClick={() => {
                    setExportOpen(false);
                    onExport(opt.fmt);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  <i className={`${opt.icon} text-lg ${opt.color}`} />
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">{opt.label}</p>
                    <p className="text-[11px] text-gray-400">{opt.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
