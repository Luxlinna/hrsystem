import { memo } from "react";
import type { AttendanceRecord, Employee } from "../types";
import { formatTime, calcHours, initials } from "../constants";

interface SelfCheckInBannerProps {
  myEmployee: Employee | null;
  myTodayRecord: AttendanceRecord | null;
}

export const SelfCheckInBanner = memo(function SelfCheckInBanner({
  myEmployee,
  myTodayRecord,
}: SelfCheckInBannerProps) {
  if (!myEmployee) return null;

  return (
    <div className="bg-gradient-to-r from-[#253C7D] to-[#17254E] rounded-3xl p-5 sm:p-6 text-white shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center font-bold text-base border border-white/20">
          {initials(myEmployee.first_name, myEmployee.last_name)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-sky-200">Personal Punch Card</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            Welcome, {myEmployee.first_name} {myEmployee.last_name}
          </h3>
          <p className="text-xs text-white/70 mt-0.5">
            {myTodayRecord?.clock_in
              ? `Checked in at ${formatTime(myTodayRecord.clock_in)} · ${
                  myTodayRecord.clock_out ? `Checked out at ${formatTime(myTodayRecord.clock_out)}` : "Currently Working"
                }`
              : "You haven't checked in today yet."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!myTodayRecord?.clock_in ? (
          <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-semibold text-white/70 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Not Checked In Today
          </div>
        ) : !myTodayRecord?.clock_out ? (
          <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-semibold text-sky-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Currently Working
          </div>
        ) : (
          <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
            <i className="ri-checkbox-circle-fill text-emerald-400" />
            Shift Completed Today ({calcHours(myTodayRecord.clock_in, myTodayRecord.clock_out)})
          </div>
        )}
      </div>
    </div>
  );
});
