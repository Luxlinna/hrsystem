import { memo } from "react";

interface MobileAttendanceHeaderProps {
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  clockInTime?: string;
  onClockOut: () => void;
  onGoToCheckIn: () => void;
}

export const MobileAttendanceHeader = memo(function MobileAttendanceHeader({
  isCheckedIn,
  isCheckedOut,
  clockInTime,
  onClockOut,
  onGoToCheckIn,
}: MobileAttendanceHeaderProps) {
  return (
    <div className="relative bg-gradient-to-br from-[#1B3066] via-[#253C7D] to-[#2E54A8] text-white px-5 pt-7 pb-10 rounded-b-[40px] shadow-[0_16px_36px_rgba(37,60,125,0.22)]">
      {/* Top App Bar Header */}
      <div className="flex items-center justify-between relative z-10 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs p-1 flex items-center justify-center shadow-xs border border-white/20">
            <img src="/logo-mark.png" alt="HRM_OPS" className="w-full h-full object-contain" />
          </div>
          <span
            className="text-[24px] text-white font-normal drop-shadow-sm tracking-wide select-none"
            style={{ fontFamily: "'Pacifico', cursive, sans-serif" }}
          >
            Presence
          </span>
        </div>
      </div>

      {/* Floating Attendance Status Card */}
      <div className="bg-white rounded-2xl p-3.5 px-4 shadow-[0_10px_28px_rgba(15,25,60,0.12)] border border-white/80 flex items-center justify-between text-slate-800">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#EEF3FA] text-[#253C7D] flex items-center justify-center shrink-0 shadow-xs">
            <i className="ri-calendar-2-line text-lg" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#14234B] truncate leading-tight">
              {isCheckedIn
                ? isCheckedOut
                  ? "Attendance Completed"
                  : `Checked in at ${clockInTime || "08:18:26"}`
                : "Take attendance today"}
            </p>
            <p className="text-[11px] text-[#6B7B9E] mt-0.5 truncate leading-tight">
              {isCheckedIn
                ? isCheckedOut
                  ? "Shift ended for today"
                  : "Shift in progress · Tap to check out"
                : "Start your daily work shift"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={isCheckedIn && !isCheckedOut ? onClockOut : onGoToCheckIn}
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm ${
            isCheckedIn && !isCheckedOut
              ? "bg-[#F59E0B] hover:bg-[#D97706] shadow-[#F59E0B]/25"
              : isCheckedOut
              ? "bg-emerald-600 cursor-default shadow-emerald-600/20"
              : "bg-[#253C7D] hover:bg-[#1D3066] shadow-[#253C7D]/30"
          }`}
        >
          {isCheckedIn && !isCheckedOut ? "Check Out" : isCheckedOut ? "Done ✓" : "Submit"}
        </button>
      </div>
    </div>
  );
});
