import { memo, useState, useRef, useEffect } from "react";
import { SPECIAL_REQUIREMENTS_OPTIONS } from "../../constants";

interface RequirementsSelectDropdownProps {
  selectedRequirements: string[];
  onToggleRequirement: (label: string) => void;
  onSetRequirements: (reqs: string[]) => void;
}

export const RequirementsSelectDropdown = memo(function RequirementsSelectDropdown({
  selectedRequirements,
  onToggleRequirement,
  onSetRequirements,
}: RequirementsSelectDropdownProps) {
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
    onSetRequirements(SPECIAL_REQUIREMENTS_OPTIONS.map((o) => o.label));
  };

  const clearAll = () => {
    onSetRequirements([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
        Required Equipment &amp; Support
      </label>

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white border rounded-2xl text-xs text-left font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "border-[#253C7D] ring-2 ring-[#253C7D]/10 bg-white"
            : "border-gray-200/80 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-sm shrink-0">
            <i className="ri-tools-line" />
          </div>
          <span className="truncate text-gray-800">
            {selectedRequirements.length === 0
              ? "Select required equipment & support..."
              : `${selectedRequirements.length} item${selectedRequirements.length > 1 ? "s" : ""} selected (${selectedRequirements.join(", ")})`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedRequirements.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#253C7D] text-white">
              {selectedRequirements.length}
            </span>
          )}
          <i
            className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#253C7D]" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200/90 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] text-gray-500 border-b border-gray-100">
            <span>Choose equipment needed:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[#253C7D] font-bold hover:underline cursor-pointer"
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
            {SPECIAL_REQUIREMENTS_OPTIONS.map((req) => {
              const isSelected = selectedRequirements.includes(req.label);
              return (
                <div
                  key={req.label}
                  onClick={() => onToggleRequirement(req.label)}
                  className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs font-semibold ${
                    isSelected
                      ? "bg-[#253C7D]/10 text-[#253C7D]"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <i className={`${req.icon} text-sm shrink-0`} />
                    <span className="truncate">{req.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] pointer-events-none"
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
