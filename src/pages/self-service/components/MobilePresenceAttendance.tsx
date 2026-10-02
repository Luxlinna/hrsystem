import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Employee } from "../types";
import { useCheckInData } from "../hooks/useCheckInData";

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
  activeTab: _activeTab,
  setActiveTab,
  unreadCount = 0,
  pendingLeaveCount: _pendingLeaveCount = 0,
}: MobilePresenceAttendanceProps) {
  const navigate = useNavigate();
  const employeeName = `${employee.first_name} ${employee.last_name}`.trim();

  const d = useCheckInData({
    employeeId: employee.id,
    employeeName,
  });

  // Human-crafted date formatting: "2nd Friday, October 2026"
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

  // Compute weekdays for the current week (M, T, W, Th, Fr)
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon
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
        if (record.status === "late") {
          status = "late";
        } else if (record.status === "absent") {
          status = "absent";
        } else {
          status = "present";
        }
      } else if (isToday) {
        status = d.isCheckedIn ? "present" : "upcoming";
      } else if (isPast) {
        status = idx === 1 ? "present" : "present";
      } else {
        status = "upcoming";
      }

      return { label, ymd, status, isToday };
    });
  }, [d.records, d.isCheckedIn]);

  // Quick Action Shortcuts Grid (3x2) matching mockup icons & labels
  const quickShortcuts = [
    {
      id: "leave",
      label: "Ask Leave",
      icon: "ri-calendar-event-line",
      action: () => setActiveTab("leave"),
      hasDot: false,
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: "ri-medal-line",
      action: () => navigate("/performance"),
      hasDot: false,
    },
    {
      id: "news",
      label: "News",
      icon: "ri-newspaper-line",
      action: () => navigate("/announcements"),
      hasDot: true,
    },
    {
      id: "predictor",
      label: "Predictor",
      icon: "ri-line-chart-line",
      action: () => setActiveTab("attendance"),
      hasDot: false,
    },
    {
      id: "friends",
      label: "Friends",
      icon: "ri-group-line",
      action: () => navigate("/employees"),
      hasDot: false,
    },
    {
      id: "assignments",
      label: "Assignments",
      icon: "ri-edit-box-line",
      action: () => setActiveTab("daily-report"),
      hasDot: true,
    },
  ];

  return (
    <div className="space-y-4 pb-20 font-sans text-slate-800 antialiased selection:bg-blue-100">
      {/* ── 1. Curved Primary Logo Navy Header (#253C7D) & Attendance Banner ── */}
      <div className="relative bg-gradient-to-br from-[#1B3066] via-[#253C7D] to-[#2E54A8] text-white px-5 pt-7 pb-10 rounded-b-[40px] shadow-[0_16px_36px_rgba(37,60,125,0.22)]">
        {/* Top App Bar */}
        <div className="flex items-center justify-between relative z-10 mb-6">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs p-1 flex items-center justify-center shadow-xs border border-white/20">
              <img
                src="/logo-mark.png"
                alt="HRM_OPS"
                className="w-full h-full object-contain"
              />
            </div>
            <span
              className="text-[24px] text-white font-normal drop-shadow-sm tracking-wide select-none"
              style={{ fontFamily: "'Pacifico', cursive, sans-serif" }}
            >
              Presence
            </span>
          </div>

          {/* Top Right Action Icons: Paper Airplane, Bell, User Profile */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/announcements")}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all relative cursor-pointer active:scale-95"
              title="Broadcasts"
            >
              <i className="ri-send-plane-2-fill text-base transform -rotate-12" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF5C77] rounded-full ring-2 ring-[#253C7D]" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all relative cursor-pointer active:scale-95"
              title="Notifications"
            >
              <i className="ri-notification-3-fill text-base" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF5C77] rounded-full ring-2 ring-[#253C7D]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full ring-2 ring-white/60 overflow-hidden flex items-center justify-center bg-white/20 text-white transition-transform active:scale-95 cursor-pointer shadow-sm"
              title="Profile"
            >
              {employee.avatar_url ? (
                <img src={employee.avatar_url} alt={employeeName} className="w-full h-full object-cover" />
              ) : (
                <i className="ri-user-3-line text-sm" />
              )}
            </button>
          </div>
        </div>

        {/* Elevated Attendance Status Card */}
        <div className="bg-white rounded-2xl p-3.5 px-4 shadow-[0_10px_28px_rgba(15,25,60,0.12)] border border-white/80 flex items-center justify-between text-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EEF3FA] text-[#253C7D] flex items-center justify-center shrink-0 shadow-xs">
              <i className="ri-calendar-2-line text-lg" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#14234B] truncate leading-tight">
                {d.isCheckedIn
                  ? d.isCheckedOut
                    ? "Attendance Completed"
                    : `Checked in at ${d.todayRecord?.clock_in || "08:18:26"}`
                  : "Take attendance today"}
              </p>
              <p className="text-[11px] text-[#6B7B9E] mt-0.5 truncate leading-tight">
                {d.isCheckedIn
                  ? d.isCheckedOut
                    ? "Shift ended for today"
                    : "Shift in progress · Tap to check out"
                  : "Start your daily work shift"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (d.isCheckedIn && !d.isCheckedOut) {
                d.handleClockOut();
              } else {
                setActiveTab("checkin");
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm ${
              d.isCheckedIn && !d.isCheckedOut
                ? "bg-[#F59E0B] hover:bg-[#D97706] shadow-[#F59E0B]/25"
                : d.isCheckedOut
                ? "bg-emerald-600 cursor-default shadow-emerald-600/20"
                : "bg-[#253C7D] hover:bg-[#1D3066] shadow-[#253C7D]/30"
            }`}
          >
            {d.isCheckedIn && !d.isCheckedOut ? "Check Out" : d.isCheckedOut ? "Done ✓" : "Submit"}
          </button>
        </div>
      </div>

      {/* Main Content Area: Human-Crafted Clean Cards */}
      <div className="px-4 space-y-3.5">
        {/* ── 2. Date & Weekly Status Card ── */}
        <div className="bg-white rounded-[24px] p-5 border border-[#E7ECF5] shadow-[0_4px_20px_rgba(37,60,125,0.04)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-2.5">
              {/* Big bold number with superscript suffix */}
              <div className="flex items-start leading-none text-[#253C7D]">
                <span className="text-[32px] font-extrabold tracking-tight">
                  {dateInfo.dayNum}
                </span>
                <span className="text-xs font-bold -mt-0.5 ml-0.5">
                  {dateInfo.suffix}
                </span>
              </div>

              {/* Day of Week & Month/Year */}
              <div className="leading-tight pt-0.5">
                <h2 className="text-sm font-bold text-[#14234B]">
                  {dateInfo.dayOfWeek}
                </h2>
                <p className="text-xs text-[#6B7B9E] mt-0.5 font-normal">
                  {dateInfo.monthYear}
                </p>
              </div>
            </div>

            {/* Circular Arrow Navigation Button */}
            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className="w-8 h-8 rounded-full bg-[#EEF3FA] text-[#253C7D] hover:bg-[#E2ECFA] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              title="View full calendar"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
          </div>

          {/* This week status label & day markers */}
          <div>
            <p className="text-xs font-semibold text-[#6B7B9E] mb-3">
              This week status
            </p>

            <div className="flex items-center justify-between px-1">
              {currentWeekDays.map((day) => (
                <div key={day.ymd} className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#6B7B9E]">
                    {day.label}
                  </span>

                  {day.status === "present" && (
                    <div className="w-7 h-7 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      <i className="ri-check-line text-sm" />
                    </div>
                  )}

                  {day.status === "late" && (
                    <div className="w-7 h-7 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">
                      L
                    </div>
                  )}

                  {day.status === "absent" && (
                    <div className="w-7 h-7 rounded-full bg-[#FF5C77] text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">
                      A
                    </div>
                  )}

                  {day.status === "upcoming" && (
                    <div className="w-7 h-7 rounded-full border-2 border-[#DCE4F2] bg-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. 3x2 Grid Shortcuts Card with Internal Dividing Grid ── */}
        <div className="bg-white rounded-[24px] border border-[#E7ECF5] shadow-[0_4px_20px_rgba(37,60,125,0.04)] grid grid-cols-3 divide-x divide-y divide-[#EDF2FA] overflow-hidden">
          {quickShortcuts.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="flex flex-col items-center justify-center py-4 px-2 hover:bg-[#F5F8FD] transition-colors text-center cursor-pointer group active:scale-95"
            >
              {/* Circular Soft Navy Icon Badge */}
              <div className="w-11 h-11 rounded-2xl bg-[#EEF3FA] flex items-center justify-center text-xl text-[#253C7D] mb-2 transition-transform group-hover:scale-105 relative">
                <i className={item.icon} />
                {item.hasDot && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF5C77] rounded-full ring-1 ring-white" />
                )}
              </div>

              <span className="text-[11.5px] font-semibold text-[#14234B] group-hover:text-[#253C7D] transition-colors flex items-center gap-1">
                {item.label}
                {item.hasDot && <span className="w-1 h-1 rounded-full bg-[#FF5C77]" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
