import React, { useState, useRef, useEffect } from "react";
import type { EmployeeMovement } from "../types";
import { exportMovementsXLSX, exportMovementsCSV, exportMovementsPDF } from "../exports";

interface MovementsHeaderProps {
  movements: EmployeeMovement[];
  onOpenRecordModal: () => void;
}

export const MovementsHeader: React.FC<MovementsHeaderProps> = ({
  movements,
  onOpenRecordModal,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: "xlsx" | "pdf" | "csv") => {
    setExporting(format);
    setExportOpen(false);
    try {
      if (format === "xlsx") {
        await exportMovementsXLSX(movements);
      } else if (format === "pdf") {
        exportMovementsPDF(movements);
      } else if (format === "csv") {
        exportMovementsCSV(movements);
      }
    } finally {
      setTimeout(() => setExporting(null), 500);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#253C7D] to-[#29ABE2] flex items-center justify-center text-white shadow-md shadow-[#253C7D]/20 shrink-0">
          <i className="ri-route-line text-xl" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Employee Movements
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-[#253C7D] dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Personnel Actions
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track probation, promotions, transfers, salary adjustments, and contract renewals
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Export Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm transition-all"
          >
            {exporting ? (
              <>
                <i className="ri-loader-4-line animate-spin text-sm" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <i className="ri-download-2-line text-sm text-gray-500" />
                <span>Export</span>
                <i className="ri-arrow-down-s-line text-xs text-gray-400" />
              </>
            )}
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in-50">
              <button
                onClick={() => handleExport("xlsx")}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
              >
                <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <i className="ri-file-excel-2-line text-sm" />
                </div>
                <div>
                  <div className="font-semibold">Excel Workbook</div>
                  <div className="text-[10px] text-gray-400">.xlsx format</div>
                </div>
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
              >
                <div className="w-6 h-6 rounded bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <i className="ri-file-pdf-line text-sm" />
                </div>
                <div>
                  <div className="font-semibold">Printable PDF</div>
                  <div className="text-[10px] text-gray-400">Audit report view</div>
                </div>
              </button>
              <button
                onClick={() => handleExport("csv")}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
              >
                <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <i className="ri-file-text-line text-sm" />
                </div>
                <div>
                  <div className="font-semibold">CSV Dataset</div>
                  <div className="text-[10px] text-gray-400">Raw tabular data</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Record Movement Action */}
        <button
          onClick={onOpenRecordModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#253C7D] hover:bg-[#1f3166] text-white shadow-sm hover:shadow transition-all"
        >
          <i className="ri-add-line text-sm" />
          <span>Record Movement</span>
        </button>
      </div>
    </div>
  );
};
