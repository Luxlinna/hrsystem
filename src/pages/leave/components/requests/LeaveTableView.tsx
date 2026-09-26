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
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
  onInspectRequest: (req: LeaveRequest) => void;
}

export const LeaveTableView = memo(function LeaveTableView({
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
}: LeaveTableViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(requests.map((r) => r.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [requests]
  );

  const allSelected = requests.length > 0 && selectedIds.size === requests.length;

  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <LeaveTableHeader
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
        />
        <tbody className="divide-y divide-gray-100 bg-white">
          {requests.map((r, idx) => {
            const isOwn = r.employee_id === myEmployeeId;
            const canCancel = isOwn && (r.status === "pending" || r.status === "approved");
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
                onToggleSelect={handleToggleSelect}
                canAct={canAct}
                actionLabel={actionLabel}
                canCancel={canCancel}
                onInspect={onInspectRequest}
                onApprove={(req) => onOpenApprovalModal(req, "approved")}
                onReject={(req) => onOpenApprovalModal(req, "rejected")}
                onCancel={onOpenCancelModal}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
