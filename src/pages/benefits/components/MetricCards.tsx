import { memo } from "react";
import type { BenefitTabKey } from "../types";

interface MetricCardsProps {
  activePlans: number;
  providersCount: number;
  totalEnrolled: number;
  overallRate: string;
  optedOut: number;
  totalEligible: number;
  tab: BenefitTabKey;
  enrollStatusFilter: string;
  onSelectPlans: () => void;
  onSelectEnrolled: () => void;
  onSelectOptedOut: () => void;
}

export const MetricCards = memo(function MetricCards({
  activePlans,
  providersCount,
  totalEnrolled,
  overallRate,
  optedOut,
  totalEligible,
  tab,
  enrollStatusFilter,
  onSelectPlans,
  onSelectEnrolled,
  onSelectOptedOut,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Active Benefit Plans */}
      <div
        onClick={onSelectPlans}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "plans" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active Plans</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-heart-pulse-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{activePlans}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{providersCount} Insurance Providers</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Total Active Enrollments */}
      <div
        onClick={onSelectEnrolled}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "enrollment" && enrollStatusFilter === "enrolled"
            ? "border-emerald-500 ring-2 ring-emerald-500/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Enrolled</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{totalEnrolled}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{overallRate}% Overall Participation</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Opted Out Rate */}
      <div
        onClick={onSelectOptedOut}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "enrollment" && enrollStatusFilter === "opted_out"
            ? "border-slate-500 ring-2 ring-slate-500/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Opted Out</span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <i className="ri-user-unfollow-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-700 mt-2">{optedOut}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Staff waived coverage</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
      </div>

      {/* Total Eligible Capacity */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Total Capacity</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-team-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{totalEligible}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Eligible seats across plans</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]/100" />
      </div>
    </div>
  );
});
