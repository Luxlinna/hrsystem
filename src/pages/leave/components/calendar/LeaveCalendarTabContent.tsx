import { memo, useState } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { LeaveCalendarDayAgenda } from "./LeaveCalendarDayAgenda";
import type { Holiday } from "@/services/holidays/holidaysService";
import {
  GREGORIAN_MONTHS_KM,
  toKhmerNumber,
  toKhmerLunarDate,
  isSilDay,
} from "khmer-chhankitek-calendar";

interface LeaveCalendarTabContentProps {
  calendarYear: number;
  calendarMonth: number;
  selectedCalendarDay: number | null;
  setSelectedCalendarDay: (d: number | null) => void;
  calDeptFilter: string;
  setCalDeptFilter: (dept: string) => void;
  departments: string[];
  calendarDays: {
    day: number;
    dateStr: string;
    leaves: LeaveRequest[];
    holiday?: Holiday;
  }[];
  firstDayOfWeek: number;
  prevMonth: () => void;
  nextMonth: () => void;
  todayMonth: () => void;
  selectedDayDateStr: string | null;
  selectedDayLeaves: LeaveRequest[];
  selectedDayHoliday?: Holiday | null;
  onInspectRequest: (req: LeaveRequest) => void;
  onOpenHolidaysModal?: () => void;
  holidayCount?: number;
}

