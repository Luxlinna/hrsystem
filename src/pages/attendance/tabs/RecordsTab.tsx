import { memo } from "react";
import type { AttendanceRecord, ViewMode } from "../types";
import { STATUS_CONFIG, formatTime, calcHours, initials } from "../constants";
import { Pagination } from "../components/Pagination";

interface RecordsTabProps {
  filteredRecords: AttendanceRecord[];
  pagedRecords: AttendanceRecord[];
  viewMode: ViewMode;
  todayYMD: string;
  canManage: boolean;
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
}

export const RecordsTab = memo(function RecordsTab({
  filteredRecords,
  pagedRecords,
  viewMode,
  todayYMD,
  canManage,
  pageSize,
  setPageSize,
  page,
  setPage,
  totalPages,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
}: RecordsTabProps) {
  if (filteredRecords.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-calendar-close-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Attendance Records Found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No entries match your selected date range and filter parameters. Try switching to "All Historical Dates" or adjusting your search.
        </p>
      </div>
    );
  }

  return (
    <div>
      {viewMode === "table" ? (
        /* Table View */
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
                {pagedRecords.map((r) => {
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
                        {emp?.branches?.name && (
                          <span className="text-gray-400 block text-[10px] mt-0.5">{emp.branches.name}</span>
                        )}
                        {r.work_location?.name && (
                          <span
                            className={`flex items-center gap-1 text-[10px] font-semibold mt-0.5 ${
                              r.work_location_id !== emp?.default_work_location_id
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            <i className="ri-building-2-line" />
                            {r.work_location.name}
                            {r.work_location_id !== emp?.default_work_location_id && emp?.default_work_location_id && (
                              <span className="ml-0.5 px-1 py-px bg-amber-100 text-amber-700 rounded text-[9px] font-bold">Visiting</span>
                            )}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                        {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-gray-800">{formatTime(r.clock_in)}</span>
                      </td>

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
                          <span className="block text-[10px] font-semibold text-amber-600">
                            ({r.early_leave_minutes}m early)
                          </span>
                        ) : null}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-gray-600">
                        {calcHours(r.clock_in, r.clock_out)}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <i className={cfg.icon} />
                          {cfg.label}
                          {r.status === "late" && r.late_minutes > 0 && ` (+${r.late_minutes}m)`}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 max-w-[180px] truncate text-gray-400 text-[11px]">
                        {r.notes || "—"}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onEditRecord(r)}
                            title="Edit Record"
                            className="p-1.5 text-gray-500 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                          {canManage && (
                            <button
                              onClick={() => onDeleteRecord(r.id)}
                              title="Delete Record"
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-sm" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pagedRecords.map((r) => {
            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.ontime || STATUS_CONFIG.present;
            const emp = r.employees;
            const isWorkingNow = r.clock_in && !r.clock_out && r.date === todayYMD;

            return (
              <div
                key={r.id}
                onClick={() => onSelectRecord(r)}
                className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                        {emp?.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials(emp?.first_name, emp?.last_name)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate text-sm">
                          {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate">{emp?.role || "Team Member"}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-2xl text-center mb-3">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Check In</span>
                      <span className="text-xs font-bold text-gray-800">{formatTime(r.clock_in)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Check Out</span>
                      <span className="text-xs font-bold text-gray-800">
                        {isWorkingNow ? "Active" : formatTime(r.clock_out)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Hours</span>
                      <span className="text-xs font-bold text-[#253C7D]">
                        {calcHours(r.clock_in, r.clock_out)}
                      </span>
                    </div>
                  </div>

                  {r.notes && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-gray-100">
                      {r.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3 text-[11px] text-gray-400">
                  <span>
                    {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-semibold text-gray-600">{emp?.department || "General"}</span>
                    {r.work_location?.name && (
                      <span
                        className={`flex items-center gap-1 text-[10px] font-semibold ${
                          r.work_location_id !== emp?.default_work_location_id
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        <i className="ri-building-2-line" />
                        {r.work_location.name}
                        {r.work_location_id !== emp?.default_work_location_id && emp?.default_work_location_id && (
                          <span className="ml-0.5 px-1 py-px bg-amber-100 text-amber-700 rounded text-[9px] font-bold">Visiting</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <Pagination
        totalCount={filteredRecords.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
      />
    </div>
  );
});
