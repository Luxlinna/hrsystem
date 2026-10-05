import { memo, useState, useCallback } from "react";
import type { LeaveRequest } from "../../types";
import { canUserActOnRequest } from "../../utils/leaveApprovalChain";
import { LeaveTableHeader } from "./LeaveTableHeader";
import { LeaveTableRow } from "./LeaveTableRow";

interface LeaveTableViewProps {
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
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
  onInspectRequest: (req: LeaveRequest) => void;
  onDeleteRequest?: (req: LeaveRequest) => void;
}

export const LeaveTableView = memo(function LeaveTableView({
  requests,
  canApproveLeave,
  myEmployeeId,
  myDepartment,
  actorRole,
  isSuperAdmin,
  isBranchAdmin,
  hasRoleApprovalAccess,
  hasManagerEndorseAccess,
  hasBuAdminEndorseAccess,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenApprovalModal,
  onOpenCancelModal,
  onInspectRequest,
  onDeleteRequest,
}: LeaveTableViewProps) {

  const allSelected = requests.length > 0 && selectedIds.size === requests.length;

  return (
    <div className="hidden lg:block overflow-x-auto min-h-[220px]">
      <table className="w-full text-left text-xs border-collapse">
        <LeaveTableHeader
          allSelected={allSelected}
          onSelectAll={onSelectAll}
        />
        <tbody className="divide-y divide-gray-100 bg-white">
          {requests.map((r, idx) => {
            const isOwn = r.employee_id === myEmployeeId;
            const canCancel = (isOwn || isSuperAdmin) && (r.status === "pending" || r.status === "approved");
            const canDelete = isSuperAdmin || isBranchAdmin || canApproveLeave || isOwn;
            const { canAct, actionLabel } = canUserActOnRequest({
              request: r,
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
              <LeaveTableRow
                key={r.id}
                request={r}
                index={idx}
                isSelected={selectedIds.has(r.id)}
                onToggleSelect={onToggleSelect}
                canAct={canAct}
                actionLabel={actionLabel}
                canCancel={canCancel}
                canDelete={canDelete}
                onInspect={onInspectRequest}
                onApprove={(req) => onOpenApprovalModal(req, "approved")}
                onReject={(req) => onOpenApprovalModal(req, "rejected")}
                onCancel={onOpenCancelModal}
                onDelete={onDeleteRequest}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
