import { memo } from "react";
import { GREGORIAN_MONTHS_KM, toKhmerNumber } from "khmer-chhankitek-calendar";

interface LeaveCalendarHeaderProps {
  calendarYear: number;
  calendarMonth: number;
  calendarLang: "en" | "km";
  onToggleLang: (lang: "en" | "km") => void;
  todayMonth: () => void;
  prevMonth: () => void;
  nextMonth: () => void;
  onOpenHolidaysModal?: () => void;
  holidayCount?: number;
  departments: string[];
  calDeptFilter: string;
  setCalDeptFilter: (dept: string) => void;
  monthNamesEn: string[];
}

export const LeaveCalendarHeader = memo(function LeaveCalendarHeader({
  calendarYear,
  calendarMonth,
  calendarLang,
  onToggleLang,
  todayMonth,
  prevMonth,
  nextMonth,
  onOpenHolidaysModal,
  holidayCount,
  departments,
  calDeptFilter,
  setCalDeptFilter,
  monthNamesEn,
}: LeaveCalendarHeaderProps) {
  const isKm = calendarLang === "km";

  return (
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
            onClick={() => onToggleLang("en")}
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
            onClick={() => onToggleLang("km")}
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
  );
});
