import { memo } from "react";
import type { BenefitTabKey, ViewMode } from "../types";

interface NavigationTabsProps {
  tab: BenefitTabKey;
  setTab: (tab: BenefitTabKey) => void;
  plansCount: number;
  enrollmentsCount: number;
  providersCount: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const NavigationTabs = memo(function NavigationTabs({
  tab,
  setTab,
  plansCount,
  enrollmentsCount,
  providersCount,
  viewMode,
  setViewMode,
}: NavigationTabsProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-2.5 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setTab("plans")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            tab === "plans"
              ? "bg-[#253C7D] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <i className="ri-heart-pulse-line text-sm" />
          <span>Benefit Plans Catalog</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
              tab === "plans" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {plansCount}
          </span>
        </button>

        <button
          onClick={() => setTab("enrollment")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            tab === "enrollment"
              ? "bg-[#253C7D] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <i className="ri-user-star-line text-sm" />
          <span>Employee Enrollment Roster</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
              tab === "enrollment" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {enrollmentsCount}
          </span>
        </button>

        <button
          onClick={() => setTab("providers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            tab === "providers"
              ? "bg-[#253C7D] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <i className="ri-building-line text-sm" />
          <span>Insurance Providers</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
              tab === "providers" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {providersCount}
          </span>
        </button>
      </div>

      {/* View Toggle on Plans */}
      {tab === "plans" && (
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 self-start md:self-auto">
          <button
            onClick={() => setViewMode("table")}
            title="Table View"
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-table-line" />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            title="Cards View"
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-layout-grid-fill" />
          </button>
        </div>
      )}
    </div>
  );
});
