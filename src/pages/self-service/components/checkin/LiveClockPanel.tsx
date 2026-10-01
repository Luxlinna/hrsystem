import type { AttendanceRecord, BranchGeofence, OutsideWorkTask, CheckInStep } from "../../types";
import { LiveClockDisplay } from "./LiveClockDisplay";
import { LiveClockShiftSnapshot } from "./LiveClockShiftSnapshot";
import { LiveClockActions } from "./LiveClockActions";

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
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-200/90 dark:border-slate-800 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <LiveClockDisplay currentTime={props.currentTime} timezone={props.timezone} />
        <LiveClockShiftSnapshot
          shiftProgress={props.shiftProgress}
          todayRecord={props.todayRecord}
          elapsedHours={props.elapsedHours}
          isCheckedIn={props.isCheckedIn}
          isCheckedOut={props.isCheckedOut}
          workStartTime={props.workStartTime}
          workEndTime={props.workEndTime}
        />
        <LiveClockActions {...props} />
      </div>
    </div>
  );
}

