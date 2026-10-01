import { Link } from "react-router-dom";
import type { AttendanceRecord, BranchGeofence, OutsideWorkTask, CheckInStep } from "../../types";
import { fmtHM } from "../../selfServiceUtils";

interface Props {
  currentTime: Date;
  timezone: string;
  workStartTime: string;
  workEndTime: string | null;
  shiftProgress: number | null;
  activeOutsideWork: OutsideWorkTask | null;
  todayOutsideWork?: OutsideWorkTask | null;
  todayRecord: AttendanceRecord | null;
  elapsedHours: number;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  branch: BranchGeofence | null;
  branchLoading: boolean;
  checkInStep: CheckInStep;
  checkInMessage: string;
  processing: boolean;
  notes: string;
  setNotes: (v: string) => void;
  earlyCheckoutReason: string;
  setEarlyCheckoutReason: (v: string) => void;
  earlyCheckoutMinutesNow: number;
  isEarlyCheckoutNow: boolean;
  scheduleSettings: any;
  daySchedule: any;
  onRequestClockIn: () => void;
  onConfirmClockIn: () => void;
  onClockOut: () => void;
  onResetCheckInFlow: () => void;
}

export function LiveClockPanel(props: Props) {
  return (
    <div className="bg-slate-900 rounded-xl p-3.5 sm:p-5 text-white shadow-xs border border-slate-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-5">
        {/* Left: Clock + Time info */}
        <LiveClock {...props} />

        {/* Center: Compact Shift Snapshot */}
        <ShiftSnapshot {...props} />

        {/* Right: Actions */}
        <CheckInActions {...props} />
      </div>
    </div>
  );
}

function LiveClock({ currentTime, timezone }: Pick<Props, "currentTime" | "timezone">) {
  const safeTime = (() => {
    try {
      return currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: timezone || "Asia/Phnom_Penh" });
    } catch {
      return currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
  })();

  const safeDate = (() => {
    try {
      return currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: timezone || "Asia/Phnom_Penh" });
    } catch {
      return currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    }
  })();

  return (
    <div className="flex items-center justify-between lg:block lg:pr-5 lg:border-r lg:border-slate-800 shrink-0">
      <div>
        <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Clock</span>
        </div>
        <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums mt-0.5 text-white">
          {safeTime}
        </p>
      </div>
      <div className="text-right lg:text-left">
        <p className="text-slate-400 text-[11px] font-medium mt-0.5">
          {safeDate}
        </p>
        <span className="lg:hidden text-slate-500 text-[10px] font-mono block">
          {timezone?.replace("_", " ") || "Local"}
        </span>
      </div>
    </div>
  );
}

