import { memo } from "react";
import type { DisciplinaryTabKey } from "../types";

interface DisciplinaryMetricCardsProps {
  openCount: number;
  pipCount: number;
  criticalCount: number;
  resolvedCount: number;
  activeTab: DisciplinaryTabKey;
  onSelectTab: (tab: DisciplinaryTabKey) => void;
}

export const DisciplinaryMetricCards = memo(function DisciplinaryMetricCards({
  openCount,
  pipCount,
  criticalCount,
  resolvedCount,
  activeTab,
  onSelectTab,
}: DisciplinaryMetricCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Open & In Progress Cases */}
      <div
        onClick={() => onSelectTab("open")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          activeTab === "open" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Active Open Cases</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <i className="ri-folder-open-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-800 mt-2">{openCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Under investigation &amp; review</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Active PIPs */}
      <div
        onClick={() => onSelectTab("pip")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          activeTab === "pip" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active PIPs</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/5 text-[#253C7D] flex items-center justify-center">
            <i className="ri-focus-3-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{pipCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Improvement plans tracked</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]/50" />
      </div>

      {/* High / Critical Severities */}
      <div
        onClick={() => onSelectTab("critical")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          activeTab === "critical" ? "border-rose-500 ring-2 ring-rose-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">High / Critical</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <i className="ri-error-warning-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 mt-2">{criticalCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">High severity incidents</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
      </div>

      {/* Resolved / Closed Cases */}
      <div
        onClick={() => onSelectTab("resolved")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          activeTab === "resolved" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Resolved &amp; Closed</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{resolvedCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Successfully concluded</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>
    </div>
  );
});
