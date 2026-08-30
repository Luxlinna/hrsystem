import { memo, useRef, useState, useEffect } from "react";
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

  const filtered = AMENITY_ITEMS.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
        Equipment &amp; Room Amenities ({selectedAmenities.length})
      </label>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-700 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <span className="truncate">
          {selectedAmenities.length === 0 ? "Select amenities..." : selectedAmenities.join(", ")}
        </span>
        <i className={`ri-arrow-down-s-line text-base transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 p-3 bg-white rounded-2xl border border-gray-200/90 shadow-2xl z-50 space-y-2.5 animate-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter amenities..."
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={onSelectAll} className="px-2 py-1 text-[10px] font-bold text-[#253C7D] hover:bg-gray-100 rounded-lg">
                All
              </button>
              <button type="button" onClick={onClearAll} className="px-2 py-1 text-[10px] font-bold text-gray-400 hover:bg-gray-100 rounded-lg">
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.map((item) => {
              const isChecked = selectedAmenities.includes(item.label);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onToggleAmenity(item.label)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    isChecked ? "bg-[#253C7D]/10 text-[#253C7D]" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <i className={`${item.icon} text-sm`} />
                    {item.label}
                  </span>
                  {isChecked && <i className="ri-check-line font-bold" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAddCustomAmenity())}
              placeholder="Add custom amenity..."
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
            <button
              type="button"
              onClick={onAddCustomAmenity}
              className="px-3 py-1.5 bg-gray-100 hover:bg-[#253C7D] hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
