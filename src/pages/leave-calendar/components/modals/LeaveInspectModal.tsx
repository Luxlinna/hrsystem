import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { formatDateDisplay } from "../../dateUtils";

interface LeaveInspectModalProps {
  inspectLeave: LeaveRequest | null;
  onClose: () => void;
}

export const LeaveInspectModal = memo(function LeaveInspectModal({
  inspectLeave,
  onClose,
}: LeaveInspectModalProps) {
  if (!inspectLeave) return null;

  const cfg = LEAVE_TYPE_CONFIG[inspectLeave.leave_type] || LEAVE_TYPE_CONFIG.annual;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">
              SCHEDULED ABSENCE
            </span>
            <h3 className="text-base font-extrabold text-gray-900 mt-0.5">Leave Application Details</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Employee Info Header */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] font-extrabold text-sm flex items-center justify-center shrink-0">
              {inspectLeave.employees?.first_name?.[0]}
              {inspectLeave.employees?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-gray-900 truncate">
                {inspectLeave.employees?.first_name} {inspectLeave.employees?.last_name}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium truncate">
                {inspectLeave.employees?.role || "Staff"} &middot; {inspectLeave.employees?.department || "General"}
              </p>
            </div>
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Leave Type</span>
              <span className={`text-xs font-extrabold mt-1 inline-flex items-center gap-1 ${cfg.text}`}>
                <i className={cfg.icon} />
                {cfg.label}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
              <span
                className={`text-xs font-extrabold mt-1 inline-flex items-center gap-1 capitalize ${
                  inspectLeave.status === "approved" ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    inspectLeave.status === "approved" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {inspectLeave.status}
              </span>
            </div>
          </div>

          {/* Dates & Duration info */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Duration:</span>
              <strong className="font-extrabold text-gray-900">
                {inspectLeave.days} working {inspectLeave.days === 1 ? "day" : "days"}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Date Range:</span>
              <span className="font-semibold text-gray-700">
                {formatDateDisplay(inspectLeave.start_date)} &rarr; {formatDateDisplay(inspectLeave.end_date)}
              </span>
            </div>
          </div>

          {/* Reason */}
          {inspectLeave.reason && (
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Reason & Context
              </span>
              <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-3.5 border border-gray-100 leading-relaxed whitespace-pre-wrap">
                {inspectLeave.reason}
              </p>
            </div>
          )}
        </div>

        <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
