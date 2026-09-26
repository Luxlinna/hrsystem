import { memo } from "react";
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
}: LeaveInspectModalProps) {
  if (!inspectRequest) return null;

  const isOwn = inspectRequest.employee_id === myEmployeeId;
  const canCancel = isOwn && (inspectRequest.status === "pending" || inspectRequest.status === "approved");
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

  return (
    <div className="fixed inset-0 z-50 bg-[#f8fafc] overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Header matching reference */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-slate-700 tracking-tight">
            View Leave Detail
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-medium text-gray-700 shadow-2xs transition-colors cursor-pointer"
          >
            <span>&larr; Back</span>
          </button>
        </div>

        {/* 1. Top Stat Cards (Entitlement, Used, Available) */}
        <LeaveDetailStatCards request={inspectRequest} />

        {/* 2. Employee Info */}
        <LeaveDetailEmployeeInfo request={inspectRequest} />

        {/* 3. Leave Type Info */}
        <LeaveDetailTypeInfo request={inspectRequest} />

        {/* 4. Approvers Info */}
        <LeaveDetailApproversInfo request={inspectRequest} />

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
    </div>
  );
});
