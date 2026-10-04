import { memo } from "react";
import type { ContextMenuTarget } from "./ScheduleMatrixContextMenu";
import { getShiftPillStyle } from "./shiftCodeStyles";

interface AttendanceLogModalProps {
  target: ContextMenuTarget | null;
  onClose: () => void;
  onOpenTimeLog?: (empId: string, date: string) => void;
}

export const AttendanceLogModal = memo(function AttendanceLogModal({
  target,
  onClose,
  onOpenTimeLog,
}: AttendanceLogModalProps) {
  if (!target) return null;

  const pill = getShiftPillStyle(target.currentCode, false);
  const hasClockIn = Boolean(target.clockIn);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Attendance Log Details</h4>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="text-xs font-semibold text-gray-800">{target.empName}</span>
              {target.employeeCode && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20 shrink-0">
                  <i className="ri-fingerprint-line text-[10px]" />
                  {target.employeeCode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{target.dateString}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-base cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-500 font-medium">Scheduled Shift:</span>
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${pill.bg} ${pill.text}`}>
              {target.currentCode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Clock In</span>
              <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <i className="ri-login-box-line text-emerald-600" />
                {target.clockIn || <span className="text-gray-400 font-normal">No Clock In</span>}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Clock Out</span>
              <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <i className="ri-logout-box-line text-rose-600" />
                {target.clockOut || <span className="text-gray-400 font-normal">No Clock Out</span>}
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
            <span className="text-gray-500 font-medium">Status:</span>
            <span className="font-bold capitalize text-gray-800">
              {target.status?.replace("_", " ") || "No Record"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {!hasClockIn && onOpenTimeLog ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTimeLog(target.empId, target.dateString);
              }}
              className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <i className="ri-add-line" />
              <span>Log Manual Entry</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
