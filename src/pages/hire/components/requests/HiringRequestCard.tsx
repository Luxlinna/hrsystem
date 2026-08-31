import { memo } from "react";
import type { HiringRequest } from "../../types";

interface HiringRequestCardProps {
  request: HiringRequest;
  canApprove: boolean;
  canBranchApprove?: boolean;
  canHrReview?: boolean;
  onOpenDecision: (req: HiringRequest, action: "approved" | "rejected") => void;
  onDelete?: (id: string) => void;
}

export const HiringRequestCard = memo(function HiringRequestCard({
  request: r,
  canApprove,
  canBranchApprove = false,
  canHrReview = false,
  onOpenDecision,
  onDelete,
}: HiringRequestCardProps) {
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

  const isBranchStage = !r.status || r.status === "pending" || r.status === "pending_branch_review";
  const isHrStage = r.status === "pending_hr_review";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <i className="ri-checkbox-circle-fill text-sm" /> Approved & Job Live
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <i className="ri-close-line text-sm" /> Rejected
          </span>
        );
      case "fulfilled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <i className="ri-team-fill text-sm" /> Position Hired
          </span>
        );
      case "pending_hr_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 animate-pulse">
            <i className="ri-building-4-line text-sm" /> Round 2: In HR Division Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <i className="ri-time-line text-sm" /> Round 1: Awaiting Branch Endorsement
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all relative group">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getUrgencyBadge(r.urgency)}`}>
              {r.urgency}
            </span>
            {getStatusBadge(r.status)}
            <span className="text-xs text-gray-400 font-medium">
              Requested {new Date(r.created_at).toLocaleDateString()}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {r.title}
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-extrabold">
                {r.headcount} {r.headcount > 1 ? "Openings" : "Opening"}
              </span>
            </h3>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 font-medium flex-wrap">
              <span className="flex items-center gap-1">
                <i className="ri-building-line text-gray-400" />
                {r.department}
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-map-pin-line text-gray-400" />
                {r.branches?.name || "Headquarters"}
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-user-follow-line text-gray-400" />
                Requester: <strong className="text-gray-700">{r.requested_by_name}</strong>
              </span>
              {(r.salary_min || r.salary_max) && (
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <i className="ri-money-dollar-circle-line" />${Number(r.salary_min || 0).toLocaleString()} - $
                  {Number(r.salary_max || 0).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Workflow Stage Details */}
          <div className="flex items-center gap-3 pt-1 flex-wrap text-xs">
            {r.branch_approved_by && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                <i className="ri-checkbox-circle-line text-emerald-600" />
                Branch Endorsed By: <strong>{r.branch_approved_by}</strong>
                {r.branch_approved_at && ` (${new Date(r.branch_approved_at).toLocaleDateString()})`}
              </span>
            )}
            {r.hr_reviewed_by && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 font-medium">
                <i className="ri-award-line text-sky-600" />
                HR Authorized By: <strong>{r.hr_reviewed_by}</strong>
              </span>
            )}
            {r.hr_assigned_to_name && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                <i className="ri-user-star-line text-purple-600" />
                Assigned HR Officer: <strong>{r.hr_assigned_to_name}</strong>
              </span>
            )}
          </div>

          {r.justification && (
            <div className="mt-2 p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs text-gray-600">
              <strong className="text-gray-700 font-bold block mb-0.5">Manager Justification:</strong>
              {r.justification}
            </div>
          )}

          {r.status === "rejected" && r.rejection_reason && (
            <div className="mt-2 p-3 bg-rose-50/70 rounded-2xl border border-rose-100 text-xs text-rose-800">
              <strong className="text-rose-900 font-bold block mb-0.5">Rejection Feedback / Reason:</strong>
              {r.rejection_reason}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 lg:flex-col shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
          {/* Round 1: Branch Approval Action */}
          {isBranchStage && (canBranchApprove || canApprove) && (
            <>
              <button
                onClick={() => onOpenDecision(r, "approved")}
                className="flex-1 lg:w-44 py-2.5 px-3 rounded-xl bg-[#253C7D] hover:bg-[#1B2B5A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <i className="ri-send-plane-fill text-sm" /> Approve & Forward to HR
              </button>
              <button
                onClick={() => onOpenDecision(r, "rejected")}
                className="flex-1 lg:w-44 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-sm" /> Reject Requisition
              </button>
            </>
          )}

          {/* Round 2: HR Division Authorization Action */}
          {isHrStage && (canHrReview || canApprove) && (
            <>
              <button
                onClick={() => onOpenDecision(r, "approved")}
                className="flex-1 lg:w-44 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <i className="ri-checkbox-circle-line text-sm" /> Authorize & Publish Job
              </button>
              <button
                onClick={() => onOpenDecision(r, "rejected")}
                className="flex-1 lg:w-44 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-sm" /> Reject Requisition
              </button>
            </>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(r.id)}
              title="Delete Requisition"
              className="py-2 px-3 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-200 hover:border-rose-200 transition-all cursor-pointer lg:w-44"
            >
              <i className="ri-delete-bin-line text-sm" /> Delete Requisition
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
