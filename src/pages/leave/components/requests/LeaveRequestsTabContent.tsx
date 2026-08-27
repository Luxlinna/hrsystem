import { memo } from "react";
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
  onRequestLeave: () => void;
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
  onInspectRequest: (req: LeaveRequest) => void;
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
  onRequestLeave,
  onOpenApprovalModal,
  onOpenCancelModal,
  onInspectRequest,
}: LeaveRequestsTabContentProps) {
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

      {/* Main Table / Cards Box */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
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
              onOpenApprovalModal={onOpenApprovalModal}
              onOpenCancelModal={onOpenCancelModal}
              onInspectRequest={onInspectRequest}
            />

            <LeaveCardView
              requests={pagedRows}
              canApproveLeave={canApproveLeave}
              myEmployeeId={myEmployeeId}
              onOpenApprovalModal={onOpenApprovalModal}
              onOpenCancelModal={onOpenCancelModal}
              onInspectRequest={onInspectRequest}
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
