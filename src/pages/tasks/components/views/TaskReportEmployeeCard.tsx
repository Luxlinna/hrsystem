import { memo } from "react";
import type { Task, Employee } from "../../types";
import { STATUS_CONFIG } from "../../constants";
import { initials } from "../../taskUtils";
import {
  exportTasksXLSX,
  exportTasksPDF,
} from "../../exportUtils";

export interface EmployeeReportData {
  employee: Employee;
  tasks: Task[];
  total: number;
  done: number;
  inProg: number;
  todo: number;
  outsideWorkCount: number;
  completionRate: number;
}

interface TaskReportEmployeeCardProps {
  rep: EmployeeReportData;
  activeExportMenu: string | null;
  setActiveExportMenu: (id: string | null) => void;
  onSelectTask: (task: Task) => void;
}

export const TaskReportEmployeeCard = memo(function TaskReportEmployeeCard({
  rep,
  activeExportMenu,
  setActiveExportMenu,
  onSelectTask,
}: TaskReportEmployeeCardProps) {
  const { employee: emp, tasks: empTasks, total, done, inProg, todo, outsideWorkCount, completionRate } = rep;
  const empName = `${emp.first_name} ${emp.last_name}`;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-4 hover:border-gray-300 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {emp.avatar_url ? (
            <img src={emp.avatar_url} alt={empName} className="w-10 h-10 rounded-2xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-[#253C7D] text-white font-bold flex items-center justify-center text-xs">
              {initials(empName)}
            </div>
          )}
          <div>
            <h3 className="font-extrabold text-sm text-gray-900">{empName}</h3>
            <p className="text-[11px] text-gray-400 font-semibold">{emp.department || "No Department"} &bull; {emp.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setActiveExportMenu(activeExportMenu === emp.id ? null : emp.id)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="ri-download-2-line text-xs" /> Export Staff Report
          </button>

          {activeExportMenu === emp.id && (
            <div className="absolute right-0 top-9 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 z-30 space-y-1 animate-in zoom-in-95 duration-100">
              <button
                onClick={() => { exportTasksXLSX(empTasks, `${empName}_tasks.xlsx`); setActiveExportMenu(null); }}
                className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="ri-file-excel-line" /> Excel
              </button>
              <button
                onClick={() => { exportTasksPDF(empTasks, `${empName}_tasks.pdf`, empName); setActiveExportMenu(null); }}
                className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="ri-file-pdf-line" /> PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned</span>
          <span className="text-base font-extrabold text-gray-900 mt-0.5 block">{total}</span>
        </div>
        <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-center">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Done</span>
          <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">{done}</span>
        </div>
        <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-center">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">In Progress</span>
          <span className="text-base font-extrabold text-blue-700 mt-0.5 block">{inProg}</span>
        </div>
        <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 text-center">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">To Do</span>
          <span className="text-base font-extrabold text-amber-700 mt-0.5 block">{todo}</span>
        </div>
        <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Field Work</span>
          <span className="text-base font-extrabold text-indigo-700 mt-0.5 block">{outsideWorkCount}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
          <span className="text-gray-500">Completion Rate</span>
          <span className={completionRate >= 80 ? "text-emerald-600" : completionRate >= 50 ? "text-blue-600" : "text-amber-600"}>{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className="bg-[#253C7D] h-full rounded-full transition-all duration-300" style={{ width: `${completionRate}%` }} />
        </div>
      </div>

      {empTasks.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Tasks</h4>
          <div className="space-y-1.5">
            {empTasks.slice(0, 3).map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-xs"
              >
                <span className="font-semibold text-gray-800 truncate pr-2">{t.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${STATUS_CONFIG[t.status].badge}`}>
                  {STATUS_CONFIG[t.status].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
