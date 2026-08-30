import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { STATUS_CONFIG, formatTime, calcHours, initials } from "../constants";

interface RecordDetailsBodyProps {
  selectedRecord: AttendanceRecord;
}

export const RecordDetailsBody = memo(function RecordDetailsBody({
  selectedRecord,
}: RecordDetailsBodyProps) {
  const cfg = STATUS_CONFIG[selectedRecord.status] || STATUS_CONFIG.ontime || STATUS_CONFIG.present;
  const isVisiting = selectedRecord.work_location_id !== selectedRecord.employees?.default_work_location_id && !!selectedRecord.employees?.default_work_location_id;

  return (
    <div className="p-6 space-y-5">
      {/* Employee Card */}
      {selectedRecord.employees && (
        <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-2xl border border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
            {selectedRecord.employees.avatar_url ? (
              <img src={selectedRecord.employees.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{initials(selectedRecord.employees.first_name, selectedRecord.employees.last_name)}</span>
            )}
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 text-sm">
              {selectedRecord.employees.first_name} {selectedRecord.employees.last_name}
            </h4>
            <p className="text-xs text-gray-500">{selectedRecord.employees.role}</p>
            <p className="text-[11px] text-gray-400">{selectedRecord.employees.department}</p>
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div>
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
          Attendance Status
        </span>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
          <i className={cfg.icon} />
          {cfg.label}
        </span>
      </div>

      {/* Check In / Out Time Matrix */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Check In</span>
          <p className="text-lg font-black text-gray-900 mt-1">{formatTime(selectedRecord.clock_in)}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Check Out</span>
          <p className="text-lg font-black text-gray-900 mt-1">{formatTime(selectedRecord.clock_out)}</p>
        </div>
      </div>

      {/* Hours Summary Card */}
      <div className="p-4 bg-[#253C7D]/5 border border-[#253C7D]/15 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#253C7D] uppercase tracking-wider block">Shift Total Duration</span>
          <p className="text-xl font-black text-[#253C7D] mt-0.5">{calcHours(selectedRecord.clock_in, selectedRecord.clock_out)}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center">
          <i className="ri-hourglass-2-line text-lg" />
        </div>
      </div>

      {/* Work Site Card */}
      {selectedRecord.work_location?.name && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${isVisiting ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isVisiting ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
            <i className="ri-building-2-line text-base" />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isVisiting ? "text-amber-500" : "text-emerald-600"}`}>
              {isVisiting ? "Visiting Site" : "Work Site"}
            </span>
            <p className={`text-sm font-extrabold ${isVisiting ? "text-amber-800" : "text-emerald-800"}`}>
              {selectedRecord.work_location.name}
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {selectedRecord.notes && (
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Supervisor Notes</span>
          <p className="text-xs text-gray-700 leading-relaxed italic">"{selectedRecord.notes}"</p>
        </div>
      )}
    </div>
  );
});
