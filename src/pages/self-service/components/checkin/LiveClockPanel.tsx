import { Link } from "react-router-dom";
import type { AttendanceRecord, BranchGeofence, OutsideWorkTask, CheckInStep } from "../../types";
import { fmtHM, fmtClock } from "../../selfServiceUtils";

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
    <div className="bg-gradient-to-br from-[#253C7D] via-[#2E5AA8] to-[#29ABE2] rounded-2xl p-5 sm:p-6 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-5 lg:gap-7 items-center">
        <LiveClock {...props} />
        <ShiftSnapshot {...props} />
        <CheckInActions {...props} />
      </div>
    </div>
  );
}

function LiveClock({ currentTime, timezone }: Pick<Props, "currentTime" | "timezone">) {
  return (
    <div className="lg:pr-7 lg:border-r lg:border-white/15">
      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Live Clock</p>
      <p className="text-4xl font-bold font-mono tracking-tight tabular-nums">
        {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: timezone })}
      </p>
      <p className="text-white/70 text-[12px] mt-1">
        {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: timezone })}
      </p>
    </div>
  );
}

function ShiftSnapshot(props: Props) {
  const {
    shiftProgress, activeOutsideWork, todayOutsideWork, todayRecord, isCheckedIn, isCheckedOut,
    elapsedHours, scheduleSettings,
  } = props;

  const hasOutsideToday = todayOutsideWork && todayOutsideWork.work_status !== "checked_out";

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between text-[11px] font-semibold text-white/75 mb-2">
        <span>Today's Shift</span>
        <span>{scheduleSettings.timezone?.replace("_", " ") || "Cambodia"}</span>
      </div>

      {shiftProgress !== null && (
        <div className="relative h-2 rounded-full bg-white/15 overflow-hidden mb-3">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/80 transition-all duration-1000"
            style={{ width: `${shiftProgress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 border border-white/15">
          <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider">In</p>
          <p className="text-[15px] font-bold tabular-nums mt-0.5">
            {todayRecord?.clock_in?.slice(0, 5) || (activeOutsideWork?.work_checked_in_at ? new Date(activeOutsideWork.work_checked_in_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—")}
          </p>
          {(todayRecord?.late_minutes || 0) > scheduleSettings.lateGraceMinutes && (
            <p className="text-amber-200 text-[10px] font-semibold mt-0.5">{todayRecord?.late_minutes}m late</p>
          )}
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 border border-white/15">
          <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider">Out</p>
          <p className="text-[15px] font-bold tabular-nums mt-0.5">
            {todayRecord?.clock_out?.slice(0, 5) || "—"}
          </p>
          {(todayRecord?.early_leave_minutes || 0) > scheduleSettings.earlyLeaveGraceMinutes && (
            <p className="text-orange-200 text-[10px] font-semibold mt-0.5">{todayRecord?.early_leave_minutes}m early</p>
          )}
        </div>
        <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 border border-white/15">
          <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider">
            {hasOutsideToday ? "Status" : isCheckedIn && !isCheckedOut ? "Working" : "Hours"}
          </p>
          <p className="text-[15px] font-bold tabular-nums mt-0.5">
            {hasOutsideToday
              ? "Outside"
              : isCheckedIn && !isCheckedOut
              ? fmtHM(elapsedHours)
              : todayRecord?.hours_worked
              ? fmtHM(todayRecord.hours_worked)
              : "—"}
          </p>
          {hasOutsideToday || (isCheckedIn && !isCheckedOut) ? (
            <p className="text-emerald-200 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-300" />
              </span>
              Live
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CheckInActions(props: Props) {
  const {
    activeOutsideWork, todayOutsideWork, isCheckedIn, isCheckedOut, checkInStep, checkInMessage, processing,
    notes, setNotes, earlyCheckoutReason, setEarlyCheckoutReason, earlyCheckoutMinutesNow,
    isEarlyCheckoutNow, branch, branchLoading, todayRecord, scheduleSettings,
    onRequestClockIn, onConfirmClockIn, onClockOut, onResetCheckInFlow,
  } = props;

  const currentOutsideTask = todayOutsideWork || activeOutsideWork;
  const hasOutsideToday = !!(currentOutsideTask && currentOutsideTask.work_status !== "checked_out");

  return (
    <div className="flex flex-col gap-2 lg:w-72">
      {hasOutsideToday && (
        <div className="bg-white/15 border border-white/30 rounded-xl px-4 py-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300" />
            </span>
            <p className="text-[13px] font-bold text-white">
              {currentOutsideTask.work_status === "checked_in" ? "Outside Work in Progress" : "Outside Work Assigned Today"}
            </p>
          </div>
          <p className="text-[12px] text-white/80 leading-relaxed">
            {currentOutsideTask.work_status === "checked_in" ? (
              <>You are currently checked in to <strong className="text-white font-semibold">{currentOutsideTask.title}</strong>. Check-out must be completed in Task Management with location and photos.</>
            ) : (
              <>You have an outside work task scheduled for today (<strong className="text-white font-semibold">{currentOutsideTask.title}</strong>). Check-in and check-out must be performed in Task Management.</>
            )}
          </p>
          {currentOutsideTask.work_address && (
            <p className="text-white/70 text-[11px] flex items-center gap-1">
              <i className="ri-map-pin-2-fill text-amber-300 shrink-0" />
              <span className="truncate">{currentOutsideTask.work_address}</span>
            </p>
          )}
          <Link
            to="/tasks"
            className="w-full flex items-center justify-center gap-2 bg-white text-[#253C7D] font-bold py-2.5 px-4 rounded-xl text-[13px] hover:bg-white/90 transition-colors cursor-pointer"
          >
            <i className="ri-task-line text-base" />
            {currentOutsideTask.work_status === "checked_in" ? "Go to Task Management to Check Out" : "Go to Task Management to Check In"}
          </Link>
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && checkInStep === "idle" && (
        <div className="space-y-2">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note (e.g. working from home)..."
            className="w-full px-3 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-[12px] text-white placeholder:text-white/50 focus:outline-none focus:border-white/60"
          />
          <button
            onClick={onRequestClockIn}
            disabled={processing || branchLoading}
            className="w-full flex items-center justify-center gap-2 bg-white text-[#253C7D] font-bold py-3 px-6 rounded-xl text-[14px] hover:bg-white/90 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <i className="ri-map-pin-line text-lg" />
            Check In
          </button>
          {branch?.latitude && (
            <p className="text-white/60 text-[11px] text-center">
              <i className="ri-map-pin-line mr-1" />
              Within {branch.geofence_radius_m}m of {branch.name}
            </p>
          )}
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && checkInStep === "locating" && (
        <div className="bg-white/20 rounded-xl px-5 py-4 text-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-[13px] font-semibold">Checking your location...</p>
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && checkInStep === "confirm" && (
        <div className="space-y-2">
          <div className="bg-white/20 rounded-xl px-4 py-3 flex items-start gap-2">
            <i className="ri-checkbox-circle-fill text-emerald-300 text-base shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed">{checkInMessage}</p>
          </div>
          <button
            onClick={onConfirmClockIn}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 bg-white text-[#253C7D] font-bold py-3 px-6 rounded-xl text-[14px] hover:bg-white/90 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <i className="ri-checkbox-circle-line text-lg" />
            {processing ? "Checking in..." : "Confirm Check In"}
          </button>
          <p className="text-white/60 text-[11px] text-center">
            Your arrival time will be recorded after you confirm.
          </p>
          <button
            onClick={onResetCheckInFlow}
            disabled={processing}
            className="w-full text-white/70 text-[11px] hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {!hasOutsideToday && !isCheckedIn && (checkInStep === "denied" || checkInStep === "error") && (
        <div className="space-y-2">
          <div className="bg-white/20 rounded-xl px-4 py-3 flex items-start gap-2">
            <i className={`${checkInStep === "denied" ? "ri-map-pin-off-line text-amber-300" : "ri-error-warning-line text-red-300"} text-base shrink-0 mt-0.5`} />
            <p className="text-[12px] leading-relaxed">{checkInMessage}</p>
          </div>
          <button
            onClick={onRequestClockIn}
            className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur border border-white/40 text-white font-bold py-2.5 px-6 rounded-xl text-[13px] hover:bg-white/30 transition-colors cursor-pointer"
          >
            <i className="ri-refresh-line text-base" />
            Try Again
          </button>
        </div>
      )}

      {!hasOutsideToday && isCheckedIn && !isCheckedOut && (
        <div className="space-y-2">
          {isEarlyCheckoutNow && (
            <div className="space-y-1">
              <div className="bg-amber-400/20 border border-amber-200/40 rounded-xl px-4 py-3">
                <p className="text-[12px] font-semibold text-amber-100">
                  Checking out {earlyCheckoutMinutesNow} minutes early. Reason is required.
                </p>
              </div>
              <textarea
                value={earlyCheckoutReason}
                onChange={(e) => setEarlyCheckoutReason(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Reason for early checkout..."
                className="w-full px-3 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-[12px] text-white placeholder:text-white/50 focus:outline-none focus:border-white/60 resize-none"
              />
            </div>
          )}
          <button
            onClick={onClockOut}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur border border-white/40 text-white font-bold py-3 px-6 rounded-xl text-[14px] hover:bg-white/30 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <i className="ri-logout-box-r-line text-lg" />
            {processing ? "Checking out..." : "Check Out"}
          </button>
        </div>
      )}

      {isCheckedOut && (
        <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <i className="ri-checkbox-circle-fill text-xl text-emerald-300 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-[14px]">Day Complete</p>
            <p className="text-white/70 text-[11px] mt-0.5">
              {todayRecord?.hours_worked ? `${fmtHM(todayRecord.hours_worked)} logged today` : "Shift recorded"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
