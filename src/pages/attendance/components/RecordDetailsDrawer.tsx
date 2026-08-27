import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { STATUS_CONFIG, formatTime, calcHours, initials } from "../constants";

interface RecordDetailsDrawerProps {
  selectedRecord: AttendanceRecord | null;
  onClose: () => void;
  canManage: boolean;
  onOpenEditModal: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
}

export const RecordDetailsDrawer = memo(function RecordDetailsDrawer({
  selectedRecord,
  onClose,
  canManage,
  onOpenEditModal,
  onDeleteRecord,
}: RecordDetailsDrawerProps) {
  if (!selectedRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[440px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          {/* Drawer Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Attendance Log Details</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(selectedRecord.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* Drawer Body */}
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
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  STATUS_CONFIG[selectedRecord.status]?.bg
                } ${STATUS_CONFIG[selectedRecord.status]?.text} border ${
                  STATUS_CONFIG[selectedRecord.status]?.border
                }`}
              >
                <i className={STATUS_CONFIG[selectedRecord.status]?.icon} />
                {STATUS_CONFIG[selectedRecord.status]?.label}
              </span>
            </div>

            {/* Check In / Out Time Matrix */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Check In
                </span>
                <p className="text-lg font-black text-gray-900 mt-1">
                  {formatTime(selectedRecord.clock_in)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Check Out
                </span>
                <p className="text-lg font-black text-gray-900 mt-1">
                  {formatTime(selectedRecord.clock_out)}
                </p>
              </div>
            </div>

            {/* Hours Summary Card */}
            <div className="p-4 bg-[#253C7D]/5 border border-[#253C7D]/15 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#253C7D] uppercase tracking-wider block">
                  Shift Total Duration
                </span>
                <p className="text-xl font-black text-[#253C7D] mt-0.5">
                  {calcHours(selectedRecord.clock_in, selectedRecord.clock_out)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center">
                <i className="ri-hourglass-2-line text-lg" />
              </div>
            </div>

            {/* Late arrival box */}
            {selectedRecord.status === "late" && selectedRecord.late_minutes > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <i className="ri-alarm-warning-line" />
                  Late Arrival Recorded
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {selectedRecord.late_minutes} minutes past standard shift start time
                </p>
              </div>
            )}

            {/* Notes box */}
            {selectedRecord.notes && (
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Supervisor / Attendance Remarks
                </span>
                <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                  {selectedRecord.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={() => onOpenEditModal(selectedRecord)}
            className="flex-1 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <i className="ri-edit-line" />
            Edit Record
          </button>

          {canManage && (
            <button
              onClick={() => onDeleteRecord(selectedRecord.id)}
              className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              title="Delete record"
            >
              <i className="ri-delete-bin-line text-base" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
