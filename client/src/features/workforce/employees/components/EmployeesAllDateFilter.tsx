import { memo, useState, useRef, useEffect } from "react";

const DATE_OPTIONS = [
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

interface EmployeesAllDateFilterProps {
  selectedOption?: string;
  onApplyDateFilter?: (optionId: string) => void;
}

export const EmployeesAllDateFilter = memo(function EmployeesAllDateFilter({
  selectedOption = "all",
  onApplyDateFilter,
}: EmployeesAllDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState(
    selectedOption.startsWith("custom:") ? "custom" : selectedOption
  );
  const [startDate, setStartDate] = useState(() => {
    if (selectedOption.startsWith("custom:")) {
      return selectedOption.split(":")[1] || "";
    }
    return "";
  });
  const [endDate, setEndDate] = useState(() => {
    if (selectedOption.startsWith("custom:")) {
      return selectedOption.split(":")[2] || "";
    }
    return "";
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOpen = () => {
    const isCustom = selectedOption.startsWith("custom:");
    setTempSelected(isCustom ? "custom" : selectedOption);
    if (isCustom) {
      const parts = selectedOption.split(":");
      setStartDate(parts[1] || "");
      setEndDate(parts[2] || "");
    }
    setIsOpen(!isOpen);
  };

  const handleApply = () => {
    if (onApplyDateFilter) {
      if (tempSelected === "custom") {
        if (startDate || endDate) {
          onApplyDateFilter(`custom:${startDate}:${endDate}`);
        } else {
          onApplyDateFilter("all");
        }
      } else {
        onApplyDateFilter(tempSelected);
      }
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    const isCustom = selectedOption.startsWith("custom:");
    setTempSelected(isCustom ? "custom" : selectedOption);
    setIsOpen(false);
  };

  const getLabel = () => {
    if (selectedOption.startsWith("custom:")) {
      const parts = selectedOption.split(":");
      if (parts[1] && parts[2]) return `${parts[1]} ~ ${parts[2]}`;
      if (parts[1]) return `From ${parts[1]}`;
      if (parts[2]) return `Until ${parts[2]}`;
      return "CUSTOM";
    }
    const matched = DATE_OPTIONS.find((o) => o.id === selectedOption);
    return matched ? matched.label.toUpperCase() : "ALL DATE";
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button matching Screenshot */}
      <button
        type="button"
        onClick={handleOpen}
        className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isOpen || selectedOption !== "all"
            ? "border-[#253C7D] bg-[#253C7D] text-white shadow-xs"
            : "border-[#253C7D]/40 text-[#253C7D] bg-white hover:bg-[#253C7D]/5"
        }`}
      >
        <i className="ri-calendar-line text-xs" />
        <span>{getLabel()}</span>
        <i className="ri-arrow-down-s-line text-xs opacity-80" />
      </button>

      {/* Popover Dropdown matching Screenshot */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-8 w-56 rounded-md bg-white border border-slate-200/90 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1 text-xs"
        >
          {DATE_OPTIONS.map((opt) => {
            const isSelected = tempSelected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTempSelected(opt.id)}
                className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors cursor-pointer block ${
                  isSelected
                    ? "bg-[#253C7D] text-white font-medium"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          {/* Custom Date Range inputs */}
          {tempSelected === "custom" && (
            <div className="pt-2 pb-1 px-1 space-y-2 border-t border-slate-100 mt-1">
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-0.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>
          )}

          {/* Bottom Actions: Apply & Cancel */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1 rounded bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
