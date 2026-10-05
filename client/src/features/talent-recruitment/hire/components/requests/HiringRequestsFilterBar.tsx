import { memo } from "react";
import type { HiringRequest } from "../../types";
import { exportRequestsPDF } from "../../exports/exportRequestsPDF";

interface Stats {
  total: number;
  pendingBranch: number;
  pendingHr: number;
  pendingHrAdmin: number;
  pendingChairman: number;
  approved: number;
}

interface HiringRequestsFilterBarProps {
  stats: Stats;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  search: string;
  setSearch: (search: string) => void;
  buFilter: string;
  setBuFilter: (bu: string) => void;
  businessUnits: string[];
  filtered: HiringRequest[];
}

export const HiringRequestsFilterBar = memo(function HiringRequestsFilterBar({
  stats,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  buFilter,
  setBuFilter,
  businessUnits,
  filtered,
}: HiringRequestsFilterBarProps) {
  const filterPills = [
    { key: "all", label: "All Requisitions", count: stats.total },
    { key: "pending", label: "Branch Endorsement", count: stats.pendingBranch },
    { key: "pending_hr_review", label: "HR Review", count: stats.pendingHr },
    { key: "pending_hr_admin_review", label: "HR Admin Director", count: stats.pendingHrAdmin },
    { key: "pending_chairman_review", label: "Chairwoman", count: stats.pendingChairman },
    { key: "approved", label: "Live Active Jobs", count: stats.approved },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requisitions..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterPills.map((pill) => {
            const isActive = statusFilter === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => setStatusFilter(pill.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200/80"
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* BU Filter */}
        {businessUnits.length > 0 && (
          <select
            value={buFilter}
            onChange={(e) => setBuFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All BUs</option>
            {businessUnits.map((bu) => (
              <option key={bu} value={bu}>
                {bu}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          exportRequestsPDF(
            filtered,
            buFilter !== "all" ? `Requisitions Summary — BU: ${buFilter}` : "Enterprise Requisitions Summary"
          )
        }
        title="Export filtered list of requisitions as PDF"
        className="px-3 py-2 bg-white hover:bg-blue-50 text-[#253C7D] font-bold text-xs rounded-xl border border-blue-200 hover:border-[#253C7D] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
      >
        <i className="ri-file-pdf-2-line text-rose-600 text-sm" />
        <span>Export List PDF</span>
      </button>
    </div>
  );
});
