import { memo, useState, useMemo } from "react";
import type { HiringRequest } from "../../types";

interface HiringRequestsTabProps {
  requests: HiringRequest[];
  canRequest: boolean;
  canApprove: boolean;
  isChairman: boolean;
  onOpenCreate: () => void;
  onOpenDecision: (req: HiringRequest, action: "approved" | "rejected") => void;
}

export const HiringRequestsTab = memo(function HiringRequestsTab({
  requests,
  canRequest,
  canApprove,
  isChairman,
  onOpenCreate,
  onOpenDecision,
}: HiringRequestsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      totalHeadcount: requests
        .filter((r) => r.status === "approved" || r.status === "pending")
        .reduce((sum, r) => sum + (r.headcount || 1), 0),
    };
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <i className="ri-check-line text-sm" /> Approved by CEO
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <i className="ri-close-line text-sm" /> Rejected by CEO
          </span>
        );
      case "fulfilled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <i className="ri-checkbox-circle-fill text-sm" /> Position Hired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <i className="ri-time-line text-sm" /> Awaiting CEO Acceptance
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Requisition Report Header */}
      <div className="bg-linear-to-r from-[#253C7D] via-[#1E3066] to-[#14234B] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase text-blue-100">
                Workflow: Manager Request → CEO Decision → Chairman Report
              </span>
              {isChairman && (
                <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full text-xs font-bold">
                  Chairman Oversight View
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Branch Hiring Requisitions
            </h2>
            <p className="text-sm text-blue-100/80 max-w-2xl leading-relaxed">
              Branch managers request new headcount for their branch operations. The CEO authorizes live job recruitment, and all requisition statuses are reported to the Chairman / Chairwoman.
            </p>
          </div>

          {canRequest && (
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-[#253C7D] hover:bg-blue-50 font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer shrink-0"
            >
              <i className="ri-user-add-line text-lg" />
              Request New Employee
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-blue-200 font-semibold">Total Requisitions</p>
            <p className="text-2xl font-black mt-1">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-amber-200 font-semibold">Pending CEO Action</p>
            <p className="text-2xl font-black text-amber-300 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-emerald-200 font-semibold">Approved by CEO</p>
            <p className="text-2xl font-black text-emerald-300 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-sky-200 font-semibold">Headcount Needed</p>
            <p className="text-2xl font-black text-sky-300 mt-1">{stats.totalHeadcount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by role, department, branch, or manager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["all", "pending", "approved", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st} {st === "pending" && stats.pending > 0 && `(${stats.pending})`}
            </button>
          ))}
        </div>
      </div>

      {/* Requisitions List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
          <div className="w-16 h-16 bg-blue-50 text-[#253C7D] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="ri-folder-user-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Hiring Requisitions Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            {canRequest
              ? "Your branch does not currently have any employee requests under this filter. Click 'Request New Employee' to submit a requisition."
              : "No requisitions have been submitted for this branch yet."}
          </p>
          {canRequest && (
            <button
              onClick={onOpenCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl hover:bg-[#1E3066] transition-all cursor-pointer"
            >
              <i className="ri-add-line" /> Create Requisition
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">{req.title}</h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border uppercase ${getUrgencyBadge(req.urgency)}`}>
                      {req.urgency} priority
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 capitalize">
                      {req.employment_type}
                    </span>
                    {req.branches?.name && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#253C7D]/10 text-[#253C7D]">
                        <i className="ri-building-line mr-1" />
                        {req.branches.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span><strong>Department:</strong> {req.department}</span>
                    <span>•</span>
                    <span><strong>Headcount:</strong> {req.headcount} position{req.headcount > 1 ? "s" : ""}</span>
                    <span>•</span>
                    <span><strong>Requested By:</strong> {req.requested_by_name} ({new Date(req.created_at).toLocaleDateString()})</span>
                    {(req.salary_min || req.salary_max) && (
                      <>
                        <span>•</span>
                        <span><strong>Budget Range:</strong> ${req.salary_min || 0} - ${req.salary_max || 0}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {getStatusBadge(req.status)}

                  {/* CEO Decision Actions */}
                  {canApprove && req.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenDecision(req, "approved")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
                        title="CEO Accept & Create Live Job"
                      >
                        <i className="ri-check-line text-sm" /> Accept (CEO)
                      </button>
                      <button
                        onClick={() => onOpenDecision(req, "rejected")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Decline Requisition"
                      >
                        <i className="ri-close-line text-sm" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Justification & Review Notes */}
              {req.justification && (
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700">
                  <p className="font-semibold text-gray-500 mb-0.5 text-[11px] uppercase tracking-wider">
                    Manager Justification & Business Need
                  </p>
                  <p className="leading-relaxed">{req.justification}</p>
                </div>
              )}

              {/* Decision Log / Rejection Reason */}
              {req.status === "rejected" && req.rejection_reason && (
                <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-100 text-xs text-rose-800">
                  <p className="font-bold text-rose-900 mb-0.5 flex items-center gap-1">
                    <i className="ri-error-warning-line" /> CEO Review Feedback:
                  </p>
                  <p>{req.rejection_reason}</p>
                  {req.reviewed_at && (
                    <p className="text-[10px] text-rose-600/80 mt-1">
                      Decided by {req.reviewed_by || "CEO"} on {new Date(req.reviewed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {req.status === "approved" && (
                <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-fill text-emerald-600 text-sm" />
                    <span>Authorized by <strong>{req.reviewed_by || "CEO"}</strong> on {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : "Approval"}. Active job posting live.</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Reported to Chairman
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
