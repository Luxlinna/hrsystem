import { memo, useRef, useEffect } from "react";
import type { ExportFormat } from "../types";
import { EXPORT_OPTIONS } from "../constants";

interface AnalyticsHeaderProps {
  department: string;
  setDepartment: (dept: string) => void;
  departments: string[];
  exporting: ExportFormat | null;
  exportOpen: boolean;
  setExportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onExport: (format: ExportFormat) => void;
}

export const AnalyticsHeader = memo(function AnalyticsHeader({
  department,
  setDepartment,
  departments,
  exporting,
  exportOpen,
  setExportOpen,
  onExport,
}: AnalyticsHeaderProps) {
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [setExportOpen]);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Analytics Dashboard</h1>
        <p className="text-[13px] text-gray-500 mt-1">Real-time insights across all HR modules</p>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] bg-white"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
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
            <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
              <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Export as</p>
              {EXPORT_OPTIONS.map((opt) => (
                <button
                  key={opt.fmt}
                  onClick={() => {
                    setExportOpen(false);
                    onExport(opt.fmt);
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
    </div>
  );
});
