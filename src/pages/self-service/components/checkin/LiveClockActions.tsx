import { memo } from "react";
import { Link } from "react-router-dom";
import type { AttendanceRecord, BranchGeofence, OutsideWorkTask, CheckInStep } from "../../types";
import { fmtHM } from "../../selfServiceUtils";

interface Props {
  activeOutsideWork: OutsideWorkTask | null;
  todayOutsideWork?: OutsideWorkTask | null;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  checkInStep: CheckInStep;
  checkInMessage: string;
  processing: boolean;
  notes: string;
  setNotes: (v: string) => void;
  earlyCheckoutReason: string;
  setEarlyCheckoutReason: (v: string) => void;
  earlyCheckoutMinutesNow: number;
  isEarlyCheckoutNow: boolean;
  branch: BranchGeofence | null;
  branchLoading: boolean;
  todayRecord: AttendanceRecord | null;
  onRequestClockIn: () => void;
  onConfirmClockIn: () => void;
  onClockOut: () => void;
  onResetCheckInFlow: () => void;
}

export const LiveClockActions = memo(function LiveClockActions(props: Props) {
  const {
    activeOutsideWork, todayOutsideWork, isCheckedIn, isCheckedOut, checkInStep,
    checkInMessage, processing, notes, setNotes, earlyCheckoutReason,
    setEarlyCheckoutReason, earlyCheckoutMinutesNow, isEarlyCheckoutNow,
    branch, branchLoading, todayRecord, onRequestClockIn, onConfirmClockIn,
    onClockOut, onResetCheckInFlow,
  } = props;

  const currentOutsideTask = todayOutsideWork || activeOutsideWork;
  const hasOutsideToday = !!(currentOutsideTask && currentOutsideTask.work_status !== "checked_out");

  return (
    <div className="flex flex-col gap-2 lg:w-72 shrink-0">
      {hasOutsideToday && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p className="text-xs font-bold text-amber-800 dark:text-amber-200 truncate">
              {currentOutsideTask.work_status === "checked_in" ? "Field Work Active" : "Field Work Assigned"}
            </p>
          </div>
          <p className="text-[11.5px] text-amber-900/80 dark:text-slate-300 leading-snug line-clamp-2">{currentOutsideTask.title}</p>
          <Link
            to="/tasks"
            className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
          >
            <i className="ri-task-line text-xs" />
            <span>Go to Tasks</span>
          </Link>
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && checkInStep === "idle" && (
        <div className="space-y-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note (e.g. Office / WFH)..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#253C7D] dark:focus:border-[#29ABE2] focus:ring-1 focus:ring-[#253C7D]/25 transition-all shadow-2xs"
          />
          <button
            type="button"
            onClick={onRequestClockIn}
            disabled={processing || branchLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#253C7D] hover:bg-[#1E3066] active:bg-[#172554] text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all disabled:opacity-60 cursor-pointer active:scale-98 shadow-sm"
          >
            <i className="ri-fingerprint-line text-base" />
            <span>Check In</span>
          </button>
          {branch?.latitude && (
            <p className="text-slate-500 dark:text-slate-400 text-[10.5px] text-center truncate flex items-center justify-center gap-1">
              <i className="ri-map-pin-line text-xs text-slate-400" />
              <span>Within {branch.geofence_radius_m}m of {branch.name}</span>
            </p>
          )}
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && checkInStep === "locating" && (
        <div className="bg-slate-50 dark:bg-slate-800/90 rounded-xl p-3.5 text-center border border-slate-200 dark:border-slate-700">
          <div className="w-5 h-5 border-2 border-[#253C7D] dark:border-[#29ABE2] border-t-transparent dark:border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">Verifying GPS location...</p>
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && checkInStep === "confirm" && (
        <div className="space-y-2">
          <div className="bg-[#253C7D]/5 dark:bg-[#29ABE2]/10 rounded-xl p-2.5 flex items-start gap-2 border border-[#253C7D]/30 dark:border-[#29ABE2]/40 text-xs">
            <i className="ri-checkbox-circle-fill text-[#253C7D] dark:text-[#29ABE2] text-base shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-[#253C7D] dark:text-slate-200 leading-snug font-medium">{checkInMessage}</p>
          </div>
          <button
            type="button"
            onClick={onConfirmClockIn}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 bg-[#253C7D] hover:bg-[#1E3066] active:bg-[#172554] text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors disabled:opacity-60 cursor-pointer shadow-sm active:scale-98"
          >
            <i className="ri-checkbox-circle-line text-base" />
            <span>{processing ? "Checking In..." : "Confirm Check In"}</span>
          </button>
          <button
            type="button"
            onClick={onResetCheckInFlow}
            disabled={processing}
            className="w-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-[11.5px] text-center block transition-colors cursor-pointer py-0.5 font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && (checkInStep === "denied" || checkInStep === "error") && (
        <div className="space-y-2">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 flex items-start gap-2 border border-slate-300 dark:border-slate-700 text-xs">
            <i className="ri-error-warning-line text-[#253C7D] dark:text-[#29ABE2] text-base shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-slate-800 dark:text-slate-200 leading-snug">{checkInMessage}</p>
          </div>
          <button
            type="button"
            onClick={onRequestClockIn}
            className="w-full flex items-center justify-center gap-1.5 bg-[#253C7D] hover:bg-[#1E3066] active:bg-[#172554] text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
          >
            <i className="ri-refresh-line text-xs" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {!hasOutsideToday && isCheckedIn && !isCheckedOut && (
        <div className="space-y-2">
          {isEarlyCheckoutNow ? (
            <div className="space-y-1.5">
              <div className="bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-400/30 rounded-lg px-2.5 py-1.5">
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1">
                  <i className="ri-alarm-warning-line text-xs text-amber-600 dark:text-amber-300 shrink-0" />
                  <span>Early Checkout ({earlyCheckoutMinutesNow}m early)</span>
                </p>
              </div>
              <textarea
                value={earlyCheckoutReason}
                onChange={(e) => setEarlyCheckoutReason(e.target.value)}
                rows={1}
                maxLength={300}
                placeholder="Reason for early departure..."
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#253C7D] resize-none"
              />
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-400/50 dark:border-amber-400/30 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
              <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <i className="ri-alarm-warning-fill text-xs text-amber-500 animate-bounce" />
                <span>Shift Complete • On Time</span>
              </p>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onClockOut}
            disabled={processing}
            className={`w-full flex items-center justify-center gap-2 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all disabled:opacity-60 cursor-pointer active:scale-98 shadow-sm ${
              !isEarlyCheckoutNow
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:from-amber-700 ring-2 ring-amber-400/40 shadow-amber-500/25 animate-pulse"
                : "bg-[#253C7D] hover:bg-[#1E3066] active:bg-[#172554]"
            }`}
          >
            <i className={`text-base ${!isEarlyCheckoutNow ? "ri-alarm-warning-fill text-white" : "ri-logout-box-r-line text-[#29ABE2]"}`} />
            <span>{processing ? "Checking Out..." : !isEarlyCheckoutNow ? "Check Out Now" : "Check Out"}</span>
          </button>
        </div>
      )}

      {isCheckedOut && (
        <div className="bg-emerald-50 dark:bg-slate-800/90 border border-emerald-200 dark:border-slate-700 rounded-xl px-3.5 py-3 flex items-center gap-2.5 shadow-2xs">
          <i className="ri-checkbox-circle-fill text-emerald-600 dark:text-emerald-400 text-lg shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-xs text-emerald-900 dark:text-white">Day Complete</p>
            <p className="text-emerald-700 dark:text-slate-300 text-[11px]">
              {todayRecord?.hours_worked ? `${fmtHM(todayRecord.hours_worked)} logged` : "Shift recorded"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

