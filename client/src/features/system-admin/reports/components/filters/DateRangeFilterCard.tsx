import { memo } from "react";
import { todayYMD } from "@/lib/date";
import { getWeekRange, getMonthRange } from "../../reportsUtils";

interface DateRangeFilterCardProps {
  isDateScoped: boolean;
  dateFrom: string;
  setDateFrom: (d: string) => void;
  dateTo: string;
  setDateTo: (d: string) => void;
}

export const DateRangeFilterCard = memo(function DateRangeFilterCard({
  isDateScoped,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: DateRangeFilterCardProps) {
  if (!isDateScoped) {
    return (
      <div className="p-4 bg-slate-50/50">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <i className="ri-calendar-line text-slate-400 text-sm" />
          <span>All-time records included</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Date Window
        </label>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="text-[11px] text-[#253C7D] font-medium hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "Today", get: () => ({ from: todayYMD(), to: todayYMD() }) },
          { label: "This Week", get: getWeekRange },
          { label: "This Month", get: getMonthRange },
          { label: "All Time", get: () => ({ from: "", to: "" }) },
        ].map((p) => {
          const r = p.get();
          const active = dateFrom === r.from && dateTo === r.to;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setDateFrom(r.from);
                setDateTo(r.to);
              }}
              className={`py-1 px-2 rounded-md text-[11px] font-medium transition-all cursor-pointer text-center ${
                active
                  ? "bg-[#253C7D] text-white shadow-2xs font-semibold"
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <label className="text-[11px] font-medium text-slate-500 mb-1 block">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-slate-500 mb-1 block">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] focus:bg-white transition-colors"
          />
        </div>
      </div>
    </div>
  );
});
