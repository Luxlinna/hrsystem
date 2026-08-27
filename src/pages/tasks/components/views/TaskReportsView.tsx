import { memo, useState, useMemo } from "react";
import type { Task, Employee } from "../../types";
import { STATUS_CONFIG } from "../../constants";
import { initials } from "../../taskUtils";
import {
  exportTasksCSV,
  exportTasksXLSX,
  exportTasksPDF,
  exportTasksSVG,
} from "../../taskExportUtils";

interface TaskReportsViewProps {
  tasks: Task[];
  employees: Employee[];
  onSelectTask: (task: Task) => void;
}

export const TaskReportsView = memo(function TaskReportsView({
  tasks,
  employees,
  onSelectTask,
}: TaskReportsViewProps) {
  const [reportSearch, setReportSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activeExportMenu, setActiveExportMenu] = useState<string | null>(null);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.department && set.add(e.department));
    return Array.from(set).sort();
  }, [employees]);

  // Date filtering
  const dateFilteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    return tasks.filter((t) => {
      const taskDate = t.due_date || t.created_at.slice(0, 10);
      if (datePreset === "today") return taskDate === todayStr;
      if (datePreset === "week") {
        const diff = (now.getTime() - new Date(taskDate).getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7;
      }
      if (datePreset === "month") {
        return taskDate.startsWith(todayStr.slice(0, 7));
      }
      if (datePreset === "custom") {
        if (customFrom && taskDate < customFrom) return false;
        if (customTo && taskDate > customTo) return false;
      }
      return true;
    });
  }, [tasks, datePreset, customFrom, customTo]);

  // Group tasks by employee
  const employeeReports = useMemo(() => {
    return employees
      .filter((e) => {
        if (deptFilter !== "all" && e.department !== deptFilter) return false;
        if (reportSearch.trim()) {
          const q = reportSearch.toLowerCase().trim();
          const name = `${e.first_name} ${e.last_name}`.toLowerCase();
          const dept = (e.department || "").toLowerCase();
          return name.includes(q) || dept.includes(q);
        }
        return true;
      })
      .map((emp) => {
        const empTasks = dateFilteredTasks.filter((t) => t.assigned_to === emp.id);
        const done = empTasks.filter((t) => t.status === "done").length;
        const inProg = empTasks.filter((t) => t.status === "in_progress").length;
        const todo = empTasks.filter((t) => t.status === "todo").length;
        const outsideWorkCount = empTasks.filter((t) => t.is_outside_work).length;

        return {
          employee: emp,
          tasks: empTasks,
          total: empTasks.length,
          done,
          inProg,
          todo,
          outsideWorkCount,
          completionRate: empTasks.length > 0 ? Math.round((done / empTasks.length) * 100) : 0,
        };
      })
      .filter((r) => r.tasks.length > 0 || !reportSearch.trim());
  }, [employees, dateFilteredTasks, deptFilter, reportSearch]);

  return (
    <div className="space-y-5">
      {/* Top Filter and Global Export Toolbar */}
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

          {/* Global Exports */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportTasksCSV(dateFilteredTasks, "all_workforce_tasks.csv")}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <i className="ri-file-text-line" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportTasksXLSX(dateFilteredTasks, "all_workforce_tasks.xlsx")}
              className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <i className="ri-file-excel-2-line" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => exportTasksPDF(dateFilteredTasks, "Workforce Task & Field Work Report")}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <i className="ri-file-pdf-line" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => exportTasksSVG(dateFilteredTasks, "task_distribution_chart.svg")}
              className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <i className="ri-pie-chart-line" />
              <span>SVG Chart</span>
            </button>
          </div>
        </div>

        {/* Search & Department Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-gray-100">
          <div className="relative flex-1 w-full">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              placeholder="Filter by staff name or department..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Breakdown Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employeeReports.map((rep) => {
          const emp = rep.employee;
          const empName = `${emp.first_name} ${emp.last_name}`;

          return (
            <div
              key={emp.id}
              className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Employee Header */}
                <div className="p-4 bg-slate-50/80 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {emp.avatar_url ? (
                      <img
                        src={emp.avatar_url}
                        alt={empName}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#253C7D] text-white text-xs font-bold flex items-center justify-center">
                        {initials(empName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{empName}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{emp.department || "Staff"}</p>
                    </div>
                  </div>

                  {/* Individual Staff Export Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveExportMenu(activeExportMenu === emp.id ? null : emp.id)}
                      className="p-1.5 bg-[#253C7D] text-white rounded-xl hover:bg-[#1E3064] transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Export staff tasks"
                    >
                      <i className="ri-download-2-line" />
                    </button>

                    {activeExportMenu === emp.id && (
                      <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-2xl border border-gray-200 shadow-xl z-30 py-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-xs font-bold">
                        <button
                          onClick={() => {
                            exportTasksCSV(rep.tasks, `${emp.first_name}_tasks.csv`);
                            setActiveExportMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 cursor-pointer"
                        >
                          <i className="ri-file-text-line text-emerald-600" /> CSV
                        </button>
                        <button
                          onClick={() => {
                            exportTasksXLSX(rep.tasks, `${emp.first_name}_tasks.xlsx`);
                            setActiveExportMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 cursor-pointer"
                        >
                          <i className="ri-file-excel-2-line text-green-600" /> Excel
                        </button>
                        <button
                          onClick={() => {
                            exportTasksPDF(rep.tasks, `${empName} - Task Report`);
                            setActiveExportMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 cursor-pointer"
                        >
                          <i className="ri-file-pdf-line text-rose-600" /> PDF
                        </button>
                        <button
                          onClick={() => {
                            exportTasksSVG(rep.tasks, `${emp.first_name}_chart.svg`);
                            setActiveExportMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2 cursor-pointer"
                        >
                          <i className="ri-pie-chart-line text-sky-600" /> SVG Chart
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Metric Strip */}
                <div className="px-4 py-2 bg-gray-50/40 border-b border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500">
                  <span>{rep.total} tasks &middot; {rep.outsideWorkCount} outside work</span>
                  <span className="text-emerald-700 font-bold">{rep.completionRate}% complete</span>
                </div>

                {/* Tasks List */}
                <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                  {rep.tasks.map((t) => {
                    const st = STATUS_CONFIG[t.status];
                    return (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        className="p-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <i className={`${st?.icon || "ri-checkbox-blank-circle-line"} text-sm`} style={{ color: st?.accent }} />
                          <span className={`text-xs font-semibold truncate ${t.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>
                            {t.title}
                          </span>
                        </div>
                        {t.is_outside_work && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-50 text-[#253C7D] border border-blue-200 shrink-0">
                            GPS Field
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {rep.tasks.length === 0 && (
                    <p className="p-4 text-xs text-gray-400 text-center italic">No tasks in this time period.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
