import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { STATUS_CONFIG, formatTime, calcHours, initials } from "../constants";

interface AttendanceTableViewProps {
  records: AttendanceRecord[];
  todayYMD: string;
  canManage: boolean;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
}

export const AttendanceTableView = memo(function AttendanceTableView({
  records,
  todayYMD,
  canManage,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
}: AttendanceTableViewProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Department</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Check In</th>
              <th className="px-5 py-3.5">Check Out</th>
              <th className="px-5 py-3.5">Total Hours</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Notes</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r) => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.ontime || STATUS_CONFIG.present;
              const emp = r.employees;
              const isWorkingNow = r.clock_in && !r.clock_out && r.date === todayYMD;

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectRecord(r)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                        {emp?.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials(emp?.first_name, emp?.last_name)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                          {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                        </p>
                        <p className="text-[11px] text-gray-400">{emp?.role || "Team Member"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                      {emp?.department || "General"}
                    </span>
                    {emp?.branches?.name && <span className="text-gray-400 block text-[10px] mt-0.5">{emp.branches.name}</span>}
                    {r.work_location?.name && (
                      <span className={`flex items-center gap-1 text-[10px] font-semibold mt-0.5 ${r.work_location_id !== emp?.default_work_location_id ? "text-amber-600" : "text-emerald-600"}`}>
                        <i className="ri-building-2-line" />
                        {r.work_location.name}
                        {r.work_location_id !== emp?.default_work_location_id && emp?.default_work_location_id && (
                          <span className="ml-0.5 px-1 py-px bg-amber-100 text-amber-700 rounded text-[9px] font-bold">Visiting</span>
                        )}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                    {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800">{formatTime(r.clock_in)}</td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {isWorkingNow ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[10px] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        Working Now
                      </span>
                    ) : (
                      <span className="font-bold text-gray-800">{formatTime(r.clock_out)}</span>
                    )}
                    {r.early_leave_minutes && r.early_leave_minutes > 0 ? (
                      <span className="block text-[10px] font-semibold text-amber-600">({r.early_leave_minutes}m early)</span>
                    ) : null}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-extrabold text-[#253C7D]">
                    {calcHours(r.clock_in, r.clock_out)}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      <i className={cfg.icon} />
                      {cfg.label}
                      {r.status === "late" && r.late_minutes && r.late_minutes > 0 ? ` (${r.late_minutes}m)` : ""}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate">{r.notes || "—"}</td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditRecord(r)}
                            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#253C7D] transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(r.id)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectRecord(r)}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <i className="ri-arrow-right-s-line text-base" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
