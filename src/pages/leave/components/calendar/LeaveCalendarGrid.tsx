import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import type { Holiday } from "@/services/holidays/holidaysService";
import {
  toKhmerNumber,
  toKhmerLunarDate,
  isSilDay,
} from "khmer-chhankitek-calendar";

interface LeaveCalendarGridProps {
  calendarDays: {
    day: number;
    dateStr: string;
    leaves: LeaveRequest[];
    holiday?: Holiday;
  }[];
  firstDayOfWeek: number;
  selectedCalendarDay: number | null;
  setSelectedCalendarDay: (d: number | null) => void;
  calendarLang: "en" | "km";
}

export const LeaveCalendarGrid = memo(function LeaveCalendarGrid({
  calendarDays,
  firstDayOfWeek,
  selectedCalendarDay,
  setSelectedCalendarDay,
  calendarLang,
}: LeaveCalendarGridProps) {
  const isKm = calendarLang === "km";
  const dayHeadersEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayHeadersKm = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហ", "សុក្រ", "សៅរ៍"];

  return (
    <>
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
            } catch {
              lunarDayText = "";
            }
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
    </>
  );
});
