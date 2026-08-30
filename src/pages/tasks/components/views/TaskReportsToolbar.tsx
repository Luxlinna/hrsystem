import { memo } from "react";
import type { Task } from "../../types";
import {
  exportTasksCSV,
  exportTasksXLSX,
  exportTasksPDF,
  exportTasksSVG,
} from "../../taskExportUtils";

interface TaskReportsToolbarProps {
  datePreset: "all" | "today" | "week" | "month" | "custom";
  setDatePreset: (p: "all" | "today" | "week" | "month" | "custom") => void;
  customFrom: string;
  setCustomFrom: (v: string) => void;
  customTo: string;
  setCustomTo: (v: string) => void;
  reportSearch: string;
  setReportSearch: (v: string) => void;
  deptFilter: string;
  setDeptFilter: (v: string) => void;
  departments: string[];
  dateFilteredTasks: Task[];
  totalEmployeesCount: number;
}

export const TaskReportsToolbar = memo(function TaskReportsToolbar({
  datePreset,
  setDatePreset,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  reportSearch,
  setReportSearch,
  deptFilter,
  setDeptFilter,
  departments,
  dateFilteredTasks,
  totalEmployeesCount,
}: TaskReportsToolbarProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date Range:</span>
          {(["all", "today", "week", "month", "custom"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setDatePreset(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                datePreset === p
                  ? "bg-[#253C7D] text-white shadow-2xs"
                  : "bg-gray-100/80 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p === "all" ? "All Time" : p === "week" ? "This Week" : p === "month" ? "This Month" : p}
            </button>
          ))}

          {datePreset === "custom" && (
            <div className="flex items-center gap-1.5 ml-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
              />
              <span className="text-gray-400">&ndash;</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTasksCSV(dateFilteredTasks, "all_workforce_tasks.csv")}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <i className="ri-file-text-line" /> CSV
          </button>
          <button
            onClick={() => exportTasksXLSX(dateFilteredTasks, "all_workforce_tasks.xlsx")}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <i className="ri-file-excel-line" /> Excel
          </button>
          <button
            onClick={() => exportTasksPDF(dateFilteredTasks, "all_workforce_tasks.pdf")}
            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <i className="ri-file-pdf-line" /> PDF
          </button>
          <button
            onClick={() => exportTasksSVG(dateFilteredTasks, "all_workforce_tasks.svg")}
            className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <i className="ri-image-line" /> SVG
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            placeholder="Search staff report by name or department..."
            className="w-full pl-8 pr-3 py-2 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D] transition-colors"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3.5 py-2 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer shrink-0"
        >
          <option value="all">All Departments ({totalEmployeesCount})</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
    </div>
  );
});
