import { memo } from "react";
import type { HiringRequest } from "../../types";
import { evaluateStageSla } from "../../constants/slaConfig";

interface Props {
  request: HiringRequest;
}

export const HiringRequestStatusBadges = memo(function HiringRequestStatusBadges({ request: r }: Props) {
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
            <i className="ri-checkbox-circle-fill text-sm" /> Fully Approved & Job Live
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
      case "pending_chairman_review":
      case "pending_hr_admin_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <i className="ri-vip-crown-line text-sm" /> Stage 3: Awaiting Chairwoman Final Authorization
          </span>
        );
      case "pending_hr_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <i className="ri-user-star-line text-sm" /> Stage 2: In HR Manager Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <i className="ri-time-line text-sm" /> Stage 1: Awaiting Branch Endorsement
          </span>
        );
    }
  };

  const slaEval = evaluateStageSla(r.status, r.stage_entered_at || r.created_at, false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {getStatusBadge(r.status)}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${getUrgencyBadge(r.urgency)}`}>
        {r.urgency.toUpperCase()}
      </span>
      {slaEval && r.status !== "approved" && r.status !== "rejected" && (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
            slaEval.isOverdue
              ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
              : slaEval.urgencyLevel === "warning"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
          title={`Allowed: ${slaEval.allowedHours}h · Elapsed: ${slaEval.hoursElapsed}h`}
        >
          <i className={slaEval.isOverdue ? "ri-alarm-warning-line text-rose-600" : "ri-time-line"} />
          {slaEval.badgeText}
        </span>
      )}
    </div>
  );
});
