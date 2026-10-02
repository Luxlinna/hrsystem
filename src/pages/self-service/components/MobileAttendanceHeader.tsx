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
    <div className="relative overflow-hidden bg-[#0F2D6B] text-white px-5 pt-7 pb-10 rounded-b-[40px] shadow-[0_16px_36px_rgba(15,45,107,0.32)]">
      {/* Dynamic World Map & Cyan Wave Banner Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-95"
        style={{ backgroundImage: "url('/presence-banner-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A2256]/30 via-transparent to-[#071942]/60 pointer-events-none" />

      {/* Top App Bar Header */}
      <div className="flex items-center justify-between relative z-10 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl p-1.5 flex items-center justify-center shadow-md border border-white/90 shrink-0"
            style={{ backgroundColor: "#ffffff" }}
          >
            <img src="/logo-mark.png" alt="HRSystem" className="w-full h-full object-contain" />
          </div>
          <span className="text-[22px] font-bold text-white tracking-tight drop-shadow-sm select-none">
            HRSystem
          </span>
        </div>
      </div>

      {/* Floating Attendance Status Card */}
      <div className="relative z-10 bg-white dark:bg-slate-900/90 rounded-2xl p-3.5 px-4 shadow-[0_10px_28px_rgba(10,25,60,0.18)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.4)] border border-white/90 dark:border-white/10 flex items-center justify-between text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#EEF3FA] dark:bg-white/10 text-[#253C7D] dark:text-sky-300 flex items-center justify-center shrink-0 shadow-xs">
            <i className="ri-calendar-2-line text-lg" />
          </div>
          <div className="min-w-0">
            {isCheckedIn && !isCheckedOut ? (
              <div>
                <p className="text-[12px] font-semibold text-[#6B7B9E] dark:text-slate-400 leading-tight">Checked in at</p>
                <p className="text-[14px] font-extrabold text-[#14234B] dark:text-white mt-0.5 leading-tight tracking-tight">
                  {clockInTime || "08:18:26"}
                </p>
              </div>
            ) : isCheckedOut ? (
              <div>
                <p className="text-[12px] font-semibold text-[#6B7B9E] dark:text-slate-400 leading-tight">Attendance</p>
                <p className="text-[14px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 leading-tight tracking-tight">
                  Completed ✓
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[12px] font-semibold text-[#6B7B9E] dark:text-slate-400 leading-tight">Attendance</p>
                <p className="text-[14px] font-extrabold text-[#14234B] dark:text-white mt-0.5 leading-tight tracking-tight">
                  Take attendance
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={isCheckedIn && !isCheckedOut ? onClockOut : onGoToCheckIn}
          className={`px-6 py-3 min-w-[112px] text-center rounded-2xl text-[14px] font-bold text-white tracking-wide transition-all active:scale-95 cursor-pointer shrink-0 shadow-lg ${
            isCheckedOut
              ? "bg-emerald-600 cursor-default shadow-emerald-600/25"
              : "bg-[#29ABE2] hover:bg-[#2096C7] active:bg-[#1984B2] shadow-[#29ABE2]/35"
          }`}
        >
          {isCheckedIn && !isCheckedOut ? "Check Out" : isCheckedOut ? "Done ✓" : "Check In"}
        </button>
      </div>
    </div>
  );
});
