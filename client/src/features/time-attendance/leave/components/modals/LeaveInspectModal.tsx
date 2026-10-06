import { memo } from "react";
import { createPortal } from "react-dom";
import type { LeaveRequest } from "../../types";
import { canUserActOnRequest } from "../../utils/leaveApprovalChain";
import { LeaveDetailStatCards } from "../detail/LeaveDetailStatCards";
import { LeaveDetailEmployeeInfo } from "../detail/LeaveDetailEmployeeInfo";
import { LeaveDetailTypeInfo } from "../detail/LeaveDetailTypeInfo";
import { LeaveDetailApproversInfo } from "../detail/LeaveDetailApproversInfo";
import { LeaveDetailAttachmentSection } from "../detail/LeaveDetailAttachmentSection";

interface LeaveInspectModalProps {
  inspectRequest: LeaveRequest | null;
  onClose: () => void;
  canApproveLeave?: boolean;
  myEmployeeId?: string;
  myDepartment?: string;
  actorRole?: string;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  hasRoleApprovalAccess?: boolean;
  hasManagerEndorseAccess?: boolean;
  hasBuAdminEndorseAccess?: boolean;
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
  onOpenFlowSettings?: () => void;
}

export const LeaveInspectModal = memo(function LeaveInspectModal({
  inspectRequest,
  onClose,
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
  onOpenFlowSettings,
}: LeaveInspectModalProps) {
  if (!inspectRequest) return null;

  const isOwn = inspectRequest.employee_id === myEmployeeId;
  const canCancel = inspectRequest.status === "pending" || ((isOwn || isSuperAdmin || isBranchAdmin || hasRoleApprovalAccess) && inspectRequest.status === "approved");
  const { canAct, actionLabel } = canUserActOnRequest({
    request: inspectRequest,
    myEmployeeId,
    myDepartment,
    actorRole,
    isSuperAdmin,
    isBranchAdmin,
    hasRoleApprovalAccess,
    hasManagerEndorseAccess,
    hasBuAdminEndorseAccess,
  });

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-[#f8fafc] dark:bg-slate-950 overflow-y-auto p-3 sm:p-5 lg:p-7 pb-28 sm:pb-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-4">
        {/* Top Header matching reference */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <span>&larr; Back</span>
          </button>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight text-center flex-1 pr-12">
            View Leave Detail
          </h1>
        </div>

        {/* 1. Top Stat Cards (Entitlement, Used, Available) */}
        <LeaveDetailStatCards request={inspectRequest} />

        {/* 2. Employee Info */}
        <LeaveDetailEmployeeInfo request={inspectRequest} />

        {/* 3. Leave Type Info */}
        <LeaveDetailTypeInfo request={inspectRequest} />

        {/* 4. Approvers Info */}
        <LeaveDetailApproversInfo
          request={inspectRequest}
          onOpenFlowSettings={onOpenFlowSettings}
        />

        {/* 5. Attachment Info */}
        <LeaveDetailAttachmentSection request={inspectRequest} />

        {/* Action Controls for Approvers / Owner */}
        {(canAct || canCancel) && (
          <div className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs flex items-center justify-end gap-2.5">
            {canAct && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenApprovalModal(inspectRequest, "approved");
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {actionLabel || "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenApprovalModal(inspectRequest, "rejected");
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Reject
                </button>
              </>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCancelModal(inspectRequest);
                }}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel Leave
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
});
