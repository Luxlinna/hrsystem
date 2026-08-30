import { useCallback } from "react";
import { LeaveHeader } from "./components/LeaveHeader";
import { LeaveTabsBar } from "./components/LeaveTabsBar";
import { LeaveStatsRow } from "./components/LeaveStatsRow";
import { LeaveRequestsTabContent } from "./components/requests/LeaveRequestsTabContent";
import { LeaveBalancesTabContent } from "./components/balances/LeaveBalancesTabContent";
import { LeaveCalendarTabContent } from "./components/calendar/LeaveCalendarTabContent";
import { LeaveModalsContainer } from "./components/modals/LeaveModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useLeave } from "./hooks/useLeave";
import { exportLeaveToCSV } from "./exportUtils";
import { INITIAL_LEAVE_FORM } from "./constants";

export default function Leave() {
  const l = useLeave();

  const handleExport = useCallback(() => {
    const success = exportLeaveToCSV(l.filteredRequests);
    l.setToast(
      success
        ? { type: "success", message: "Exported leave records to CSV" }
        : { type: "info", message: "No requests to export with current filters" }
    );
  }, [l]);

  const handleOpenApprovalModal = useCallback((req: any, action: "approved" | "rejected") => {
    l.setSelectedRequest(req);
    l.setApprovalAction(action);
    l.setApprovalNote("");
    l.setShowApprovalModal(true);
  }, [l]);

  const handleOpenCancelModal = useCallback((req: any) => {
    l.setCancelTargetRequest(req);
    l.setCancelReason("");
    l.setShowCancelModal(true);
  }, [l]);

  const handleOpenRequestModalForEmp = useCallback((empId: string) => {
    l.setFormData({ ...INITIAL_LEAVE_FORM, employee_id: empId });
    l.setShowForm(true);
  }, [l]);

  if (l.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (l.isPartnerBranchBlocked) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <LeaveHeader onLeaveTodayCount={0} onExportCSV={() => {}} onRequestLeave={() => {}} />
        <PartnerBranchPrivacyShield moduleName="Leave Management" userBranchName={l.userBranchName} hasNoBranch={!l.userBranchId} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {l.toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-extrabold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-150 ${
            l.toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : l.toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-slate-50 text-slate-800 border-slate-200"
          }`}
        >
          <i
            className={`text-sm ${
              l.toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-600"
                : l.toast.type === "error"
                ? "ri-error-warning-fill text-rose-600"
                : "ri-information-fill text-slate-600"
            }`}
          />
          <span>{l.toast.message}</span>
        </div>
      )}

      <LeaveHeader
        onLeaveTodayCount={l.stats.onLeaveToday}
        onExportCSV={handleExport}
        onRequestLeave={() => {
          l.setFormData({ ...INITIAL_LEAVE_FORM, employee_id: l.myEmployee?.id || "" });
          l.setShowForm(true);
        }}
      />

      <LeaveStatsRow stats={l.stats} onSelectTab={l.setActiveTab} onFilterStatus={l.setStatusFilter} />

      <LeaveTabsBar
        activeTab={l.activeTab}
        setActiveTab={l.setActiveTab}
        pendingCount={l.stats.pending}
        onLeaveTodayCount={l.stats.onLeaveToday}
      />

      {l.activeTab === "requests" && (
        <LeaveRequestsTabContent
          searchQuery={l.searchQuery}
          setSearchQuery={l.setSearchQuery}
          statusFilter={l.statusFilter}
          setStatusFilter={l.setStatusFilter}
          leaveTypeFilter={l.leaveTypeFilter}
          setLeaveTypeFilter={l.setLeaveTypeFilter}
          departmentFilter={l.departmentFilter}
          setDepartmentFilter={l.setDepartmentFilter}
          departments={l.departments}
          pageSize={l.pageSize}
          setPageSize={l.setPageSize}
          page={l.page}
          setPage={l.setPage}
          pagedRows={l.pagedRows}
          totalRows={l.filteredRequests.length}
          pageStart={l.pageStart}
          pageEnd={l.pageEnd}
          safePage={l.safePage}
          totalPages={l.totalPages}
          canApproveLeave={l.canApproveLeave}
          myEmployeeId={l.myEmployee?.id || ""}
          onRequestLeave={() => {
            l.setFormData({ ...INITIAL_LEAVE_FORM, employee_id: l.myEmployee?.id || "" });
            l.setShowForm(true);
          }}
          onOpenApprovalModal={handleOpenApprovalModal}
          onOpenCancelModal={handleOpenCancelModal}
          onInspectRequest={l.setInspectRequest}
        />
      )}

      {l.activeTab === "balances" && (
        <LeaveBalancesTabContent
          employees={l.employees}
          myEmployee={l.myEmployee}
          canViewAll={l.canViewAll}
          canViewOwnBranch={l.canViewOwnBranch}
          leaveTypePolicies={l.leaveTypePolicies}
          getEntitlement={l.getEntitlement}
          getUsedDays={l.getUsedDays}
          getPendingDays={l.getPendingDays}
          getRemaining={l.getRemaining}
          onRequestLeaveForEmp={handleOpenRequestModalForEmp}
        />
      )}

      {l.activeTab === "calendar" && (
        <LeaveCalendarTabContent
          calendarYear={l.calendarYear}
          calendarMonth={l.calendarMonth}
          selectedCalendarDay={l.selectedCalendarDay}
          setSelectedCalendarDay={l.setSelectedCalendarDay}
          calDeptFilter={l.calDeptFilter}
          setCalDeptFilter={l.setCalDeptFilter}
          departments={l.departments}
          calendarDays={l.calendarDays}
          firstDayOfWeek={l.firstDayOfWeek}
          prevMonth={l.prevMonth}
          nextMonth={l.nextMonth}
          todayMonth={l.todayMonth}
          selectedDayDateStr={l.selectedDayDateStr}
          selectedDayLeaves={l.selectedDayLeaves}
          onInspectRequest={l.setInspectRequest}
        />
      )}

      <LeaveModalsContainer
        {...l}
        onOpenApprovalModal={handleOpenApprovalModal}
        onOpenCancelModal={handleOpenCancelModal}
      />
    </div>
  );
}
