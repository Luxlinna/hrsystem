import { memo, useState, useRef, useEffect } from "react";
import { AMENITY_ITEMS } from "../../constants";

interface AmenitiesSelectDropdownProps {
  selectedAmenities: string[];
  onToggleAmenity: (label: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  customAmenity: string;
  setCustomAmenity: (val: string) => void;
  onAddCustomAmenity: () => void;
}

export const AmenitiesSelectDropdown = memo(function AmenitiesSelectDropdown({
  selectedAmenities,
  onToggleAmenity,
  onSelectAll,
  onClearAll,
  customAmenity,
  setCustomAmenity,
  onAddCustomAmenity,
}: AmenitiesSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filtered = AMENITY_ITEMS.filter((i) =>
    i.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative space-y-1.5" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          Equipment &amp; Amenities
        </label>
        {selectedAmenities.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            Clear all ({selectedAmenities.length})
          </button>
        )}
      </div>

      {/* Interactive Tag Trigger Box */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[44px] p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
          isOpen
            ? "border-[#253C7D] dark:border-sky-500 bg-white dark:bg-slate-800 ring-2 ring-[#253C7D]/10"
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          {selectedAmenities.length === 0 ? (
            <span className="text-xs sm:text-sm text-slate-400 px-1">Select room equipment (TV, Wi-Fi, AC, Whiteboard...)...</span>
          ) : (
            selectedAmenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-300"
              >
                <span>{amenity}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAmenity(amenity);
                  }}
                  className="hover:text-rose-500 text-slate-400 dark:text-slate-400 transition-colors"
                >
                  <i className="ri-close-line text-sm" />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1 px-1 text-slate-400 shrink-0">
          <i className={`ri-arrow-down-s-line text-base transition-transform ${isOpen ? "rotate-180 text-[#253C7D] dark:text-sky-400" : ""}`} />
        </div>
      </div>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center gap-2 px-1">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter amenities..."
                className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <button
              type="button"
              onClick={onSelectAll}
              className="px-2.5 py-1.5 text-xs font-bold text-[#253C7D] dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl shrink-0 cursor-pointer"
            >
              Select All
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {filtered.map((item) => {
              const isChecked = selectedAmenities.includes(item.label);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onToggleAmenity(item.label)}
                  className={`w-full px-2.5 py-2 rounded-xl text-left text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isChecked
                      ? "bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-300"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <i className={`${item.icon} text-sm text-slate-400`} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {isChecked && <i className="ri-check-line text-sm font-bold text-[#253C7D] dark:text-sky-400" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAddCustomAmenity())}
              placeholder="Add custom amenity..."
              className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
            />
            <button
              type="button"
              onClick={onAddCustomAmenity}
              disabled={!customAmenity.trim()}
              className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
