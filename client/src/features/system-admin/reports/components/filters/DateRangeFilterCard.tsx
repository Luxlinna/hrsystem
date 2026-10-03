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
  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-4 shadow-2xs ${
        !isDateScoped ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Date Range {!isDateScoped && <span className="normal-case font-normal">(not used)</span>}
      </p>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1.5 mb-3">
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
              onClick={() => {
                setDateFrom(r.from);
                setDateTo(r.to);
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                active
                  ? "bg-[#253C7D] text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs text-[#253C7D] hover:underline cursor-pointer w-full text-center"
          >
            Clear date filter
          </button>
        )}
      </div>
    </div>
  );
});
