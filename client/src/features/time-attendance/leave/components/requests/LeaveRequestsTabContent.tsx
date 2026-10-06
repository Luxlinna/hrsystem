import { memo, useState, useCallback } from "react";
import type { LeaveRequest } from "../../types";
import { LeaveFilterBar } from "./LeaveFilterBar";
import { LeaveTableView } from "./LeaveTableView";
import { LeaveCardView } from "./LeaveCardView";
import { LeavePagination } from "./LeavePagination";

interface LeaveRequestsTabContentProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  leaveTypeFilter: string;
  setLeaveTypeFilter: (type: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (dept: string) => void;
  departments: string[];
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: (page: number) => void;
  pagedRows: LeaveRequest[];
  totalRows: number;
  pageStart: number;
  pageEnd: number;
  safePage: number;
  totalPages: number;
  canApproveLeave: boolean;
  myEmployeeId: string;
  myDepartment?: string;
  actorRole?: string;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  hasRoleApprovalAccess?: boolean;
  hasManagerEndorseAccess?: boolean;
  hasBuAdminEndorseAccess?: boolean;
  onRequestLeave: () => void;
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
  onInspectRequest: (req: LeaveRequest) => void;
  onDeleteRequest?: (req: LeaveRequest) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkApprove?: (ids: string[]) => void;
}

export const LeaveRequestsTabContent = memo(function LeaveRequestsTabContent({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  leaveTypeFilter,
  setLeaveTypeFilter,
  departmentFilter,
  setDepartmentFilter,
  departments,
  pageSize,
  setPageSize,
  setPage,
  pagedRows,
  totalRows,
  pageStart,
  pageEnd,
  safePage,
  totalPages,
  canApproveLeave,
  myEmployeeId,
  myDepartment,
  actorRole,
  isSuperAdmin,
  isBranchAdmin,
  hasRoleApprovalAccess,
  hasManagerEndorseAccess,
  hasBuAdminEndorseAccess,
  onRequestLeave,
  onOpenApprovalModal,
  onOpenCancelModal,
  onInspectRequest,
  onDeleteRequest,
  onBulkDelete,
  onBulkApprove,
}: LeaveRequestsTabContentProps) {
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
        setSelectedIds(new Set(pagedRows.map((r) => r.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [pagedRows]
  );

  const handleTriggerBulkDelete = useCallback(() => {
    if (!onBulkDelete || selectedIds.size === 0) return;
    onBulkDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [onBulkDelete, selectedIds]);

  const handleTriggerBulkApprove = useCallback(() => {
    if (!onBulkApprove || selectedIds.size === 0) return;
    onBulkApprove(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [onBulkApprove, selectedIds]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <LeaveFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        leaveTypeFilter={leaveTypeFilter}
        setLeaveTypeFilter={setLeaveTypeFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        departments={departments}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setPage={setPage}
      />

      {/* Floating Selection Action Bar (shows when items are checked) */}
      {selectedIds.size > 0 && (
        <div className="bg-[#253C7D] rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-lg shadow-[#253C7D]/20 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-checkbox-line text-white" />
            </div>
            <span className="text-white text-xs font-semibold">
              {selectedIds.size} leave request{selectedIds.size === 1 ? "" : "s"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {canApproveLeave && onBulkApprove && (
              <button
                type="button"
                onClick={handleTriggerBulkApprove}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <i className="ri-checkbox-circle-line" />
                Approve Selected
              </button>
            )}
            {onBulkDelete && (
              <button
                type="button"
                onClick={handleTriggerBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                <i className="ri-delete-bin-line" />
                Delete Selected
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded-xl text-xs font-medium hover:bg-white/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Table / Cards Box */}
      <div className="bg-transparent lg:bg-white rounded-3xl lg:border lg:border-gray-200/80 lg:shadow-2xs">
        {totalRows === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
              <i className="ri-file-list-3-line" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Leave Requests Found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              No leave requests match your search criteria or selected status filters.
            </p>
            <button
              onClick={onRequestLeave}
              className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Submit Leave Request
            </button>
          </div>
        ) : (
          <>
            <LeaveTableView
              requests={pagedRows}
              canApproveLeave={canApproveLeave}
              myEmployeeId={myEmployeeId}
              myDepartment={myDepartment}
              actorRole={actorRole}
              isSuperAdmin={isSuperAdmin}
              isBranchAdmin={isBranchAdmin}
              hasRoleApprovalAccess={hasRoleApprovalAccess}
              hasManagerEndorseAccess={hasManagerEndorseAccess}
              hasBuAdminEndorseAccess={hasBuAdminEndorseAccess}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onOpenApprovalModal={onOpenApprovalModal}
              onOpenCancelModal={onOpenCancelModal}
              onInspectRequest={onInspectRequest}
              onDeleteRequest={onDeleteRequest}
            />

            <LeaveCardView
              requests={pagedRows}
              canApproveLeave={canApproveLeave}
              myEmployeeId={myEmployeeId}
              myDepartment={myDepartment}
              actorRole={actorRole}
              isSuperAdmin={isSuperAdmin}
              isBranchAdmin={isBranchAdmin}
              hasRoleApprovalAccess={hasRoleApprovalAccess}
              hasManagerEndorseAccess={hasManagerEndorseAccess}
              hasBuAdminEndorseAccess={hasBuAdminEndorseAccess}
              onOpenApprovalModal={onOpenApprovalModal}
              onOpenCancelModal={onOpenCancelModal}
              onInspectRequest={onInspectRequest}
              onDeleteRequest={onDeleteRequest}
            />

            <LeavePagination
              pageStart={pageStart}
              pageEnd={pageEnd}
              totalRows={totalRows}
              safePage={safePage}
              totalPages={totalPages}
              setPage={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
});
