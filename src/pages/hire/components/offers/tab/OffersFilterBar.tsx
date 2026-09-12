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
  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-wrap flex-1">
        {/* Search */}
        <div className="relative min-w-[220px]">
          <i className="ri-search-line absolute left-3 top-2.5 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search candidate, role, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
        >
          <option value="all">All Statuses ({totalOffersCount})</option>
          <option value="in_review">In Approval Pipeline ({metrics.inReview})</option>
          <option value="ready_to_issue">Ready to Issue ({metrics.readyToIssue})</option>
          <option value="issued">Issued / Awaiting ({metrics.issued})</option>
          <option value="accepted">Accepted ({metrics.accepted})</option>
          <option value="rejected">Declined ({metrics.rejected})</option>
        </select>

        {/* Department Filter */}
        {departments.length > 0 && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
        className="px-4 py-2 bg-[#253C7D] hover:bg-[#1e3066] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
      >
        <i className="ri-add-line text-sm" />
        Create Salary Proposal
      </button>
    </div>
  );
});
