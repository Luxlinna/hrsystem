import { memo, useMemo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { formatDateShort } from "../../dateUtils";
import type { Holiday } from "@/services/holidays/holidaysService";
import {
  GREGORIAN_MONTHS_KM,
  toKhmerNumber,
  toKhmerLunarDate,
  isSilDay,
  formatKhmerDate,
} from "khmer-chhankitek-calendar";

interface LeaveCalendarDayAgendaProps {
  selectedCalendarDay: number | null;
  calendarMonth: number;
  calendarYear: number;
  selectedDayLeaves: LeaveRequest[];
  selectedDayHoliday?: Holiday | null;
  monthNames: string[];
  calendarLang?: "en" | "km";
  onInspectRequest: (req: LeaveRequest) => void;
}

export const LeaveCalendarDayAgenda = memo(function LeaveCalendarDayAgenda({
  selectedCalendarDay,
  calendarMonth,
  calendarYear,
  selectedDayLeaves,
  selectedDayHoliday,
  monthNames,
  calendarLang = "en",
  onInspectRequest,
}: LeaveCalendarDayAgendaProps) {
  const isKm = calendarLang === "km";

  const selectedDateStr = selectedCalendarDay
    ? `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(selectedCalendarDay).padStart(2, "0")}`
    : null;

  const lunarInfo = useMemo(() => {
    if (!selectedDateStr || !isKm) return null;
    try {
      const d = new Date(selectedDateStr + "T00:00:00");
      const lunar = toKhmerLunarDate(d);
      const sil = isSilDay(d);
      return {
        fullText: lunar.fullText || formatKhmerDate(d),
        isSilDay: sil,
      };
    } catch {
      return null;
    }
  }, [selectedDateStr, isKm]);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              {isKm ? "កាលវិភាគប្រចាំថ្ងៃ" : "Daily Schedule"}
            </span>
            <h4 className="text-base font-extrabold text-gray-900 mt-0.5">
              {selectedCalendarDay
                ? isKm
                  ? `ថ្ងៃទី${toKhmerNumber(selectedCalendarDay)} ខែ${GREGORIAN_MONTHS_KM[calendarMonth]} ឆ្នាំ${toKhmerNumber(calendarYear)}`
                  : `${monthNames[calendarMonth]} ${selectedCalendarDay}, ${calendarYear}`
                : isKm
                ? "ជ្រើសរើសកាលបរិច្ឆេទ"
                : "Select a Date"}
            </h4>
          </div>
          {selectedDayLeaves.length > 0 && (
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {selectedDayLeaves.length} {isKm ? "នាក់ឈប់សម្រាក" : "On Leave"}
            </span>
          )}
        </div>

        {/* Khmer Lunar Info Banner when Khmer is toggled */}
        {isKm && lunarInfo?.fullText && (
          <div className="mb-3.5 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 flex items-center justify-between text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm">{lunarInfo.isSilDay ? "🌕" : "🌙"}</span>
              <span className="font-semibold truncate text-[11px] font-sans">{lunarInfo.fullText}</span>
            </div>
            {lunarInfo.isSilDay && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900 shrink-0 ml-2">
                ថ្ងៃសីល
              </span>
            )}
          </div>
        )}

        {/* Public Holiday Banner if selected day is a holiday */}
        {selectedDayHoliday && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50/30 border border-purple-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🎉</span>
              <div className="min-w-0 flex-1">
                <h5 className="font-extrabold text-xs text-purple-900 truncate">
                  {isKm && selectedDayHoliday.local_name
                    ? selectedDayHoliday.local_name
                    : selectedDayHoliday.name}
                </h5>
                {isKm && selectedDayHoliday.local_name && (
                  <p className="text-[10px] text-purple-600 font-medium truncate mt-0.5">
                    {selectedDayHoliday.name}
                  </p>
                )}
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-200/80 text-purple-800 shrink-0 ml-auto">
                {isKm ? "បុណ្យជាតិ" : "Paid Holiday"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-purple-100 text-[10px] text-purple-600 font-medium">
              <span>{isKm ? "ច្បាប់ការងារ មាត្រា ១៦១" : "Cambodia Labor Law Art. 161"}</span>
              <span>{isKm ? "ឈប់សម្រាកប្រាក់ឈ្នួល ១០០%" : "100% Paid Day Off"}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {selectedDayLeaves.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <i className="ri-calendar-check-line text-3xl block mb-2 text-gray-300" />
              <p className="text-xs font-medium">No employees on leave on this date.</p>
            </div>
          ) : (
            selectedDayLeaves.map((l) => {
              const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || LEAVE_TYPE_CONFIG.annual;
              return (
                <div
                  key={l.id}
                  onClick={() => onInspectRequest(l)}
                  className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-100 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-xs text-gray-900">
                      {l.employees?.first_name} {l.employees?.last_name}
                    </p>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {l.employees?.role} &middot; {l.employees?.department}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Duration: {formatDateShort(l.start_date)} &rarr; {formatDateShort(l.end_date)} ({l.days} days)
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});
