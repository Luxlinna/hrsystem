import { memo } from "react";
import type { HiringRequest } from "../../types";

interface HiringRequestCardProps {
  request: HiringRequest;
  canApprove: boolean;
  onOpenDecision: (req: HiringRequest, action: "approved" | "rejected") => void;
}

export const HiringRequestCard = memo(function HiringRequestCard({
  request: r,
  canApprove,
  onOpenDecision,
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
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all">
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
                By: <strong className="text-gray-700">{r.requested_by_name}</strong>
              </span>
              {(r.salary_min || r.salary_max) && (
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <i className="ri-money-dollar-circle-line" />${Number(r.salary_min || 0).toLocaleString()} - $
                  {Number(r.salary_max || 0).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {r.justification && (
            <div className="mt-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs text-gray-600">
              <strong className="text-gray-700 font-bold block mb-0.5">Manager Justification:</strong>
              {r.justification}
            </div>
          )}

          {r.status === "rejected" && r.rejection_reason && (
            <div className="mt-2 p-3 bg-rose-50/70 rounded-2xl border border-rose-100 text-xs text-rose-800">
              <strong className="text-rose-900 font-bold block mb-0.5">CEO Feedback / Reason:</strong>
              {r.rejection_reason}
            </div>
          )}
        </div>

        {r.status === "pending" && canApprove && (
          <div className="flex items-center gap-2 lg:flex-col lg:w-36 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
            <button
              onClick={() => onOpenDecision(r, "approved")}
              className="flex-1 lg:w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <i className="ri-check-line text-sm" /> Approve & Post
            </button>
            <button
              onClick={() => onOpenDecision(r, "rejected")}
              className="flex-1 lg:w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-sm" /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
