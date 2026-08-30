import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { STATUS_CONFIG, formatTime, calcHours, initials } from "../constants";

interface AttendanceCardsViewProps {
  records: AttendanceRecord[];
  todayYMD: string;
  canManage: boolean;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
}

export const AttendanceCardsView = memo(function AttendanceCardsView({
  records,
  todayYMD,
  canManage,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
}: AttendanceCardsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {records.map((r) => {
        const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.ontime || STATUS_CONFIG.present;
        const emp = r.employees;
        const isWorkingNow = r.clock_in && !r.clock_out && r.date === todayYMD;

        return (
          <div
            key={r.id}
            onClick={() => onSelectRecord(r)}
            className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                    {emp?.avatar_url ? (
                      <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials(emp?.first_name, emp?.last_name)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm">
                      {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {emp?.role} · {emp?.department}
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border} shrink-0`}>
                  <i className={cfg.icon} />
                  {cfg.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50/70 p-3 rounded-2xl border border-gray-100 mb-3 text-center">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Check In</span>
                  <p className="font-extrabold text-gray-800 text-xs mt-0.5">{formatTime(r.clock_in)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Check Out</span>
                  {isWorkingNow ? (
                    <p className="font-bold text-sky-600 text-xs mt-0.5 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                      Working
                    </p>
                  ) : (
                    <p className="font-extrabold text-gray-800 text-xs mt-0.5">{formatTime(r.clock_out)}</p>
                  )}
                </div>
              </div>

              {r.work_location?.name && (
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1 font-medium">
                    <i className="ri-building-2-line" /> Work Site
                  </span>
                  <span className={`font-bold ${r.work_location_id !== emp?.default_work_location_id ? "text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md" : "text-gray-800"}`}>
                    {r.work_location.name}
                  </span>
                </div>
              )}

              {r.notes && (
                <p className="text-xs text-gray-500 italic bg-gray-50/50 p-2 rounded-xl border border-gray-100/60 mb-2 truncate">
                  "{r.notes}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#253C7D]">{calcHours(r.clock_in, r.clock_out)}</span>
                <span className="text-[11px] text-gray-400">
                  {new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditRecord(r)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#253C7D] transition-colors cursor-pointer"
                  >
                    <i className="ri-edit-line text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRecord(r.id)}
                    className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <i className="ri-delete-bin-line text-xs" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
