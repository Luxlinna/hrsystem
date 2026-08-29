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
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-3.5 sm:p-4 mb-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 mr-1">
          <i className="ri-calendar-line text-[#253C7D] text-sm" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Analyse Period</span>
        </div>

        {PRESETS.map((preset) => {
          const active = dateRange.label === preset.label;
          return (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                active
                  ? "bg-[#253C7D] border-[#253C7D] text-white shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#253C7D]/50 hover:text-[#253C7D]"
              }`}
            >
              {preset.label}
            </button>
          );
        })}

        <button
          onClick={() => setShowCustom(true)}
          className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
            dateRange.label === "Custom"
              ? "bg-[#253C7D] border-[#253C7D] text-white shadow-sm"
              : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#253C7D]/50 hover:text-[#253C7D]"
          }`}
        >
          <i className="ri-calendar-2-line mr-1" />
          Custom
        </button>

        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold">
          <i className="ri-bar-chart-line text-[#253C7D]" />
          <span className="text-[#253C7D] font-bold">{dateRange.from}</span>
          <span>to</span>
          <span className="text-[#253C7D] font-bold">{dateRange.to}</span>
        </div>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">From</label>
            <input
              type="date"
              value={customFrom}
              max={todayStr()}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#253C7D] cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">To</label>
            <input
              type="date"
              value={customTo}
              max={todayStr()}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#253C7D] cursor-pointer"
            />
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!customFrom || !customTo}
            className="px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-[11px] font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <i className="ri-search-line" />
            Apply
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
});
