import { memo, useState, useEffect, useRef, useCallback } from "react";
import type { EmployeeMovement } from "../types";
import { exportMovementsPDF, exportMovementsXLSX } from "../exports";

interface MovementsExportMenuProps {
  movements: EmployeeMovement[];
  disabled?: boolean;
}

type Format = "pdf" | "xlsx";

export const MovementsExportMenu = memo(function MovementsExportMenu({
  movements,
  disabled = false,
}: MovementsExportMenuProps) {
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
          exportMovementsPDF(movements);
        } else if (fmt === "xlsx") {
          await exportMovementsXLSX(movements);
        }
      } finally {
        setTimeout(() => setExporting(null), 700);
      }
    },
    [movements]
  );

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          open
            ? "border-[#253C7D] dark:border-blue-400 text-[#253C7D] dark:text-blue-300 bg-[#253C7D]/5 dark:bg-slate-800"
            : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
      >
        <i className="ri-download-2-line text-xs text-[#253C7D] dark:text-blue-400" />
        <span>{exporting ? `Exporting ${exporting.toUpperCase()}...` : "Export"}</span>
        <i
          className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => handleExport("xlsx")}
            className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
            <div className="flex flex-col">
              <span className="font-medium">Excel (.xlsx)</span>
              <span className="text-[10px] text-slate-400">Current table format</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-700/50"
          >
            <i className="ri-file-pdf-2-line text-rose-600 text-sm" />
            <div className="flex flex-col">
              <span className="font-medium">PDF Document</span>
              <span className="text-[10px] text-slate-400">Print-ready document</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
});
