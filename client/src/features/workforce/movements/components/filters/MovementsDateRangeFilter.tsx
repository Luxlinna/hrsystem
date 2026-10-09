import { memo, useState, useRef, useEffect } from "react";
import { MovementsCalendarView } from "./MovementsCalendarView";
import { PRESETS, formatDisplayDate, getPresetDates } from "./dateRangeUtils";

interface MovementsDateRangeFilterProps {
  selectedOption?: string;
  onApplyDateFilter?: (optionId: string) => void;
}

export const MovementsDateRangeFilter = memo(function MovementsDateRangeFilter({
  selectedOption = "all",
  onApplyDateFilter,
}: MovementsDateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("all");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedOption.startsWith("custom:")) {
      const parts = selectedOption.split(":");
      setActivePreset("custom");
      if (parts[1]) setStartDate(parts[1]);
      if (parts[2]) setEndDate(parts[2]);
    } else {
      setActivePreset(selectedOption);
    }
  }, [selectedOption]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectCalendarDate = (dateStr: string) => {
    setActivePreset("custom");
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate("");
    } else if (startDate && !endDate) {
      if (dateStr < startDate) {
        setEndDate(startDate);
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const handleSelectPreset = (presetId: string) => {
    setActivePreset(presetId);
    if (presetId !== "all" && presetId !== "custom") {
      const range = getPresetDates(presetId);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  const handleApply = () => {
    if (onApplyDateFilter) {
      if (activePreset === "custom" || (startDate && endDate)) {
        onApplyDateFilter(`custom:${startDate}:${endDate}`);
      } else {
        onApplyDateFilter(activePreset);
      }
    }
    setIsOpen(false);
  };

  const getButtonLabel = () => {
    if (selectedOption.startsWith("custom:")) {
      const parts = selectedOption.split(":");
      if (parts[1] && parts[2]) return `${formatDisplayDate(parts[1])} - ${formatDisplayDate(parts[2])}`;
      if (parts[1]) return `From ${formatDisplayDate(parts[1])}`;
      return "Custom Range";
    }
    const matched = PRESETS.find((p) => p.id === selectedOption);
    return matched ? matched.label.toUpperCase() : "ALL DATE";
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isOpen || selectedOption !== "all"
            ? "border-[#253C7D] bg-[#253C7D] text-white shadow-2xs"
            : "border-[#253C7D]/40 text-[#253C7D] bg-white hover:bg-[#253C7D]/5"
        }`}
      >
        <i className="ri-calendar-line text-xs" />
        <span>{getButtonLabel()}</span>
        <i className="ri-arrow-down-s-line text-xs opacity-80" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 sm:left-0 top-8 w-[640px] max-w-[95vw] rounded-md bg-white border border-slate-300 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs"
        >
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 border border-slate-300 rounded px-2.5 py-1.5 bg-white">
              <i className="ri-calendar-event-line text-slate-500" />
              <input
                type="text"
                value={formatDisplayDate(startDate)}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full text-xs text-slate-800 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 border border-slate-300 rounded px-2.5 py-1.5 bg-white">
              <i className="ri-calendar-event-line text-slate-500" />
              <input
                type="text"
                value={formatDisplayDate(endDate)}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <MovementsCalendarView
                startDate={startDate}
                endDate={endDate}
                onSelectDate={handleSelectCalendarDate}
              />
            </div>

            <div className="w-28 space-y-1 pl-3 border-l border-slate-200 shrink-0">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`w-full text-left px-2.5 py-1 rounded text-xs transition-colors cursor-pointer block ${
                    activePreset === p.id
                      ? "bg-[#253C7D] text-white font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 rounded bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-semibold cursor-pointer shadow-2xs"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
