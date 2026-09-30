import { memo, useState, useRef, useEffect } from "react";
import { BU_DEFAULT_JOB_STATUSES } from "../constants";

interface EmployeesJobStatusFilterProps {
  selectedJobStatuses?: string[];
  jobStatuses?: string[];
  onApplyJobStatusFilter?: (selected: string[]) => void;
}

export const EmployeesJobStatusFilter = memo(function EmployeesJobStatusFilter({
  selectedJobStatuses = [],
  jobStatuses: rawJobStatuses = [],
  onApplyJobStatusFilter,
}: EmployeesJobStatusFilterProps) {
  // Use DB data when available; fall back to hardcoded list if DB table is empty
  const jobStatuses = rawJobStatuses.length > 0 ? rawJobStatuses : BU_DEFAULT_JOB_STATUSES;
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedJobStatuses);
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
    setTempSelected(selectedJobStatuses);
    setIsOpen(!isOpen);
  };

  const isAllSelected = tempSelected.length === 0 || tempSelected.length === jobStatuses.length;

  const handleToggleAll = () => {
    setTempSelected([]);
  };

  const handleToggleItem = (st: string) => {
    if (isAllSelected && tempSelected.length === 0) {
      setTempSelected([st]);
      return;
    }

    if (tempSelected.includes(st)) {
      const next = tempSelected.filter((t) => t !== st);
      setTempSelected(next);
    } else {
      setTempSelected([...tempSelected, st]);
    }
  };

  const handleApply = () => {
    if (onApplyJobStatusFilter) {
      onApplyJobStatusFilter(tempSelected);
    }
    setIsOpen(false);
  };

  const isActive = selectedJobStatuses.length > 0;
  const label = isActive
    ? selectedJobStatuses.length === 1
      ? selectedJobStatuses[0]
      : `${selectedJobStatuses.length} Job Statuses`
    : "Job Status";

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button matching Screenshot */}
      <button
        type="button"
        onClick={handleOpen}
        className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isOpen || isActive
            ? "border-[#253C7D] bg-[#253C7D] text-white shadow-xs"
            : "border-[#253C7D]/40 text-[#253C7D] bg-white hover:bg-[#253C7D]/5"
        }`}
      >
        <span>{label}</span>
        <i className="ri-arrow-down-s-line text-xs opacity-90" />
      </button>

      {/* Popover matching Screenshot */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-8 w-48 rounded-lg bg-white border border-slate-200/90 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2 text-xs"
        >
          {/* Scrollable Checkbox List */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {/* All Checkbox */}
            <label className="flex items-center gap-2.5 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleAll}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-medium">All</span>
            </label>

            {/* BU Job Status Items */}
            {jobStatuses.map((st) => {
              const checked = !isAllSelected && tempSelected.includes(st);
              return (
                <label
                  key={st}
                  className="flex items-center gap-2.5 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleItem(st)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                  />
                  <span className="text-xs text-slate-700">{st}</span>
                </label>
              );
            })}
          </div>

          {/* Bottom Apply Action */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleApply}
              className="px-3.5 py-1 rounded bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <i className="ri-filter-fill text-xs" />
              <span>Apply</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTempSelected([]);
                if (onApplyJobStatusFilter) onApplyJobStatusFilter([]);
                setIsOpen(false);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
