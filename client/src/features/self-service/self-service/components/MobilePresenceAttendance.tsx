import { memo, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Employee } from "../types";
import { useCheckInData } from "../hooks/useCheckInData";
import { usePermissions } from "@/hooks/usePermissions";
import { MobileAttendanceHeader } from "./MobileAttendanceHeader";
import { CheckoutReasonModal } from "./checkin/CheckoutReasonModal";
import { MobileQuickShortcutsCard } from "./MobileQuickShortcutsCard";

import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

interface MobilePresenceAttendanceProps {
  employee: Employee;
  managerName?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
  pendingLeaveCount?: number;
}

export const MobilePresenceAttendance = memo(function MobilePresenceAttendance({
  employee,
  setActiveTab,
}: MobilePresenceAttendanceProps) {
  const navigate = useNavigate();
  const employeeName = formatKhmerFullName(employee);
  const { can } = usePermissions();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const d = useCheckInData({
    employeeId: employee.id,
    employeeName,
  });

  const handleMobileClockOut = async () => {
    const res = await d.verifyLocation("check out");
    if (!res.allowed) return;

    if (d.isEarlyCheckoutNow) {
      setShowCheckoutModal(true);
    } else {
      await d.handleClockOut({ skipLocationCheck: true });
    }
  };

  const handleConfirmModalClockOut = async () => {
    await d.handleClockOut({ skipLocationCheck: true });
    setShowCheckoutModal(false);
  };

  const dateInfo = useMemo(() => {
    const now = new Date();
    const dayNum = now.getDate();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
    const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const suffix =
      dayNum % 10 === 1 && dayNum !== 11
        ? "st"
        : dayNum % 10 === 2 && dayNum !== 12
        ? "nd"
        : dayNum % 10 === 3 && dayNum !== 13
        ? "rd"
        : "th";
    return { dayNum, dayOfWeek, monthYear, suffix };
  }, []);

  const currentWeekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMon);

    const labels = ["M", "T", "W", "Th", "Fr"];
    return labels.map((label, idx) => {
      const dDate = new Date(monday);
      dDate.setDate(monday.getDate() + idx);
      const ymd = dDate.toISOString().slice(0, 10);
      const todayYmd = now.toISOString().slice(0, 10);
      const record = d.records.find((r) => r.date === ymd);
      const isPast = ymd < todayYmd;
      const isToday = ymd === todayYmd;

      let status: "present" | "absent" | "late" | "upcoming" = "upcoming";
      if (record) {
        status = record.status === "late" ? "late" : record.status === "absent" ? "absent" : "present";
      } else if (isToday) {
        status = d.isCheckedIn ? "present" : "upcoming";
      } else if (isPast) {
        status = "present";
      }
      return { label, ymd, status };
    });
  }, [d.records, d.isCheckedIn]);

  return (
    <div className="space-y-4 pb-28 font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-blue-100">
      {/* Toast Notification */}
      {d.toast && (
        <div
          className={`fixed left-4 right-4 z-50 px-4 py-3 rounded-2xl text-xs font-bold text-white shadow-xl flex items-center justify-between transition-all ${
            d.toast.type === "success" ? "bg-[#253C7D] dark:bg-sky-600" : "bg-rose-600"
          }`}
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 14px)" }}
        >
          <span>{d.toast.message}</span>
        </div>
      )}

      {/* 1. Curved Primary Logo Header */}
      <MobileAttendanceHeader
        isCheckedIn={d.isCheckedIn}
        isCheckedOut={d.isCheckedOut}
        clockInTime={d.todayRecord?.clock_in}
        isOnTimeToCheckout={d.isCheckedIn && !d.isCheckedOut && !d.isEarlyCheckoutNow}
        processing={d.processing}
        checkInStep={d.checkInStep}
        onClockOut={handleMobileClockOut}
        onClockIn={d.handleRequestClockIn}
      />

      {/* 100m Geofence Warning Card if Outside Allowed Building Area */}
      {(d.checkInStep === "denied" || d.checkInStep === "error") && (
        <div className="mx-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-700/60 rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
              <i className="ri-map-pin-range-line text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                  Outside 100m Building Area
                </h4>
                <button
                  type="button"
                  onClick={d.resetCheckInFlow}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                >
                  <i className="ri-close-line text-sm" />
                </button>
              </div>
              <p className="text-[12px] text-rose-700 dark:text-rose-300 mt-1 leading-snug">
                {d.checkInMessage}
              </p>
              {d.checkInDistance != null && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100/80 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 text-[11px] font-semibold">
                  <i className="ri-compass-3-line text-xs" />
                  <span>Current Distance: {d.checkInDistance}m (Max allowed: {d.branch?.geofence_radius_m || 100}m)</span>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={d.isCheckedIn && !d.isCheckedOut ? handleMobileClockOut : d.handleRequestClockIn}
            disabled={d.processing || d.checkInStep === "locating"}
            className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
          >
            <i className="ri-refresh-line text-sm" />
            <span>{d.isCheckedIn && !d.isCheckedOut ? "Retry Check Out" : "Retry Check In"}</span>
          </button>
        </div>
      )}

      {/* Early Check Out Reason Modal (Only shown if leaving before shift end time) */}
      <CheckoutReasonModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        reason={d.earlyCheckoutReason}
        onReasonChange={d.setEarlyCheckoutReason}
        onConfirm={handleConfirmModalClockOut}
        processing={d.processing}
        earlyMinutes={d.earlyCheckoutMinutesNow}
        isEarly={d.isEarlyCheckoutNow}
      />

      {/* Main Content Area */}
      <div className="px-4 space-y-3.5">
        {/* 2. Date & Weekly Status Card */}
        <div className="bg-white dark:bg-slate-900/90 rounded-[24px] p-5 border border-[#E7ECF5] dark:border-white/10 shadow-[0_4px_20px_rgba(37,60,125,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-2.5">
              <div className="flex items-start leading-none text-[#253C7D] dark:text-sky-400">
                <span className="text-[32px] font-extrabold tracking-tight">{dateInfo.dayNum}</span>
                <span className="text-xs font-bold -mt-0.5 ml-0.5">{dateInfo.suffix}</span>
              </div>
              <div className="leading-tight pt-0.5">
                <h2 className="text-sm font-bold text-[#14234B] dark:text-white">{dateInfo.dayOfWeek}</h2>
                <p className="text-xs text-[#6B7B9E] dark:text-slate-400 mt-0.5 font-normal">{dateInfo.monthYear}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className="w-8 h-8 rounded-full bg-[#EEF3FA] dark:bg-white/10 text-[#253C7D] dark:text-sky-300 hover:bg-[#E2ECFA] dark:hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              title="View full calendar"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#6B7B9E] dark:text-slate-400 mb-3">This week status</p>
            <div className="flex items-center justify-between px-1">
              {currentWeekDays.map((day) => (
                <div key={day.ymd} className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#6B7B9E] dark:text-slate-400">{day.label}</span>
                  {day.status === "present" && (
                    <div className="w-7 h-7 rounded-full bg-[#253C7D] dark:bg-sky-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      <i className="ri-check-line text-sm" />
                    </div>
                  )}
                  {day.status === "late" && (
                    <div className="w-7 h-7 rounded-full bg-[#3B62AC] dark:bg-blue-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">L</div>
                  )}
                  {day.status === "absent" && (
                    <div className="w-7 h-7 rounded-full bg-[#FF5C77] text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">A</div>
                  )}
                  {day.status === "upcoming" && (
                    <div className="w-7 h-7 rounded-full border-2 border-[#DCE4F2] dark:border-slate-700 bg-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 3x2 Grid Shortcuts Card */}
        <MobileQuickShortcutsCard
          onNavigateTab={setActiveTab}
          onNavigatePath={navigate}
          canAnnouncements={can("announcements")}
          canPerformance={can("performance")}
          canEmployees={can("employees")}
        />
      </div>
    </div>
  );
});
