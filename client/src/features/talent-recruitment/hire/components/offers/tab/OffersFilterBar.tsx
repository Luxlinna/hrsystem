import { memo } from "react";
import type { OfferMetrics } from "./OffersMetricsRow";

interface OffersFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  deptFilter: string;
  setDeptFilter: (v: string) => void;
  departments: string[];
  totalOffersCount: number;
  metrics: OfferMetrics;
  onOpenCreateProposal: () => void;
}

export const OffersFilterBar = memo(function OffersFilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  deptFilter,
  setDeptFilter,
  departments,
  totalOffersCount,
  metrics,
  onOpenCreateProposal,
}: OffersFilterBarProps) {
  const filterPills = [
    { key: "all", label: "All Offers", count: totalOffersCount },
    { key: "in_review", label: "In Review", count: metrics.inReview },
    { key: "ready_to_issue", label: "Ready to Issue", count: metrics.readyToIssue },
    { key: "issued", label: "Issued", count: metrics.issued },
    { key: "accepted", label: "Accepted", count: metrics.accepted },
    { key: "rejected", label: "Declined", count: metrics.rejected },
  ];

  return (
    <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-2.5 text-slate-400 text-xs" />
          <input
            type="text"
            placeholder="Search candidate, role, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
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

        {/* Department Filter */}
        {departments.length > 0 && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Create Proposal Action Button */}
      <button
        type="button"
        onClick={onOpenCreateProposal}
        className="px-3.5 py-2 bg-[#253C7D] hover:bg-[#1e3066] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
      >
        <i className="ri-add-line text-sm" />
        Create Salary Proposal
      </button>
    </div>
  );
});
