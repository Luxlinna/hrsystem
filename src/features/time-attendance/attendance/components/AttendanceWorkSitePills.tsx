import { memo } from "react";
import type { WorkLocation } from "../types";

interface AttendanceWorkSitePillsProps {
  todayByWorkSite: (WorkLocation & {
    present: number;
    workingNowHere: number;
    total: number;
    scopeCount: number;
    isMain?: boolean;
  })[];
  filterWorkLocation: string;
  setFilterWorkLocation: (id: string) => void;
}

export const AttendanceWorkSitePills = memo(function AttendanceWorkSitePills({
  todayByWorkSite,
  filterWorkLocation,
  setFilterWorkLocation,
}: AttendanceWorkSitePillsProps) {
  if (todayByWorkSite.length === 0) return null;

  const totalAllScope = todayByWorkSite.reduce((sum, s) => sum + (s.scopeCount ?? s.total ?? 0), 0);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1">
        <i className="ri-building-2-line" /> Locations:
      </span>
      <button
        type="button"
        onClick={() => setFilterWorkLocation("all")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-all cursor-pointer ${
          filterWorkLocation === "all"
            ? "bg-[#253C7D] border-[#253C7D] text-white shadow-xs"
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <span>All Locations</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          filterWorkLocation === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
        }`}>
          {totalAllScope}
        </span>
      </button>

      {todayByWorkSite.map((site) => {
        const isSelected = filterWorkLocation === site.id;
        const isMain = Boolean(site.isMain || site.id === "main");
        const count = site.scopeCount ?? site.total ?? 0;

        return (
          <button
            key={site.id}
            type="button"
            onClick={() => setFilterWorkLocation(isSelected ? "all" : site.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-all cursor-pointer ${
              isSelected
                ? "bg-[#253C7D] border-[#253C7D] text-white shadow-xs"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <i className={`${isMain ? "ri-building-line" : "ri-map-pin-range-line"} text-xs ${isSelected ? "text-white" : isMain ? "text-[#253C7D]" : "text-amber-600"}`} />
            <span className="truncate max-w-[200px]">{site.name}</span>
            {isMain && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${isSelected ? "bg-white/20 text-white" : "bg-[#253C7D]/10 text-[#253C7D]"}`}>
                Main
              </span>
            )}
            {!isMain && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
                Site
              </span>
            )}
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                isSelected
                  ? "bg-white/20 text-white"
                  : count > 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {count}
            </span>
            {site.workingNowHere > 0 && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                  isSelected
                    ? "bg-emerald-400/30 text-emerald-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                }`}
                title={`${site.workingNowHere} employee(s) working right now`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {site.workingNowHere} live
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
