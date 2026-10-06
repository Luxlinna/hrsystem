import { memo } from "react";
import type { Holiday } from "@/services/holidays/holidaysService";

interface HolidayCardItemProps {
  holiday: Holiday;
  canManage: boolean;
  onDelete: (h: Holiday) => void;
}

export const HolidayCardItem = memo(function HolidayCardItem({
  holiday: h,
  canManage,
  onDelete,
}: HolidayCardItemProps) {
  const dateObj = new Date(`${h.date}T00:00:00`);
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
  const dayNum = dateObj.getDate();

  return (
    <div className="bg-white dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 rounded-xl p-2.5 sm:p-3 hover:border-blue-300 dark:hover:border-blue-800 transition-all flex items-center justify-between gap-2.5 shadow-2xs group">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Date Block */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-[#253C7D] dark:text-blue-300 flex flex-col items-center justify-center shrink-0">
          <span className="text-[8px] sm:text-[9px] font-bold uppercase leading-none">{monthName}</span>
          <span className="text-sm sm:text-base font-black leading-tight">{dayNum}</span>
          <span className="text-[8px] sm:text-[9px] font-semibold text-blue-500/80 leading-none">{dayName}</span>
        </div>

        {/* Names */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 dark:text-slate-100 truncate">
              {h.name}
            </h4>
            {h.is_paid && (
              <span className="px-1.5 py-0.2 text-[8.5px] sm:text-[9px] font-bold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
                Paid (100%)
              </span>
            )}
            <span className="px-1.5 py-0.2 text-[8.5px] sm:text-[9px] font-bold rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 shrink-0">
              2.0x OT
            </span>
          </div>
          <p className="text-[9.5px] text-gray-400 dark:text-slate-500 font-mono mt-0.2">
            {h.date}
          </p>
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <button
          type="button"
          onClick={() => onDelete(h)}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center cursor-pointer shrink-0"
          title="Remove holiday"
        >
          <i className="ri-delete-bin-line text-xs" />
        </button>
      )}
    </div>
  );
});
