import { memo, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Employee } from "../../types";
import { exportSingleEmployeePDF, exportSingleEmployeeXLSX } from "../../exportUtils";

interface EmployeeDetailHeaderProps {
  employee?: Employee | null;
  onBack?: () => void;
}

export const EmployeeDetailHeader = memo(function EmployeeDetailHeader({
  employee,
  onBack,
}: EmployeeDetailHeaderProps) {
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/employees");
    }
  };

  const handleExportPDF = useCallback(() => {
    if (!employee) return;
    setExporting("pdf");
    setShowExportMenu(false);
    try {
      exportSingleEmployeePDF(employee);
    } finally {
      setTimeout(() => setExporting(null), 700);
    }
  }, [employee]);

  const handleExportXLSX = useCallback(async () => {
    if (!employee) return;
    setExporting("xlsx");
    setShowExportMenu(false);
    try {
      await exportSingleEmployeeXLSX(employee);
    } finally {
      setTimeout(() => setExporting(null), 700);
    }
  }, [employee]);

  return (
    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-lg sm:text-xl font-normal text-slate-700 dark:text-slate-200 tracking-tight">
          View Employee Detail
        </h1>
        {employee && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {employee.full_name || `${employee.first_name || ""} ${employee.last_name || ""}`} &bull; {employee.employee_code || employee.id.slice(0, 8)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {employee && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[13px] font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer select-none shadow-2xs"
            >
              {exporting ? (
                <span className="w-3.5 h-3.5 border-2 border-[#253C7D] dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="ri-download-2-line text-sm text-[#253C7D] dark:text-sky-400" />
              )}
              <span>{exporting ? "Exporting..." : "Export Profile"}</span>
              <i className={`ri-arrow-down-s-line text-xs text-slate-400 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            {showExportMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Export Employee Form
                </div>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="ri-file-pdf-2-line text-rose-500 text-base" />
                  <div className="flex-1">
                    <div>PDF Form Dossier</div>
                    <div className="text-[10.5px] text-slate-400">Printable A4 Sheet</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleExportXLSX}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="ri-file-excel-2-line text-emerald-600 text-base" />
                  <div className="flex-1">
                    <div>Excel Form Data</div>
                    <div className="text-[10.5px] text-slate-400">.xlsx Full Details</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 text-[13px] font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer select-none shadow-2xs"
        >
          <i className="ri-arrow-left-s-line text-sm" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
});
