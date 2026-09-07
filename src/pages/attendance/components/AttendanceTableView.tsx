import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { STATUS_CONFIG, formatTime, calcHours, initials } from "../constants";

interface AttendanceTableViewProps {
  records: AttendanceRecord[];
  todayYMD: string;
  canManage: boolean;
  isFourPunchMode?: boolean;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
}

export const AttendanceTableView = memo(function AttendanceTableView({
  records,
  todayYMD,
  canManage,
  isFourPunchMode = false,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
}: AttendanceTableViewProps) {

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
      {isFourPunchMode && (
        <div className="px-5 py-2.5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border-b border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200/70 dark:border-indigo-800/60 shadow-2xs">
              <i className="ri-time-line text-xs text-indigo-600 dark:text-indigo-400" />
              4-Punch Multi-Session Shift Active
            </span>
            <span className="text-gray-400 dark:text-slate-400 text-[11px] hidden sm:inline">
              Morning In · Lunch Out · Lunch In · Evening Out
            </span>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-gray-200/60 dark:border-slate-700">
            {records.length} Record{records.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/90 text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-3.5 whitespace-nowrap">Employee</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Department</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Date</th>

              {isFourPunchMode ? (
                <>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                      <i className="ri-sun-line text-xs" />
                      <span>Morning In</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-400">
                      <i className="ri-restaurant-line text-xs" />
                      <span>Lunch Out</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                      <i className="ri-cup-line text-xs" />
                      <span>Lunch In</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400">
                      <i className="ri-moon-line text-xs" />
                      <span>Evening Out</span>
                    </div>
                  </th>
                </>
              ) : (
                <>
                  <th className="px-5 py-3.5 whitespace-nowrap">Check In</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Check Out</th>
                </>
              )}

              <th className="px-4 py-3.5 text-center whitespace-nowrap">Total Hours</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Notes</th>
              <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {records.map((r) => {
              const emp = r.employees;
              const isToday = r.date === todayYMD;

              // Smart Live Status Calculation
              let statusLabel = "";
              let statusBg = "";
              let statusText = "";
              let statusBorder = "";
              let statusIcon = "";
              let isPulse = false;

              if (isToday) {
                if (isFourPunchMode && r.break_out && !r.break_in) {
                  statusLabel = "Lunch Break";
                  statusBg = "bg-orange-50 dark:bg-orange-950/60";
                  statusText = "text-orange-700 dark:text-orange-300";
                  statusBorder = "border-orange-200 dark:border-orange-800/60";
                  statusIcon = "ri-restaurant-line";
                  isPulse = true;
                } else if (isFourPunchMode && r.break_in && !r.clock_out) {
                  statusLabel = "Working (PM)";
                  statusBg = "bg-sky-50 dark:bg-sky-950/60";
                  statusText = "text-sky-700 dark:text-sky-300";
                  statusBorder = "border-sky-200 dark:border-sky-800/60";
                  statusIcon = "ri-time-line";
                  isPulse = true;
                } else if (r.clock_in && !r.clock_out && (!isFourPunchMode || !r.break_out)) {
                  statusLabel = "Working Now";
                  statusBg = "bg-emerald-50 dark:bg-emerald-950/60";
                  statusText = "text-emerald-700 dark:text-emerald-300";
                  statusBorder = "border-emerald-200 dark:border-emerald-800/60";
                  statusIcon = "ri-time-line";
                  isPulse = true;
                }
              }

              if (!statusLabel) {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.ontime || STATUS_CONFIG.present;
                statusLabel = cfg.label + (r.status === "late" && r.late_minutes && r.late_minutes > 0 ? ` (${r.late_minutes}m)` : "");
                statusBg = cfg.bg;
                statusText = cfg.text;
                statusBorder = cfg.border;
                statusIcon = cfg.icon;
              }

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectRecord(r)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  {/* Employee */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                        {emp?.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials(emp?.first_name, emp?.last_name)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#253C7D] dark:group-hover:text-sky-400 transition-colors">
                          {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-400">{emp?.role || "Team Member"}</p>
                      </div>
                    </div>
                  </td>

                  {/* Department & Site */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-semibold text-gray-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-[11px]">
                      {emp?.department || "General"}
                    </span>
                    {emp?.branches?.name && <span className="text-gray-400 dark:text-slate-500 block text-[10px] mt-0.5">{emp.branches.name}</span>}
                    {r.work_location?.name && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-md shadow-2xs">
                          <i className="ri-map-pin-2-fill text-[9px] text-emerald-500 dark:text-emerald-400" />
                          <span>{r.work_location.name}</span>
                          {r.work_location_id !== emp?.default_work_location_id && emp?.default_work_location_id && (
                            <span className="ml-0.5 px-1 py-px bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded text-[8px] font-extrabold uppercase">
                              Visiting
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900 dark:text-slate-100">
                    {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>

                  {/* 4-Punch Columns vs Standard 2-Punch Columns */}
                  {isFourPunchMode ? (
                    <>
                      {/* 1. Morning Check In */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {r.clock_in ? (
                          <span className="font-bold text-amber-900 dark:text-amber-200 text-xs px-2.5 py-1 bg-amber-50/80 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/60 rounded-xl inline-flex items-center gap-1 shadow-2xs">
                            <i className="ri-sun-line text-amber-500 dark:text-amber-400 text-[11px]" />
                            {formatTime(r.clock_in)}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
                        )}
                      </td>

                      {/* 2. Lunch Out */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {r.break_out ? (
                          <span className="font-bold text-orange-900 dark:text-orange-200 text-xs px-2.5 py-1 bg-orange-50/90 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 rounded-xl inline-flex items-center gap-1 shadow-2xs">
                            <i className="ri-restaurant-line text-orange-500 dark:text-orange-400 text-[11px]" />
                            {formatTime(r.break_out)}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
                        )}
                      </td>

                      {/* 3. Lunch In */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {r.break_in ? (
                          <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs px-2.5 py-1 bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 rounded-xl inline-flex items-center gap-1 shadow-2xs">
                            <i className="ri-cup-line text-indigo-500 dark:text-indigo-400 text-[11px]" />
                            {formatTime(r.break_in)}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
                        )}
                      </td>

                      {/* 4. Evening Check Out */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {r.clock_out ? (
                          <span className="font-bold text-blue-900 dark:text-blue-200 text-xs px-2.5 py-1 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 rounded-xl inline-flex items-center gap-1 shadow-2xs">
                            <i className="ri-moon-line text-blue-500 dark:text-blue-400 text-[11px]" />
                            {formatTime(r.clock_out)}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Standard Check In */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800 dark:text-slate-100">
                        {formatTime(r.clock_in)}
                      </td>

                      {/* Standard Check Out */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-gray-800 dark:text-slate-100">{formatTime(r.clock_out)}</span>
                        {r.early_leave_minutes && r.early_leave_minutes > 0 ? (
                          <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400">({r.early_leave_minutes}m early)</span>
                        ) : null}
                      </td>
                    </>
                  )}

                  {/* Total Hours */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap font-extrabold text-[#253C7D] dark:text-sky-400">
                    {r.hours_worked && r.hours_worked > 0 ? (
                      <span className="inline-block px-2 py-0.5 bg-[#253C7D]/5 dark:bg-sky-950/40 rounded-lg border border-[#253C7D]/10 dark:border-sky-800/50">
                        {r.hours_worked}h
                      </span>
                    ) : r.clock_in && r.clock_out ? (
                      calcHours(r.clock_in, r.clock_out)
                    ) : (
                      <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${statusBg} ${statusText} border ${statusBorder} shadow-2xs`}>
                      {isPulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                      <i className={statusIcon} />
                      {statusLabel}
                    </span>
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400 max-w-[160px] truncate">{r.notes || "—"}</td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditRecord(r)}
                            className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-[#253C7D] dark:hover:text-sky-400 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(r.id)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectRecord(r)}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
