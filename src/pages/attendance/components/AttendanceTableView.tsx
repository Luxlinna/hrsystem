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
  // Detect if any records in the current view use 4-punch mode (or have lunch scans)
  const isFourPunchMode = records.some(
    (r) => r.break_out || r.break_in || r.work_location?.is_four_punch_enabled
  );

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      {isFourPunchMode && (
        <div className="px-5 py-2.5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200/70 shadow-2xs">
              <i className="ri-time-line text-xs text-indigo-600" />
              4-Punch Multi-Session Shift Active
            </span>
            <span className="text-gray-400 text-[11px] hidden sm:inline">
              Morning In · Lunch Out · Lunch In · Evening Out
            </span>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-200/60">
            {records.length} Record{records.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5 whitespace-nowrap">Employee</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Department</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Date</th>

              {isFourPunchMode ? (
                <>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-amber-700">
                      <i className="ri-sun-line text-xs" />
                      <span>Morning In</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-orange-700">
                      <i className="ri-restaurant-line text-xs" />
                      <span>Lunch Out</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-indigo-700">
                      <i className="ri-cup-line text-xs" />
                      <span>Lunch In</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-blue-700">
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
          <tbody className="divide-y divide-gray-100">
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
                if (r.break_out && !r.break_in) {
                  statusLabel = "Lunch Break";
                  statusBg = "bg-orange-50";
                  statusText = "text-orange-700";
                  statusBorder = "border-orange-200";
                  statusIcon = "ri-restaurant-line";
                  isPulse = true;
                } else if (r.break_in && !r.clock_out) {
                  statusLabel = "Working (PM)";
                  statusBg = "bg-sky-50";
                  statusText = "text-sky-700";
                  statusBorder = "border-sky-200";
                  statusIcon = "ri-time-line";
                  isPulse = true;
                } else if (r.clock_in && !r.break_out && !r.clock_out) {
                  statusLabel = "Working Now";
                  statusBg = "bg-emerald-50";
                  statusText = "text-emerald-700";
                  statusBorder = "border-emerald-200";
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
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
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
                        <p className="font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                          {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                        </p>
                        <p className="text-[11px] text-gray-400">{emp?.role || "Team Member"}</p>
                      </div>
                    </div>
                  </td>

                  {/* Department & Site */}
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

                  {/* Date */}
                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                    {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>

                  {/* 4-Punch Columns vs Standard 2-Punch Columns */}
                  {isFourPunchMode ? (
                    <>
                      {/* 1. Morning Check In */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {r.clock_in ? (
                          <span className="font-bold text-amber-900 text-xs px-2.5 py-1 bg-amber-50/80 border border-amber-200/70 rounded-xl inline-flex items-center gap-1 shadow-2xs">
                            <i className="ri-sun-line text-amber-500 text-[11px]" />
                            {formatTime(r.clock_in)}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-extrabold text-sm select-none">—</span>
                        )}
                      </td>

                      {/* 2. Lunch Out */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {r.break_out ? (
                          <span className="font-bold text-orange-900 text-xs px-2.5 py-1 bg-orange-50/90 border border-orange-200 rounded-xl inline-flex items-center gap-1 shadow-2xs">
                            <i className="ri-restaurant-line text-orange-500 text-[11px]" />
                            {formatTime(r.break_out)}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-extrabold text-sm select-none">—</span>
                        )}
                      </td>

                      {/* 3. Lunch In */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {r.break_in ? (
                          <span className="font-bold text-indigo-900 text-xs px-2.5 py-1 bg-indigo-50/90 border border-indigo-200 rounded-xl inline-flex items-center gap-1 shadow-2xs">
                            <i className="ri-cup-line text-indigo-500 text-[11px]" />
                            {formatTime(r.break_in)}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-extrabold text-sm select-none">—</span>
                        )}
                      </td>

                      {/* 4. Evening Check Out */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {r.clock_out ? (
                          <span className="font-bold text-blue-900 text-xs px-2.5 py-1 bg-blue-50/80 border border-blue-200/70 rounded-xl inline-flex items-center gap-1 shadow-2xs">
                            <i className="ri-moon-line text-blue-500 text-[11px]" />
                            {formatTime(r.clock_out)}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-extrabold text-sm select-none">—</span>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Standard Check In */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800">
                        {formatTime(r.clock_in)}
                      </td>

                      {/* Standard Check Out */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-gray-800">{formatTime(r.clock_out)}</span>
                        {r.early_leave_minutes && r.early_leave_minutes > 0 ? (
                          <span className="block text-[10px] font-semibold text-amber-600">({r.early_leave_minutes}m early)</span>
                        ) : null}
                      </td>
                    </>
                  )}

                  {/* Total Hours */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap font-extrabold text-[#253C7D]">
                    {r.hours_worked && r.hours_worked > 0 ? (
                      <span className="inline-block px-2 py-0.5 bg-[#253C7D]/5 rounded-lg border border-[#253C7D]/10">
                        {r.hours_worked}h
                      </span>
                    ) : r.clock_in && r.clock_out ? (
                      calcHours(r.clock_in, r.clock_out)
                    ) : (
                      <span className="text-gray-300 font-extrabold text-sm select-none">—</span>
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
                  <td className="px-4 py-3.5 text-gray-500 max-w-[160px] truncate">{r.notes || "—"}</td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
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
