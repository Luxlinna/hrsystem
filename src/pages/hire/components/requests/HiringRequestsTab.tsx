import { memo, useState, useMemo } from "react";
import type { HiringRequest } from "../../types";
import { HiringRequestCard } from "./HiringRequestCard";

interface HiringRequestsTabProps {
  requests: HiringRequest[];
  canRequest: boolean;
  canApprove: boolean;
  canBranchApprove?: boolean;
  canHrReview?: boolean;
  isChairman: boolean;
  onOpenCreate: () => void;
  onOpenDecision: (req: HiringRequest, action: "approved" | "rejected") => void;
  onDeleteRequest?: (id: string) => void;
  onAssignHrOfficer?: (requestId: string, hrId: string | null, hrName: string | null) => void;
}

export const HiringRequestsTab = memo(function HiringRequestsTab({
  requests,
  canRequest,
  canApprove,
  canBranchApprove = false,
  canHrReview = false,
  isChairman,
  onOpenCreate,
  onOpenDecision,
  onDeleteRequest,
  onAssignHrOfficer,
}: HiringRequestsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pendingBranch: requests.filter((r) => !r.status || r.status === "pending" || r.status === "pending_branch_review").length,
      pendingHr: requests.filter((r) => r.status === "pending_hr_review").length,
      approved: requests.filter((r) => r.status === "approved").length,
      totalHeadcount: requests
        .filter((r) => r.status === "approved" || !r.status || r.status === "pending" || r.status === "pending_hr_review")
        .reduce((sum, r) => sum + (r.headcount || 1), 0),
    };
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          if (r.status !== "pending" && r.status !== "pending_branch_review" && r.status !== undefined) return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (r.title || "").toLowerCase();
        const dept = (r.department || "").toLowerCase();
        const branch = (r.branches?.name || "").toLowerCase();
        const reqBy = (r.requested_by_name || "").toLowerCase();
        if (!title.includes(q) && !dept.includes(q) && !branch.includes(q) && !reqBy.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Executive Requisition Report Header */}
      <div className="bg-[#1B2B5A] bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#1e293b] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wide uppercase text-blue-100 border border-white/10">
                Pipeline: Branch Manager Request → Branch Endorsement → HR Division Authorization
              </span>
              {isChairman && (
                <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-full text-[11px] font-bold">
                  Chairman Oversight View
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Branch Hiring Requisitions
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed font-medium">
              Branch managers request headcount for their branch. Branch Admins endorse the requisition, routing it to the HR Division for final assignment and live job recruitment.
            </p>
          </div>

          {canRequest && (
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-[#172554] hover:bg-blue-50 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer shrink-0"
            >
              <i className="ri-user-add-line text-lg" />
              Request New Employee
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/15 relative">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <p className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">Total Requisitions</p>
            <p className="text-2xl sm:text-3xl font-black mt-1 text-white">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <p className="text-[11px] text-amber-200 font-bold uppercase tracking-wider">Round 1: Branch Action</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">{stats.pendingBranch}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <p className="text-[11px] text-sky-200 font-bold uppercase tracking-wider">Round 2: HR Review</p>
            <p className="text-2xl sm:text-3xl font-black text-sky-300 mt-1">{stats.pendingHr}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <p className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider">Approved & Live Jobs</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">{stats.approved}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requisitions by role, department, branch, requester..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Requisition Statuses</option>
          <option value="pending">Round 1: Awaiting Branch Approval</option>
          <option value="pending_hr_review">Round 2: In HR Division Review</option>
          <option value="approved">Approved & Job Live</option>
          <option value="fulfilled">Position Hired / Closed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Requisitions List */}
      <div className="space-y-4">
        {filtered.map((r) => (
          <HiringRequestCard
            key={r.id}
            request={r}
            canApprove={canApprove}
            canBranchApprove={canBranchApprove}
            canHrReview={canHrReview}
            onOpenDecision={onOpenDecision}
            onDelete={onDeleteRequest}
          />
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-gray-400">
            <i className="ri-file-list-3-line text-4xl mb-2 block text-gray-300" />
            <p className="text-sm font-bold text-gray-700">No hiring requisitions found</p>
            <p className="text-xs text-gray-400 mt-1">There are no employee requests matching your filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
});
