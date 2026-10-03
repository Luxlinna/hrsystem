import { memo, useState, useEffect, useRef, useCallback } from "react";
import type { PayrollRecord } from "../types";
import { formatMonthLabel } from "../payrollUtils";
import {
  exportPayrollPDF,
  exportPayrollXLSX,
  exportPayrollCSV,
} from "../exportUtils";

interface PayrollExportMenuProps {
  records: PayrollRecord[];
  periodMode: "month" | "all";
  selectedMonth: string;
  disabled?: boolean;
}

type Format = "pdf" | "xlsx" | "csv";

export const PayrollExportMenu = memo(function PayrollExportMenu({
  records,
  periodMode,
  selectedMonth,
  disabled = false,
}: PayrollExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<Format | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const periodLabel = periodMode === "month" ? formatMonthLabel(selectedMonth) : "All Historical Periods";

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
        if (fmt === "pdf") exportPayrollPDF(records, periodLabel);
        else if (fmt === "xlsx") await exportPayrollXLSX(records, periodMode, selectedMonth);
        else if (fmt === "csv") exportPayrollCSV(records, periodMode, selectedMonth);
      } finally {
        setTimeout(() => setExporting(null), 700);
      }
    },
    [records, periodMode, selectedMonth, periodLabel]
  );

  const exportOptions = [
    {
      fmt: "pdf" as Format,
      label: "PDF Compensation Summary",
      ext: ".pdf",
      desc: "Print-ready summary report with base, bonuses & net pay",
      icon: "ri-file-pdf-line",
      color: "text-rose-600 bg-rose-50 group-hover:bg-rose-100",
    },
    {
      fmt: "xlsx" as Format,
      label: "Excel Payroll Sheet",
      ext: ".xlsx",
      desc: "Multi-column structured financial workbook",
      icon: "ri-file-excel-2-line",
      color: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100",
    },
    {
      fmt: "csv" as Format,
      label: "CSV Payroll Data",
      ext: ".csv",
      desc: "Raw comma-separated financial records file",
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
        className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200/80 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-98 whitespace-nowrap"
      >
        {exporting ? (
          <span className="w-3.5 h-3.5 border-2 border-[#253C7D] dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <i className="ri-download-2-line text-sm text-[#253C7D] dark:text-sky-400" />
        )}
        <span>{exporting ? "Exporting..." : "Export"}</span>
        <i className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-gray-100 dark:border-slate-800 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {periodLabel}
            </span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
              {records.length} records
            </span>
          </div>

          <div className="space-y-0.5">
            {exportOptions.map((opt) => (
              <button
                key={opt.fmt}
                type="button"
                onClick={() => handleExport(opt.fmt)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer group"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors ${opt.color}`}
                >
                  <i className={opt.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 group-hover:text-[#253C7D] dark:group-hover:text-sky-400 transition-colors truncate">
                      {opt.label}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 ml-1">
                      {opt.ext}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium truncate mt-0.5">
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
