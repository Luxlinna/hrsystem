import { memo } from "react";

export interface EmployeeLocationItem {
  id: string;
  name: string;
  count: number;
  isMain?: boolean;
}

interface EmployeeWorkSitePillsProps {
  locations: EmployeeLocationItem[];
  totalCount: number;
  filterLocation: string;
  setFilterLocation: (id: string) => void;
}

export const EmployeeWorkSitePills = memo(function EmployeeWorkSitePills({
  locations,
  totalCount,
  filterLocation,
  setFilterLocation,
}: EmployeeWorkSitePillsProps) {
  if (locations.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
        <i className="ri-building-2-line text-xs text-[#253C7D]" /> Locations:
      </span>

      {/* All Locations Toggle Pill */}
      <button
        type="button"
        onClick={() => setFilterLocation("all")}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
          filterLocation === "all"
            ? "bg-[#253C7D] border-[#253C7D] text-white shadow-sm ring-2 ring-[#253C7D]/20"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <span>All Locations</span>
        <span
          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full tabular-nums ${
            filterLocation === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {totalCount}
        </span>
      </button>

      {/* Specific Location Toggle Pills */}
      {locations.map((loc) => {
        const isSelected = filterLocation === loc.id;
        const isMain = Boolean(loc.isMain);

        return (
          <button
            key={loc.id}
            type="button"
            onClick={() => setFilterLocation(isSelected ? "all" : loc.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isSelected
                ? "bg-[#253C7D] border-[#253C7D] text-white shadow-sm ring-2 ring-[#253C7D]/20"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <i
              className={`text-xs ${
                isSelected
                  ? "text-white"
                  : isMain
                  ? "ri-building-line text-[#253C7D]"
                  : "ri-map-pin-range-line text-amber-600"
              }`}
            />
            <span className="truncate max-w-[180px]">{loc.name}</span>

            {isMain ? (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#253C7D]/10 text-[#253C7D]"
                }`}
              >
                Main
              </span>
            ) : (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide ${
                  isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                Branch
              </span>
            )}

            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full tabular-nums ${
                isSelected
                  ? "bg-white/20 text-white"
                  : isSelected
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {loc.count}
            </span>
          </button>
        );
      })}
    </div>
  );
});
