import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { formatDateShort } from "../../dateUtils";
import { getLeaveTypeDisplay } from "../../utils/leaveDisplayUtils";
import { canUserActOnRequest } from "../../utils/leaveApprovalChain";

interface LeaveCardViewProps {
  requests: LeaveRequest[];
  canApproveLeave: boolean;
  myEmployeeId: string;
  myDepartment?: string;
  actorRole?: string;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  hasRoleApprovalAccess?: boolean;
  hasManagerEndorseAccess?: boolean;
  hasBuAdminEndorseAccess?: boolean;
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
  onInspectRequest: (req: LeaveRequest) => void;
  onDeleteRequest?: (req: LeaveRequest) => void;
}

export const LeaveCardView = memo(function LeaveCardView({
  requests,
  canApproveLeave: _canApproveLeave,
  myEmployeeId,
  myDepartment,
  actorRole,
  isSuperAdmin,
  isBranchAdmin,
  hasRoleApprovalAccess,
  hasManagerEndorseAccess,
  hasBuAdminEndorseAccess,
  onOpenApprovalModal,
  onOpenCancelModal,
  onInspectRequest,
  onDeleteRequest,
}: LeaveCardViewProps) {
  return (
    <div className="lg:hidden space-y-3">
      {requests.map((r, idx) => {
        const typeInfo = getLeaveTypeDisplay(r.leave_type);
        const simpleTypeName = typeInfo.fullName.split("(")[0].trim();
        const isOwn = r.employee_id === myEmployeeId;
        const canCancel = r.status === "pending" || ((isOwn || isSuperAdmin || isBranchAdmin || _canApproveLeave) && r.status === "approved");
        const canDelete = isSuperAdmin || isBranchAdmin || _canApproveLeave || isOwn;
        
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Employee";
        const deptName = r.employees?.department || "General";
        const initials = `${r.employees?.first_name?.[0] || ""}${r.employees?.last_name?.[0] || ""}`.toUpperCase() || "EM";
        const reqCode = `REQ-${(idx + 100)}`;

        const { canAct, actionLabel } = canUserActOnRequest({
          request: r, myEmployeeId, myDepartment, actorRole,
          isSuperAdmin, isBranchAdmin, hasRoleApprovalAccess,
          hasManagerEndorseAccess, hasBuAdminEndorseAccess,
        });

        return (
          <div
            key={r.id}
            id={`leave-request-card-${r.id}`}
            className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 space-y-2 hover:shadow-xs transition-all cursor-pointer"
            onClick={() => onInspectRequest(r)}
          >
            {/* Top Header: Employee Avatar, Name, Department & Status Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {r.employees?.avatar_url ? (
                  <img
                    src={r.employees.avatar_url}
                    alt={empName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight truncate">
                    {empName}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.2 truncate">
                    {deptName}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {r.status === "pending" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Pending</span>
                  </span>
                ) : r.status === "approved" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Approved</span>
                  </span>
                ) : r.status === "rejected" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Rejected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Cancelled</span>
                  </span>
                )}
              </div>
            </div>

            {/* Middle Highlight Box: Leave Type & Dates */}
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] text-emerald-900">
              <span className="font-bold text-[11px] sm:text-xs flex items-center gap-1.5 text-emerald-800 truncate">
                <i className="ri-sun-line text-xs text-emerald-600 shrink-0" />
                <span className="truncate">{simpleTypeName} ({typeInfo.code})</span>
              </span>
              <span className="font-bold text-[11px] sm:text-xs text-slate-900 shrink-0">
                {r.days} {r.days === 1 ? "day" : "days"} ({formatDateShort(r.start_date)} - {formatDateShort(r.end_date)})
              </span>
            </div>

            {/* Reason Text */}
            {r.reason && (
              <p className="text-[11px] sm:text-xs text-slate-500 italic leading-relaxed pt-0.2 line-clamp-2">
                &ldquo;{r.reason}&rdquo;
              </p>
            )}

            {/* Bottom Row: Request ID & Actions */}
            <div
              className="border-t border-slate-100 pt-2 flex items-center justify-between gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] font-mono font-medium text-slate-400 tracking-wider">
                {reqCode}
              </span>

              <div className="flex items-center gap-1.5">
                {canAct && (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenApprovalModal(r, "approved")}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      {actionLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenApprovalModal(r, "rejected")}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}

                {canCancel && (
                  <button
                    type="button"
                    onClick={() => onOpenCancelModal(r)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                )}

                {canDelete && onDeleteRequest && (
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(r)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Request"
                  >
                    <i className="ri-delete-bin-line text-xs" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
