import { memo, useState } from "react";
import type { DateRange } from "../types";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
function firstOfMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const PRESETS: { label: string; from: () => string; to: () => string }[] = [
  { label: "Today",        from: () => todayStr(),       to: () => todayStr() },
  { label: "Last 7 Days",  from: () => daysAgoStr(6),    to: () => todayStr() },
  { label: "Last 30 Days", from: () => daysAgoStr(29),   to: () => todayStr() },
  { label: "This Month",   from: () => firstOfMonthStr(), to: () => todayStr() },
];

interface DashboardDateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

export const DashboardDateRangePicker = memo(function DashboardDateRangePicker({
  dateRange,
  onChange,
}: DashboardDateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(dateRange.label === "Custom");
  const [customFrom, setCustomFrom] = useState(dateRange.from);
  const [customTo, setCustomTo] = useState(dateRange.to);

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    setShowCustom(false);
    onChange({ from: preset.from(), to: preset.to(), label: preset.label });
  };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    const from = customFrom <= customTo ? customFrom : customTo;
    const to   = customFrom <= customTo ? customTo   : customFrom;
    onChange({ from, to, label: "Custom" });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs p-3 sm:p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 mr-1.5 shrink-0 text-slate-500">
          <i className="ri-calendar-line text-sm" />
          <span className="text-[10.5px] font-bold uppercase tracking-wider">Period</span>
        </div>

        {PRESETS.map((preset) => {
          const active = dateRange.label === preset.label;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                active
                  ? "bg-[#253C7D] text-white shadow-xs hover:bg-[#1E3064]"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
              }`}
            >
              {preset.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
            dateRange.label === "Custom" || showCustom
              ? "bg-[#253C7D] text-white shadow-xs hover:bg-[#1E3064]"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
          }`}
        >
          <i className="ri-calendar-2-line text-xs" />
          <span>Custom</span>
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-wrap">
          <input
            type="date"
            value={customFrom}
            max={todayStr()}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={customTo}
            max={todayStr()}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
          />
          <button
            type="button"
            onClick={handleCustomApply}
            disabled={!customFrom || !customTo}
            className="px-3 py-1 text-xs bg-[#253C7D] hover:bg-[#1E3064] text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
});