function ShiftSnapshot(props: Props) {
  const {
    shiftProgress, activeOutsideWork, todayOutsideWork, todayRecord, isCheckedIn, isCheckedOut,
    elapsedHours, scheduleSettings,
  } = props;

  const hasOutsideToday = todayOutsideWork && todayOutsideWork.work_status !== "checked_out";

  const isBiometricCheckIn = Boolean(
    todayRecord?.notes?.toLowerCase().includes("zkteco") ||
    todayRecord?.notes?.toLowerCase().includes("biometric") ||
    todayRecord?.notes?.toLowerCase().includes("fingerprint")
  );

  const inTime = todayRecord?.clock_in?.slice(0, 5) || (() => {
    if (!activeOutsideWork?.work_checked_in_at) return "—";
    try {
      const tz = scheduleSettings.timezone || "Asia/Phnom_Penh";
      return new Date(activeOutsideWork.work_checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
    } catch {
      return "08:00";
    }
  })();

  const outTime = todayRecord?.clock_out?.slice(0, 5) || "—";
  const durationText = hasOutsideToday
    ? "Outside Work"
    : isCheckedIn && !isCheckedOut
    ? fmtHM(elapsedHours)
    : todayRecord?.hours_worked
    ? fmtHM(todayRecord.hours_worked)
    : "—";

  return (
    <div className="bg-slate-800/80 rounded-lg p-2.5 sm:p-3 border border-slate-700/60 flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300 font-semibold text-[11.5px]">Today's Shift</span>
          {isBiometricCheckIn && (
            <span className="inline-flex items-center gap-0.5 text-[9.5px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              <i className="ri-fingerprint-line text-[10px]" />
              Biometric
            </span>
          )}
        </div>
        <span className="text-slate-400 text-[10.5px] font-mono hidden sm:inline">
          {scheduleSettings.timezone?.replace("_", " ") || "Local"}
        </span>
      </div>

      {shiftProgress !== null && (
        <div className="relative h-1 rounded-full bg-slate-700 overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all duration-1000"
            style={{ width: `${shiftProgress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-slate-900/60 rounded-md py-1.5 px-2">
          <p className="text-slate-400 text-[9.5px] font-bold uppercase tracking-wider">In</p>
          <p className="text-xs sm:text-[13px] font-bold text-white tabular-nums mt-0.5">{inTime}</p>
        </div>
        <div className="bg-slate-900/60 rounded-md py-1.5 px-2">
          <p className="text-slate-400 text-[9.5px] font-bold uppercase tracking-wider">Out</p>
          <p className="text-xs sm:text-[13px] font-bold text-white tabular-nums mt-0.5">{outTime}</p>
        </div>
        <div className="bg-slate-900/60 rounded-md py-1.5 px-2">
          <p className="text-slate-400 text-[9.5px] font-bold uppercase tracking-wider">
            {hasOutsideToday ? "Status" : "Logged"}
          </p>
          <p className="text-xs sm:text-[13px] font-bold text-emerald-400 tabular-nums mt-0.5 flex items-center justify-center gap-1 truncate">
            {isCheckedIn && !isCheckedOut && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
            {durationText}
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckInActions(props: Props) {
  const {
    activeOutsideWork, todayOutsideWork, isCheckedIn, isCheckedOut, checkInStep, checkInMessage, processing,
    notes, setNotes, earlyCheckoutReason, setEarlyCheckoutReason, earlyCheckoutMinutesNow,
    isEarlyCheckoutNow, branch, branchLoading, todayRecord, scheduleSettings, onRequestClockIn, onConfirmClockIn, onClockOut, onResetCheckInFlow,
  } = props;

  const currentOutsideTask = todayOutsideWork || activeOutsideWork;
  const hasOutsideToday = !!(currentOutsideTask && currentOutsideTask.work_status !== "checked_out");
  const isBiometricCheckIn = Boolean(
    todayRecord?.notes?.toLowerCase().includes("zkteco") ||
    todayRecord?.notes?.toLowerCase().includes("biometric") ||
    todayRecord?.notes?.toLowerCase().includes("fingerprint")
  );

  return (
    <div className="flex flex-col gap-2 lg:w-64 shrink-0">
      {hasOutsideToday && (
        <div className="bg-slate-800/90 border border-amber-400/30 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <p className="text-xs font-bold text-white truncate">
              {currentOutsideTask.work_status === "checked_in" ? "Field Work Active" : "Field Work Assigned"}
            </p>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
            {currentOutsideTask.title}
          </p>
          <Link
            to="/tasks"
            className="w-full flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-1.5 px-3 rounded-md text-[11.5px] transition-colors cursor-pointer"
          >
            <i className="ri-task-line text-xs" />
            <span>Go to Tasks</span>
          </Link>
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && checkInStep === "idle" && (
        <div className="space-y-1.5">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note (e.g. WFH)..."
            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={onRequestClockIn}
            disabled={processing || branchLoading}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all disabled:opacity-60 cursor-pointer active:scale-98 shadow-xs"
          >
            <i className="ri-fingerprint-line text-sm" />
            <span>Check In</span>
          </button>
          {branch?.latitude && (
            <p className="text-slate-400 text-[10px] text-center truncate">
              Within {branch.geofence_radius_m}m of {branch.name}
            </p>
          )}
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && checkInStep === "locating" && (
        <div className="bg-slate-800/80 rounded-lg p-3 text-center border border-slate-700">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
          <p className="text-xs text-slate-300 font-medium">Verifying location...</p>
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && checkInStep === "confirm" && (
        <div className="space-y-1.5">
          <div className="bg-slate-800 rounded-lg p-2 flex items-start gap-1.5 border border-slate-700 text-xs">
            <i className="ri-checkbox-circle-fill text-emerald-400 text-sm shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-slate-300 leading-snug">{checkInMessage}</p>
          </div>
          <button
            onClick={onConfirmClockIn}
            disabled={processing}
            className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors disabled:opacity-60 cursor-pointer"
          >
            <i className="ri-checkbox-circle-line text-sm" />
            <span>{processing ? "Checking In..." : "Check In"}</span>
          </button>
          <button
            onClick={onResetCheckInFlow}
            disabled={processing}
            className="w-full text-slate-400 hover:text-white text-[10.5px] text-center block transition-colors cursor-pointer py-0.5"
          >
            Cancel
          </button>
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && (checkInStep === "denied" || checkInStep === "error") && (
        <div className="space-y-1.5">
          <div className="bg-slate-800 rounded-lg p-2 flex items-start gap-1.5 border border-rose-500/30 text-xs">
            <i className="ri-error-warning-line text-rose-400 text-sm shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-200 leading-snug">{checkInMessage}</p>
          </div>
          <button
            onClick={onRequestClockIn}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <i className="ri-refresh-line text-xs" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {!hasOutsideToday && isCheckedIn && !isCheckedOut && (
        <div className="space-y-1.5">
          {isEarlyCheckoutNow && (
            <div className="space-y-1">
              <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg px-2.5 py-1.5">
                <p className="text-[10.5px] font-semibold text-amber-200 flex items-center gap-1">
                  <i className="ri-alarm-warning-line text-xs text-amber-300 shrink-0" />
                  <span>Early Checkout ({earlyCheckoutMinutesNow}m early)</span>
                </p>
              </div>
              <textarea
                value={earlyCheckoutReason}
                onChange={(e) => setEarlyCheckoutReason(e.target.value)}
                rows={1}
                maxLength={300}
                placeholder="Reason for early departure..."
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          )}
          <button
            onClick={onClockOut}
            disabled={processing}
            className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-900 font-bold py-2 px-4 rounded-lg text-xs transition-all disabled:opacity-60 cursor-pointer active:scale-98 shadow-xs"
          >
            <i className="ri-logout-box-r-line text-sm" />
            <span>{processing ? "Checking Out..." : "Check Out"}</span>
          </button>
        </div>
      )}

      {isCheckedOut && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2">
          <i className="ri-checkbox-circle-fill text-emerald-400 text-base shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-xs text-white">Day Complete</p>
            <p className="text-slate-400 text-[10.5px]">
              {todayRecord?.hours_worked ? `${fmtHM(todayRecord.hours_worked)} logged` : "Shift recorded"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
