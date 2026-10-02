import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Employee } from "../types";
import { useCheckInData } from "../hooks/useCheckInData";
import { usePermissions } from "@/hooks/usePermissions";
import { MobileAttendanceHeader } from "./MobileAttendanceHeader";

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
  unreadCount = 0,
}: MobilePresenceAttendanceProps) {
  const navigate = useNavigate();
  const employeeName = `${employee.first_name} ${employee.last_name}`.trim();
  const { can } = usePermissions();

  const d = useCheckInData({
    employeeId: employee.id,
    employeeName,
  });

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

  const quickShortcuts = [
    { id: "leave", label: "Ask Leave", icon: "ri-calendar-event-line", action: () => setActiveTab("leave"), hasDot: false },
    { id: "leaderboard", label: "Leaderboard", icon: "ri-medal-line", action: () => (can("performance") ? navigate("/performance") : setActiveTab("overview")), hasDot: false },
    { id: "news", label: "News", icon: "ri-newspaper-line", action: () => (can("announcements") ? navigate("/announcements") : setActiveTab("overview")), hasDot: true },
    { id: "predictor", label: "Predictor", icon: "ri-line-chart-line", action: () => setActiveTab("attendance"), hasDot: false },
    { id: "friends", label: "Friends", icon: "ri-group-line", action: () => (can("employees") ? navigate("/employees") : setActiveTab("overview")), hasDot: false },
    { id: "assignments", label: "Assignments", icon: "ri-edit-box-line", action: () => setActiveTab("daily-report"), hasDot: true },
  ];

  return (
    <div className="space-y-4 pb-20 font-sans text-slate-800 antialiased selection:bg-blue-100">
      {/* 1. Curved Primary Logo Header */}
      <MobileAttendanceHeader
        isCheckedIn={d.isCheckedIn}
        isCheckedOut={d.isCheckedOut}
        clockInTime={d.todayRecord?.clock_in}
        onClockOut={d.handleClockOut}
        onGoToCheckIn={() => setActiveTab("checkin")}
      />

      {/* Main Content Area */}
      <div className="px-4 space-y-3.5">
        {/* 2. Date & Weekly Status Card */}
        <div className="bg-white rounded-[24px] p-5 border border-[#E7ECF5] shadow-[0_4px_20px_rgba(37,60,125,0.04)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-2.5">
              <div className="flex items-start leading-none text-[#253C7D]">
                <span className="text-[32px] font-extrabold tracking-tight">{dateInfo.dayNum}</span>
                <span className="text-xs font-bold -mt-0.5 ml-0.5">{dateInfo.suffix}</span>
              </div>
              <div className="leading-tight pt-0.5">
                <h2 className="text-sm font-bold text-[#14234B]">{dateInfo.dayOfWeek}</h2>
                <p className="text-xs text-[#6B7B9E] mt-0.5 font-normal">{dateInfo.monthYear}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className="w-8 h-8 rounded-full bg-[#EEF3FA] text-[#253C7D] hover:bg-[#E2ECFA] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              title="View full calendar"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#6B7B9E] mb-3">This week status</p>
            <div className="flex items-center justify-between px-1">
              {currentWeekDays.map((day) => (
                <div key={day.ymd} className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#6B7B9E]">{day.label}</span>
                  {day.status === "present" && (
                    <div className="w-7 h-7 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      <i className="ri-check-line text-sm" />
                    </div>
                  )}
                  {day.status === "late" && (
                    <div className="w-7 h-7 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">L</div>
                  )}
                  {day.status === "absent" && (
                    <div className="w-7 h-7 rounded-full bg-[#FF5C77] text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs">A</div>
                  )}
                  {day.status === "upcoming" && (
                    <div className="w-7 h-7 rounded-full border-2 border-[#DCE4F2] bg-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 3x2 Grid Shortcuts Card */}
        <div className="bg-white rounded-[24px] border border-[#E7ECF5] shadow-[0_4px_20px_rgba(37,60,125,0.04)] grid grid-cols-3 divide-x divide-y divide-[#EDF2FA] overflow-hidden">
          {quickShortcuts.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="flex flex-col items-center justify-center py-4 px-2 hover:bg-[#F5F8FD] transition-colors text-center cursor-pointer group active:scale-95"
            >
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
