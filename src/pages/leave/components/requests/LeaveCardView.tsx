import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG, STATUS_CONFIG } from "../../constants";
import { formatDateShort } from "../../dateUtils";

interface LeaveCardViewProps {
  requests: LeaveRequest[];
  canApproveLeave: boolean;
  myEmployeeId: string;
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
  onInspectRequest: (req: LeaveRequest) => void;
}

export const LeaveCardView = memo(function LeaveCardView({
  requests,
  canApproveLeave,
  myEmployeeId,
  onOpenApprovalModal,
  onOpenCancelModal,
  onInspectRequest,
}: LeaveCardViewProps) {
  return (
    <div className="lg:hidden divide-y divide-gray-100">
      {requests.map((r) => {
        const typeCfg = LEAVE_TYPE_CONFIG[r.leave_type] || LEAVE_TYPE_CONFIG.annual;
        const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
        const isOwn = r.employee_id === myEmployeeId;
        const canCancel = isOwn && (r.status === "pending" || r.status === "approved");

        return (
          <div
            key={r.id}
            id={`leave-request-mobile-${r.id}`}
            onClick={() => onInspectRequest(r)}
            className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
                  {r.employees?.first_name?.[0]}
                  {r.employees?.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-gray-900 text-xs sm:text-[13px] truncate">
                    {r.employees?.first_name} {r.employees?.last_name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">
                    {r.employees?.department || "General"}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${statusCfg.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-xl">
              <span className={`font-bold flex items-center gap-1.5 ${typeCfg.text}`}>
                <i className={typeCfg.icon} />
                {typeCfg.label}
              </span>
              <span className="font-extrabold text-gray-900">
                {r.days} {r.days === 1 ? "day" : "days"} ({formatDateShort(r.start_date)} - {formatDateShort(r.end_date)})
              </span>
            </div>

            {r.reason && (
              <p className="text-xs text-gray-500 line-clamp-1 italic">
                &ldquo;{r.reason}&rdquo;
              </p>
            )}

            {/* Actions */}
            <div
              className="flex items-center justify-end gap-2 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {canApproveLeave && r.status === "pending" && (
                <>
                  <button
                    onClick={() => onOpenApprovalModal(r, "approved")}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onOpenApprovalModal(r, "rejected")}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </>
              )}

              {canCancel && (
                <button
                  onClick={() => onOpenCancelModal(r)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={() => onInspectRequest(r)}
                className="p-1.5 text-gray-400 hover:text-[#253C7D] transition-colors cursor-pointer"
              >
                <i className="ri-eye-line text-base" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});
