import { memo, useState, useEffect, useRef, useCallback } from "react";
import type { Offboarding, EnrichedOffboardingTask } from "../types";
import {
  exportOffboardingsPDF,
  exportOffboardingsXLSX,
  exportOffboardingsCSV,
  exportOffboardTasksPDF,
  exportOffboardTasksXLSX,
  exportOffboardTasksCSV,
} from "../exportUtils";

interface OffboardExportMenuProps {
  tab: "active" | "completed" | "tasks" | "analytics";
  offboardings: Offboarding[];
  tasks: EnrichedOffboardingTask[];
  disabled?: boolean;
}

type Format = "pdf" | "xlsx" | "csv";

export const OffboardExportMenu = memo(function OffboardExportMenu({
  tab,
  offboardings,
  tasks,
  disabled = false,
}: OffboardExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<Format | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = useCallback(
    async (fmt: Format) => {
      setExporting(fmt);
      setOpen(false);
      try {
        if (tab === "tasks") {
          if (fmt === "pdf") exportOffboardTasksPDF(tasks);
          else if (fmt === "xlsx") await exportOffboardTasksXLSX(tasks);
          else if (fmt === "csv") exportOffboardTasksCSV(tasks);
        } else {
          // Departures (active, completed, analytics)
          if (fmt === "pdf") exportOffboardingsPDF(offboardings);
          else if (fmt === "xlsx") await exportOffboardingsXLSX(offboardings);
          else if (fmt === "csv") exportOffboardingsCSV(offboardings);
        }
      } finally {
        setTimeout(() => setExporting(null), 700);
      }
    },
    [tab, offboardings, tasks]
  );

  const getRecordCount = () => {
    if (tab === "tasks") {
      return `${tasks.length} clearance tasks`;
    }
    return `${offboardings.length} departure records`;
  };

  const getScopeLabel = () => {
    if (tab === "tasks") return "Clearance Tasks";
    if (tab === "completed") return "Completed Departures";
    if (tab === "active") return "Active Offboardings";
    return "Offboarding Log";
  };

  const exportOptions = [
    {
      fmt: "pdf" as Format,
      label: `PDF ${getScopeLabel()} Report`,
      ext: ".pdf",
      desc: "Print-ready document with metrics & summary",
      icon: "ri-file-pdf-line",
      color: "text-rose-600 bg-rose-50 group-hover:bg-rose-100",
    },
    {
      fmt: "xlsx" as Format,
      label: `Excel ${getScopeLabel()} Workbook`,
      ext: ".xlsx",
      desc: "Detailed multi-column departure spreadsheet",
      icon: "ri-file-excel-2-line",
      color: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100",
    },
    {
      fmt: "csv" as Format,
      label: `CSV ${getScopeLabel()} Data`,
      ext: ".csv",
      desc: "Raw comma-separated departure data file",
      icon: "ri-file-text-line",
      color: "text-blue-600 bg-blue-50 group-hover:bg-blue-100",
    },
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200/90 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-98 whitespace-nowrap"
      >
        {exporting ? (
          <span className="w-3.5 h-3.5 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        ) : (
          <i className="ri-download-2-line text-sm text-[#253C7D]" />
        )}
        <span>{exporting ? "Exporting..." : "Export"}</span>
        <i className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-gray-100 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              {getScopeLabel()}
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              {getRecordCount()}
            </span>
          </div>

          <div className="space-y-0.5">
            {exportOptions.map((opt) => (
              <button
                key={opt.fmt}
                type="button"
                onClick={() => handleExport(opt.fmt)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors ${opt.color}`}
                >
                  <i className={opt.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 group-hover:text-[#253C7D] transition-colors truncate">
                      {opt.label}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 ml-1">
                      {opt.ext}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                    {opt.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