export const LeaveCalendarTabContent = memo(function LeaveCalendarTabContent({
  calendarYear,
  calendarMonth,
  selectedCalendarDay,
  setSelectedCalendarDay,
  calDeptFilter,
  setCalDeptFilter,
  departments,
  calendarDays,
  firstDayOfWeek,
  prevMonth,
  nextMonth,
  todayMonth,
  selectedDayLeaves,
  selectedDayHoliday,
  onInspectRequest,
  onOpenHolidaysModal,
  holidayCount,
}: LeaveCalendarTabContentProps) {
  const [calendarLang, setCalendarLang] = useState<"en" | "km">(() => {
    try {
      return (localStorage.getItem("leave_calendar_lang") as "en" | "km") || "en";
    } catch {
      return "en";
    }
  });

  const handleToggleLang = (lang: "en" | "km") => {
    setCalendarLang(lang);
    try {
      localStorage.setItem("leave_calendar_lang", lang);
    } catch {}
  };

  const isKm = calendarLang === "km";

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dayHeadersEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayHeadersKm = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហ", "សុក្រ", "សៅរ៍"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-black text-gray-900">
              {isKm
                ? `ខែ${GREGORIAN_MONTHS_KM[calendarMonth]} ឆ្នាំ${toKhmerNumber(calendarYear)}`
                : `${monthNamesEn[calendarMonth]} ${calendarYear}`}
            </h3>
            <button
              type="button"
              onClick={todayMonth}
              className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              {isKm ? "ថ្ងៃនេះ" : "Today"}
            </button>
            {onOpenHolidaysModal && (
              <button
                type="button"
                onClick={onOpenHolidaysModal}
                className="px-2.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Cambodia Labor Law Public Holidays"
              >
                <span>🎉</span>
                <span>{isKm ? "បុណ្យជាតិ" : "Public Holidays"}</span>
                {holidayCount !== undefined && holidayCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-extrabold">
                    {isKm ? toKhmerNumber(holidayCount) : holidayCount}
                  </span>
                )}
              </button>
            )}

            {/* Language Toggle: English / Khmer */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={() => handleToggleLang("en")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  calendarLang === "en"
                    ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-blue-200 shadow-xs font-extrabold"
                    : "text-gray-500 hover:text-gray-900 dark:text-slate-400"
                }`}
                title="View Calendar in English"
              >
                <span>🇬🇧</span>
                <span>EN</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleLang("km")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  calendarLang === "km"
                    ? "bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-200 shadow-xs font-extrabold"
                    : "text-gray-500 hover:text-gray-900 dark:text-slate-400"
                }`}
                title="មើលប្រតិទិនជាភាសាខ្មែរ (ចន្ទគតិ និងបុណ្យជាតិ)"
              >
                <span>🇰🇭</span>
                <span>ខ្មែរ</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {departments.length > 0 && (
              <select
                value={calDeptFilter}
                onChange={(e) => setCalDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="all">{isKm ? "គ្រប់ផ្នែកទាំងអស់" : "All Departments"}</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-s-line text-base" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-right-s-line text-base" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {(isKm ? dayHeadersKm : dayHeadersEn).map((d) => (
            <span key={d} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1 font-sans">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[72px] sm:min-h-[90px] rounded-2xl bg-gray-50/40 p-1.5" />
          ))}

          {calendarDays.map(({ day, dateStr, leaves, holiday }) => {
            const isSelected = selectedCalendarDay === day;
            const hasLeaves = leaves.length > 0;
            const isHoliday = Boolean(holiday);

            let lunarDayText = "";
            let isSil = false;
            if (isKm) {
              try {
                const dObj = new Date(dateStr + "T00:00:00");
                const l = toKhmerLunarDate(dObj);
                lunarDayText = `${l.moonDayKhmer || l.moonDay}${l.moonStatus || ""}`;
                isSil = isSilDay(dObj);
              } catch {}
            }

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedCalendarDay(day)}
                className={`min-h-[72px] sm:min-h-[90px] rounded-2xl p-1.5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#253C7D]/5 border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                    : isHoliday
                    ? "bg-purple-50/30 border-purple-200/80 hover:border-purple-300 dark:bg-purple-950/20 dark:border-purple-900/60"
                    : isSil
                    ? "bg-amber-50/20 border-amber-200/60 hover:border-amber-300"
                    : hasLeaves
                    ? "bg-white border-gray-200/80 hover:border-gray-300"
                    : "bg-white border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isSelected
                          ? "bg-[#253C7D] text-white"
                          : isHoliday
                          ? "bg-purple-600 text-white shadow-2xs"
                          : "text-gray-700"
                      }`}
                    >
                      {isKm ? toKhmerNumber(day) : day}
                    </span>
                    {isKm && lunarDayText && (
                      <span
                        className={`text-[9px] font-sans ${
                          isSil ? "text-amber-700 font-bold" : "text-gray-400 font-medium"
                        }`}
                      >
                        {lunarDayText}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isKm && isSil && (
                      <span className="text-[10px]" title="ថ្ងៃសីល · Buddhist Holy Day">
                        🌕
                      </span>
                    )}
                    {isHoliday && (
                      <span
                        className="text-[10px]"
                        title={`🎉 ${isKm && holiday?.local_name ? holiday.local_name : holiday?.name}`}
                      >
                        🎉
                      </span>
                    )}
                    {hasLeaves && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        {isKm ? toKhmerNumber(leaves.length) : leaves.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 mt-1">
                  {isHoliday && (
                    <div
                      title={`🎉 ${isKm && holiday?.local_name ? holiday.local_name : holiday?.name} · ${
                        isKm ? "ឈប់សម្រាកប្រាក់ឈ្នួល ១០០%" : "100% Paid Day Off"
                      }`}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded truncate bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1 shadow-2xs select-none"
                    >
                      <span className="truncate">
                        {isKm && holiday?.local_name ? holiday.local_name : holiday?.name}
                      </span>
                    </div>
                  )}
                  {leaves.slice(0, isHoliday ? 1 : 2).map((l) => {
                    const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || LEAVE_TYPE_CONFIG.annual;
                    return (
                      <div
                        key={l.id}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${cfg.badgeBg}`}
                      >
                        {l.employees?.first_name} ({cfg.label.slice(0, 3)})
                      </div>
                    );
                  })}
                  {leaves.length > (isHoliday ? 1 : 2) && (
                    <span className="text-[9px] font-bold text-gray-400 block text-right">
                      +{leaves.length - (isHoliday ? 1 : 2)} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LeaveCalendarDayAgenda
        selectedCalendarDay={selectedCalendarDay}
        calendarMonth={calendarMonth}
        calendarYear={calendarYear}
        selectedDayLeaves={selectedDayLeaves}
        selectedDayHoliday={selectedDayHoliday}
        monthNames={monthNamesEn}
        calendarLang={calendarLang}
        onInspectRequest={onInspectRequest}
      />
    </div>
  );
});
