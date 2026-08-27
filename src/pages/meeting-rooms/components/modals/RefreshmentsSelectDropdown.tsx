import { memo, useState, useRef, useEffect } from "react";
import { REFRESHMENTS_OPTIONS } from "../../constants";

interface RefreshmentsSelectDropdownProps {
  selectedRefreshments: string[];
  onToggleRefreshment: (label: string) => void;
  onSetRefreshments: (refs: string[]) => void;
}

export const RefreshmentsSelectDropdown = memo(function RefreshmentsSelectDropdown({
  selectedRefreshments,
  onToggleRefreshment,
  onSetRefreshments,
}: RefreshmentsSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectAll = () => {
    onSetRefreshments(REFRESHMENTS_OPTIONS.map((o) => o.label));
  };

  const clearAll = () => {
    onSetRefreshments([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
        Refreshments &amp; Catering
      </label>

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white border rounded-2xl text-xs text-left font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "border-emerald-600 ring-2 ring-emerald-600/10 bg-white"
            : "border-gray-200/80 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm shrink-0">
            <i className="ri-cup-line" />
          </div>
          <span className="truncate text-gray-800">
            {selectedRefreshments.length === 0
              ? "Select refreshments & catering..."
              : `${selectedRefreshments.length} item${selectedRefreshments.length > 1 ? "s" : ""} selected (${selectedRefreshments.join(", ")})`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedRefreshments.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
              {selectedRefreshments.length}
            </span>
          )}
          <i
            className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-600" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200/90 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-500 border-b border-gray-100">
            <span>Choose refreshments:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span>&middot;</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
            {REFRESHMENTS_OPTIONS.map((ref) => {
              const isSelected = selectedRefreshments.includes(ref.label);
              return (
                <div
                  key={ref.label}
                  onClick={() => onToggleRefreshment(ref.label)}
                  className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs font-semibold ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-800 font-bold"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <i className={`${ref.icon} text-sm shrink-0`} />
                    <span className="truncate">{ref.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-600 pointer-events-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
