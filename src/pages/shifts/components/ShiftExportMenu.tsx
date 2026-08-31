import { memo, useState, useEffect, useRef, useCallback } from "react";
import type { Shift, ShiftAssignment } from "../types";
import { exportShiftsPDF, exportShiftsXLSX, exportShiftsCSV } from "../exportUtils";

interface ShiftExportMenuProps {
  filteredShifts: Shift[];
  assignments: ShiftAssignment[];
  currentDate: Date;
  disabled?: boolean;
}

type Format = "pdf" | "xlsx" | "csv";

export const ShiftExportMenu = memo(function ShiftExportMenu({
  filteredShifts,
  assignments,
  currentDate,
  disabled = false,
}: ShiftExportMenuProps) {
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
        if (fmt === "pdf") {
          exportShiftsPDF(filteredShifts, assignments);
        } else if (fmt === "xlsx") {
          await exportShiftsXLSX(filteredShifts, assignments, currentDate);
        } else if (fmt === "csv") {
          exportShiftsCSV(filteredShifts, assignments, currentDate);
        }
      } finally {
        setTimeout(() => setExporting(null), 700);
      }
    },
    [filteredShifts, assignments, currentDate]
  );

  const exportOptions = [
    {
      fmt: "pdf" as Format,
      label: "PDF Schedule Report",
      ext: ".pdf",
      desc: "Print-ready shift roster & staffing KPIs",
      icon: "ri-file-pdf-line",
      color: "text-rose-600 bg-rose-50 group-hover:bg-rose-100",
    },
    {
      fmt: "xlsx" as Format,
      label: "Excel Spreadsheet",
      ext: ".xlsx",
      desc: "Structured shift planning workbook",
      icon: "ri-file-excel-2-line",
      color: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100",
    },
    {
      fmt: "csv" as Format,
      label: "CSV Schedule",
      ext: ".csv",
      desc: "Raw comma-separated shifts data",
      icon: "ri-file-text-line",
      color: "text-blue-600 bg-blue-50 group-hover:bg-blue-100",
    },
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled || filteredShifts.length === 0}
        className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer shadow-2xs active:scale-98 disabled:opacity-50"
      >
        {exporting ? (
          <span className="w-3.5 h-3.5 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        ) : (
          <i className="ri-download-2-line text-xs text-[#253C7D]" />
        )}
        <span>{exporting ? "Exporting..." : "Export"}</span>
        <i className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && filteredShifts.length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-gray-100 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              Export Format
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              {filteredShifts.length} shifts
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
