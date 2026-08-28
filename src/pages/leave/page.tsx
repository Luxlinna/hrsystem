import { LeaveHeader } from "./components/LeaveHeader";
import { LeaveTabsBar } from "./components/LeaveTabsBar";
import { LeaveStatsRow } from "./components/LeaveStatsRow";
import { LeaveRequestsTabContent } from "./components/requests/LeaveRequestsTabContent";
import { LeaveBalancesTabContent } from "./components/balances/LeaveBalancesTabContent";
import { LeaveCalendarTabContent } from "./components/calendar/LeaveCalendarTabContent";
import { LeaveRequestModal } from "./components/modals/LeaveRequestModal";
import { LeaveApprovalModal } from "./components/modals/LeaveApprovalModal";
import { LeaveCancelModal } from "./components/modals/LeaveCancelModal";
import { LeaveInspectModal } from "./components/modals/LeaveInspectModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useLeave } from "./hooks/useLeave";
import { exportLeaveToCSV } from "./exportUtils";
import { INITIAL_LEAVE_FORM } from "./constants";

export default function Leave() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    canViewAll,
    canViewOwnBranch,
    canManage,
    canApproveLeave,
    employees,
    myEmployee,
    myApproverName,
    leaveTypePolicies,
    loading,
    stats,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    leaveTypeFilter,
    setLeaveTypeFilter,
    pageSize,
    setPageSize,
    page,
    setPage,
    departments,
    filteredRequests,
    totalPages,
    safePage,
    pageStart,
    pageEnd,
    pagedRows,
    showForm,
    setShowForm,
    formData,
    setFormData,
    submitting,
    handleSubmitRequest,
    selectedRequest,
    setSelectedRequest,
    approvalNote,
    setApprovalNote,
    showApprovalModal,
    setShowApprovalModal,
    approvalAction,
    setApprovalAction,
    processingApproval,
    handleProcessApproval,
    cancelTargetRequest,
    setCancelTargetRequest,
    cancelReason,
    setCancelReason,
    showCancelModal,
    setShowCancelModal,
    processingCancel,
    handleCancelRequest,
    inspectRequest,
    setInspectRequest,
    toast,
    setToast,
    getEntitlement,
    getUsedDays,
    getPendingDays,
    getRemaining,
    calendarYear,
    calendarMonth,
    selectedCalendarDay,
    setSelectedCalendarDay,
    calDeptFilter,
    setCalDeptFilter,
    prevMonth,
    nextMonth,
    todayMonth,
    calendarDays,
    firstDayOfWeek,
    selectedDayDateStr,
    selectedDayLeaves,
  } = useLeave();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <LeaveHeader
          onLeaveTodayCount={0}
          onExportCSV={() => {}}
          onRequestLeave={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Leave Management"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  const handleExport = () => {
    const success = exportLeaveToCSV(filteredRequests);
    if (!success) {
      setToast({ type: "info", message: "No requests to export with current filters" });
    } else {
      setToast({ type: "success", message: "Exported leave records to CSV" });
    }
  };

  const handleOpenApprovalModal = (req: any, action: "approved" | "rejected") => {
    setSelectedRequest(req);
    setApprovalAction(action);
    setApprovalNote("");
    setShowApprovalModal(true);
  };

  const handleOpenCancelModal = (req: any) => {
    setCancelTargetRequest(req);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleOpenRequestModalForEmp = (empId: string) => {
    setFormData({
      ...INITIAL_LEAVE_FORM,
      employee_id: empId,
    });
    setShowForm(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-extrabold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-150 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-slate-50 text-slate-800 border-slate-200"
          }`}
        >
          <i
            className={`text-sm ${
              toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-600"
                : toast.type === "error"
                ? "ri-error-warning-fill text-rose-600"
                : "ri-information-fill text-slate-600"
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <LeaveHeader
        onLeaveTodayCount={stats.onLeaveToday}
        onExportCSV={handleExport}
        onRequestLeave={() => {
          setFormData({
            ...INITIAL_LEAVE_FORM,
            employee_id: myEmployee?.id || "",
          });
          setShowForm(true);
        }}
      />

      {/* Operational Stats Row */}
      <LeaveStatsRow
        stats={stats}
        onSelectTab={setActiveTab}
        onFilterStatus={setStatusFilter}
      />

      {/* Navigation Tabs */}
      <LeaveTabsBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={stats.pending}
        onLeaveTodayCount={stats.onLeaveToday}
      />

      {/* Tab 1: Requests Queue */}
      {activeTab === "requests" && (
        <LeaveRequestsTabContent
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
          page={page}
          setPage={setPage}
          pagedRows={pagedRows}
          totalRows={filteredRequests.length}
          pageStart={pageStart}
          pageEnd={pageEnd}
          safePage={safePage}
          totalPages={totalPages}
          canApproveLeave={canApproveLeave}
          myEmployeeId={myEmployee?.id || ""}
          onRequestLeave={() => {
            setFormData({
              ...INITIAL_LEAVE_FORM,
              employee_id: myEmployee?.id || "",
            });
            setShowForm(true);
          }}
          onOpenApprovalModal={handleOpenApprovalModal}
          onOpenCancelModal={handleOpenCancelModal}
          onInspectRequest={setInspectRequest}
        />
      )}

      {/* Tab 2: Balances & Entitlements */}
      {activeTab === "balances" && (
        <LeaveBalancesTabContent
          employees={employees}
          myEmployee={myEmployee}
          canViewAll={canViewAll}
          canViewOwnBranch={canViewOwnBranch}
          leaveTypePolicies={leaveTypePolicies}
          getEntitlement={getEntitlement}
          getUsedDays={getUsedDays}
          getPendingDays={getPendingDays}
          getRemaining={getRemaining}
          onRequestLeaveForEmp={handleOpenRequestModalForEmp}
        />
      )}

      {/* Tab 3: Leave Calendar Planner */}
      {activeTab === "calendar" && (
        <LeaveCalendarTabContent
          calendarYear={calendarYear}
          calendarMonth={calendarMonth}
          selectedCalendarDay={selectedCalendarDay}
          setSelectedCalendarDay={setSelectedCalendarDay}
          calDeptFilter={calDeptFilter}
          setCalDeptFilter={setCalDeptFilter}
          departments={departments}
          calendarDays={calendarDays}
          firstDayOfWeek={firstDayOfWeek}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          todayMonth={todayMonth}
          selectedDayDateStr={selectedDayDateStr}
          selectedDayLeaves={selectedDayLeaves}
          onInspectRequest={setInspectRequest}
        />
      )}

      {/* Submit Leave Modal */}
      <LeaveRequestModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        formData={formData}
        setFormData={setFormData}
        employees={employees}
        myEmployee={myEmployee}
        myApproverName={myApproverName}
        canManage={canManage}
        submitting={submitting}
        getRemaining={getRemaining}
        onSubmit={handleSubmitRequest}
      />

      {/* Approval / Rejection Modal */}
      <LeaveApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        selectedRequest={selectedRequest}
        approvalAction={approvalAction}
        approvalNote={approvalNote}
        setApprovalNote={setApprovalNote}
        processingApproval={processingApproval}
        onConfirm={handleProcessApproval}
      />

      {/* Cancel Leave Modal */}
      <LeaveCancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        cancelTargetRequest={cancelTargetRequest}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        processingCancel={processingCancel}
        onConfirm={handleCancelRequest}
      />

      {/* Inspect Leave Detail Modal */}
      <LeaveInspectModal
        inspectRequest={inspectRequest}
        onClose={() => setInspectRequest(null)}
        canApproveLeave={canApproveLeave}
        myEmployeeId={myEmployee?.id || ""}
        onOpenApprovalModal={handleOpenApprovalModal}
        onOpenCancelModal={handleOpenCancelModal}
      />
    </div>
  );
}
