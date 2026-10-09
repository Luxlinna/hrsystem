/* eslint-disable react-refresh/only-export-components */
import { memo, useState, useRef, useEffect } from "react";
import { DatePickerDMY } from "@/components/common/DatePickerDMY";
import { formatDMY } from "@/features/workforce/employees/dateUtils";

export const DATE_PRESETS = [
  { id: "all", label: "All Date" },
  { id: "today", label: "Today" },
  { id: "this_week", label: "This week" },
  { id: "last_week", label: "Last week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "this_year", label: "This year" },
  { id: "last_year", label: "Last year" },
  { id: "custom", label: "Custom range" },
];

interface DisciplinaryDateFilterProps {
  filterDateOption: string;
  setFilterDateOption: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
}

export const DisciplinaryDateFilter = memo(function DisciplinaryDateFilter({
  filterDateOption,
  setFilterDateOption,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: DisciplinaryDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempOption, setTempOption] = useState(filterDateOption);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    setTempOption(filterDateOption);
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsOpen(!isOpen);
  };

  const handleSelectPreset = (presetId: string) => {
    setTempOption(presetId);
    if (presetId !== "custom") {
      setFilterDateOption(presetId);
      setStartDate("");
      setEndDate("");
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    setFilterDateOption("custom");
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempOption(filterDateOption);
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsOpen(false);
  };

  const getLabel = () => {
    const currentYear = new Date().getFullYear();
    if (filterDateOption === "custom") {
      if (startDate && endDate) return `${formatDMY(startDate)} - ${formatDMY(endDate)}`;
      if (startDate) return `From ${formatDMY(startDate)}`;
      if (endDate) return `Until ${formatDMY(endDate)}`;
      return "Custom range";
    }
    if (startDate && endDate) {
      return `${formatDMY(startDate)} - ${formatDMY(endDate)}`;
    }
    if (filterDateOption === "this_year") {
      return `01/01/${currentYear} - 31/12/${currentYear}`;
    }
    if (filterDateOption === "last_year") {
      return `01/01/${currentYear - 1} - 31/12/${currentYear - 1}`;
    }
    const found = DATE_PRESETS.find((p) => p.id === filterDateOption);
    return found ? found.label : `01/01/${currentYear} - 31/12/${currentYear}`;
  };

  const isActive = isOpen || filterDateOption !== "all";

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={`px-3 py-1 text-xs rounded-full flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs font-medium border ${
          isActive
            ? "bg-[#253C7D] text-white border-[#253C7D]"
            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
        }`}
      >
        <i className={`ri-calendar-line text-xs ${isActive ? "text-white" : "text-[#253C7D]"}`} />
        <span>{getLabel()}</span>
        <i className={`ri-arrow-down-s-line text-xs ${isActive ? "text-white/80" : "text-slate-400"}`} />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-8 w-60 rounded-md bg-white border border-slate-200 shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1.5 text-xs font-sans"
        >
          {DATE_PRESETS.map((p) => {
            const isSelected = tempOption === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors cursor-pointer block ${
                  isSelected
                    ? "bg-[#253C7D] text-white font-medium"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
              >
                {p.label}
              </button>
            );
          })}

          {tempOption === "custom" && (
            <div className="pt-2 pb-1 space-y-2 border-t border-slate-100 mt-1">
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-0.5">Start Date</label>
                <DatePickerDMY
                  value={tempStart}
                  onChange={setTempStart}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-0.5">End Date</label>
                <DatePickerDMY
                  value={tempEnd}
                  onChange={setTempEnd}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="px-3 py-1 rounded bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
