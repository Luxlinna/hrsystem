import { memo, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "../types";
import {
  exportSelfPayslipsPDF,
  exportSelfPayslipsXLSX,
  exportSelfPayslipsCSV,
  exportSelfLeavePDF,
  exportSelfLeaveXLSX,
  exportSelfLeaveCSV,
  exportSelfAttendancePDF,
  exportSelfAttendanceXLSX,
  exportSelfAttendanceCSV,
  exportSelfWorkOutsidePDF,
  exportSelfWorkOutsideXLSX,
  exportSelfWorkOutsideCSV,
  exportSelfDailyReportsPDF,
  exportSelfDailyReportsXLSX,
  exportSelfDailyReportsCSV,
  exportSelfBenefitsPDF,
  exportSelfBenefitsXLSX,
  exportSelfBenefitsCSV,
} from "../exportUtils";

interface SelfServiceExportMenuProps {
  activeTab: string;
  employee: Employee | null;
  disabled?: boolean;
}

type Format = "pdf" | "xlsx" | "csv";

export const SelfServiceExportMenu = memo(function SelfServiceExportMenu({
  activeTab,
  employee,
  disabled = false,
}: SelfServiceExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<Format | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getScopeLabel = () => {
    switch (activeTab) {
      case "payslips":
        return "Payslips History";
      case "leave":
        return "Leave Requests";
      case "attendance":
      case "checkin":
        return "Attendance Records";
      case "work-outside":
        return "Outside Work Tasks";
      case "daily-report":
        return "Daily Work Reports";
      case "benefits":
        return "Benefits Coverage";
      default:
        return "Self-Service Records";
    }
  };

  const scopeLabel = getScopeLabel();

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
      if (!employee?.id) return;
      setExporting(fmt);
      setOpen(false);
      try {
        if (activeTab === "payslips") {
          const { data } = await supabase
            .from("payroll_records")
            .select("id, month, base_salary, bonus, deductions, net_pay, status")
            .eq("employee_id", employee.id)
            .order("month", { ascending: false });
          const list = (data as any[]) || [];
          if (fmt === "pdf") exportSelfPayslipsPDF(list, employee);
          else if (fmt === "xlsx") await exportSelfPayslipsXLSX(list, employee);
          else if (fmt === "csv") exportSelfPayslipsCSV(list, employee);
        } else if (activeTab === "leave") {
          const { data } = await supabase
            .from("leave_requests")
            .select("id, leave_type, start_date, end_date, days, status, reason, created_at")
            .eq("employee_id", employee.id)
            .order("created_at", { ascending: false });
          const list = (data as any[]) || [];
          if (fmt === "pdf") exportSelfLeavePDF(list, employee);
          else if (fmt === "xlsx") await exportSelfLeaveXLSX(list, employee);
          else if (fmt === "csv") exportSelfLeaveCSV(list, employee);
        } else if (activeTab === "attendance" || activeTab === "checkin") {
          const { data } = await supabase
            .from("attendance_records")
            .select("id, employee_id, date, clock_in, clock_out, status, late_minutes, early_leave_minutes, hours_worked, notes, created_at")
            .eq("employee_id", employee.id)
            .order("date", { ascending: false });
          const list = (data as any[]) || [];
          if (fmt === "pdf") exportSelfAttendancePDF(list, employee);
          else if (fmt === "xlsx") await exportSelfAttendanceXLSX(list, employee);
          else if (fmt === "csv") exportSelfAttendanceCSV(list, employee);
        } else if (activeTab === "work-outside") {
          const { data } = await supabase
            .from("tasks")
            .select("id, title, due_date, work_status, work_checked_in_at, work_checked_out_at, work_address")
            .eq("assigned_to", employee.id)
            .eq("is_outside_work", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });
          const list = (data as any[]) || [];
          if (fmt === "pdf") exportSelfWorkOutsidePDF(list, employee);
          else if (fmt === "xlsx") await exportSelfWorkOutsideXLSX(list, employee);
          else if (fmt === "csv") exportSelfWorkOutsideCSV(list, employee);
        } else if (activeTab === "daily-report") {
          const { data } = await supabase
            .from("work_logs")
            .select("id, log_date, start_time, end_time, activity, notes")
            .eq("employee_id", employee.id)
            .order("log_date", { ascending: false });
          const list = (data as any[]) || [];
          if (fmt === "pdf") exportSelfDailyReportsPDF(list, employee);
          else if (fmt === "xlsx") await exportSelfDailyReportsXLSX(list, employee);
          else if (fmt === "csv") exportSelfDailyReportsCSV(list, employee);
        } else if (activeTab === "benefits") {
          const { data } = await supabase
            .from("benefit_enrollments")
            .select("id, status, created_at, plan_id, benefit_plans(name, type, provider, description, coverage_amount, employee_contribution)")
            .eq("employee_id", employee.id)
            .order("created_at", { ascending: false });
          const list = (data as any[]) || [];
          if (fmt === "pdf") exportSelfBenefitsPDF(list, employee);
          else if (fmt === "xlsx") await exportSelfBenefitsXLSX(list, employee);
          else if (fmt === "csv") exportSelfBenefitsCSV(list, employee);
        }
      } finally {
        setTimeout(() => setExporting(null), 700);
      }
    },
    [activeTab, employee]
  );

  const exportOptions = [
    {
      fmt: "pdf" as Format,
      label: `PDF ${scopeLabel} Report`,
      ext: ".pdf",
      desc: "Print-ready document with employee headers & metrics",
      icon: "ri-file-pdf-line",
      color: "text-rose-600 bg-rose-50 group-hover:bg-rose-100",
    },
    {
      fmt: "xlsx" as Format,
      label: `Excel ${scopeLabel} Sheet`,
      ext: ".xlsx",
      desc: "Structured spreadsheet workbook for personal records",
      icon: "ri-file-excel-2-line",
      color: "text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100",
    },
    {
      fmt: "csv" as Format,
      label: `CSV ${scopeLabel} Data`,
      ext: ".csv",
      desc: "Raw comma-separated table export",
      icon: "ri-file-text-line",
      color: "text-blue-600 bg-blue-50 group-hover:bg-blue-100",
    },
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled || !employee}
        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200/80 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-98 whitespace-nowrap"
      >
        {exporting ? (
          <span className="w-3.5 h-3.5 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        ) : (
          <i className="ri-download-2-line text-sm text-[#253C7D]" />
        )}
        <span>{exporting ? "Exporting..." : `Export ${scopeLabel}`}</span>
        <i className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-gray-100 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              {scopeLabel}
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              Personal Record
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
