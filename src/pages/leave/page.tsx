import { useState, useCallback } from "react";
import { LeaveHeader } from "./components/LeaveHeader";
import { LeaveTabsBar } from "./components/LeaveTabsBar";
import { LeaveStatsRow } from "./components/LeaveStatsRow";
import { LeaveRequestsTabContent } from "./components/requests/LeaveRequestsTabContent";
import { LeaveBalancesTabContent } from "./components/balances/LeaveBalancesTabContent";
import { LeaveCalendarTabContent } from "./components/calendar/LeaveCalendarTabContent";
import { LeaveModalsContainer } from "./components/modals/LeaveModalsContainer";
import { CreateLeaveForm } from "./components/form/CreateLeaveForm";
import { HolidaysModal } from "../attendance/components/holidays/HolidaysModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { LeaveSettingsView } from "./components/settings/LeaveSettingsView";
import { LeaveTypeForm } from "./components/settings/LeaveTypeForm";
import { useLeaveSettings } from "./hooks/useLeaveSettings";
import { useLeave } from "./hooks/useLeave";
import { INITIAL_LEAVE_FORM } from "./constants";

export default function Leave() {
  const l = useLeave();
  const settings = useLeaveSettings();
  const [viewMode, setViewMode] = useState<"hub" | "settings" | "create_type">("hub");
  const [formMode, setFormMode] = useState<"self" | "for_employee">("self");
  const [showHolidaysModal, setShowHolidaysModal] = useState(false);

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
    setFormMode("for_employee");
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
      <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
        <LeaveHeader onLeaveTodayCount={0} filteredRequests={[]} onRequestLeave={() => {}} />
        <PartnerBranchPrivacyShield moduleName="Leave Management" userBranchName={l.userBranchName} hasNoBranch={!l.userBranchId} />
      </div>
    );
  }

  if (l.showForm) {
    const isSuperAdmin =
      l.actorRole?.toLowerCase().includes("super admin") ||
      l.actorRole?.toLowerCase().includes("superadmin");

    return (
      <CreateLeaveForm
        onBack={() => {
          l.setShowForm(false);
          l.setFormData(INITIAL_LEAVE_FORM);
        }}
        employees={l.employees}
        myEmployee={l.myEmployee}
        formData={l.formData}
        setFormData={l.setFormData}
        submitting={l.submitting}
        canManage={l.canManage}
        isSuperAdmin={isSuperAdmin}
        isBranchAdmin={l.isBranchAdmin}
        isDirectHrApproval={formMode === "self" ? (isSuperAdmin || l.isBranchAdmin) : undefined}
        myApproverName={l.myApproverName}
        hrApprovers={l.hrApprovers}
        getLeaveTypeStats={l.getLeaveTypeStats}
        onSubmit={l.handleSubmitRequest}
        formMode={formMode}
      />
    );
  }

  const canModifyLeaveSettings = l.isSuperAdmin || l.isBranchAdmin || l.isAdmin;

  if (viewMode === "create_type") {
    if (!canModifyLeaveSettings) {
      return (
        <div className="min-h-screen bg-slate-50/60 p-6 font-sans">
          <div className="p-6 bg-white border border-gray-200 rounded-2xl max-w-md mx-auto text-center space-y-3">
            <i className="ri-shield-keyhole-line text-3xl text-rose-500" />
            <h3 className="text-base font-bold text-gray-900">Permission Denied</h3>
            <p className="text-xs text-gray-500">Only BU Admin and Super Admin have permission to create or modify leave types.</p>
            <button
              onClick={() => setViewMode("hub")}
              className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl"
            >
              Back to Leave Hub
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
        <LeaveTypeForm
          initialData={settings.editingType}
          onSave={async (data) => {
            const success = await settings.handleSave(data);
            if (success) setViewMode("settings");
            return success;
          }}
          onBack={() => {
            settings.setEditingType(null);
            setViewMode("settings");
          }}
          saving={settings.saving}
        />
      </div>
    );
  }

  if (viewMode === "settings") {
    return (
      <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
        {settings.toast && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-extrabold flex items-center gap-2 ${
              settings.toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <span>{settings.toast.message}</span>
          </div>
        )}
        <LeaveSettingsView
          leaveTypes={settings.leaveTypes}
          loading={settings.loading}
          searchQuery={settings.searchQuery}
          setSearchQuery={settings.setSearchQuery}
          canModify={canModifyLeaveSettings}
          onCreateNew={() => {
            settings.setEditingType(null);
            setViewMode("create_type");
          }}
          onEdit={(type) => {
            settings.setEditingType(type);
            setViewMode("create_type");
          }}
          onDelete={settings.handleDelete}
          onToggleActive={settings.handleToggleActive}
          onBack={() => setViewMode("hub")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
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
        filteredRequests={l.filteredRequests}
        onToast={l.setToast}
        canManage={l.canManage}
        onOpenHolidaysModal={() => setShowHolidaysModal(true)}
        holidayCount={l.holidays?.length || 0}
        canManageSettings={canModifyLeaveSettings}
        onOpenLeaveSettings={() => setViewMode("settings")}
        onRequestLeave={() => {
          setFormMode("self");
          l.setFormData({ ...INITIAL_LEAVE_FORM, employee_id: l.myEmployee?.id || "" });
          l.setShowForm(true);
        }}
        onRequestLeaveFor={() => {
          setFormMode("for_employee");
          l.setFormData({ ...INITIAL_LEAVE_FORM, employee_id: "" });
          l.setShowForm(true);
        }}
      />

      <LeaveStatsRow stats={l.stats} onSelectTab={l.setActiveTab} onFilterStatus={l.setStatusFilter} />

      <LeaveTabsBar
        activeTab={l.activeTab}
        setActiveTab={l.setActiveTab}
        pendingCount={l.stats.pending}
        onLeaveTodayCount={l.stats.onLeaveToday}
        onOpenHolidaysModal={() => setShowHolidaysModal(true)}
        holidayCount={l.holidays?.length || 0}
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
          myDepartment={l.myEmployee?.department || ""}
          actorRole={l.actorRole}
          isSuperAdmin={l.isSuperAdmin}
          isBranchAdmin={l.isBranchAdmin}
          hasRoleApprovalAccess={!!l.role?.leave_approve || !!l.role?.is_admin}
          hasManagerEndorseAccess={!!l.role?.leave_manager_endorse}
          hasBuAdminEndorseAccess={!!l.role?.leave_bu_admin_endorse}
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
          selectedDayHoliday={l.selectedDayHoliday}
          onInspectRequest={l.setInspectRequest}
          onOpenHolidaysModal={() => setShowHolidaysModal(true)}
          holidayCount={l.holidays?.length || 0}
        />
      )}

      <LeaveModalsContainer
        {...l}
        onOpenApprovalModal={handleOpenApprovalModal}
        onOpenCancelModal={handleOpenCancelModal}
      />

      <HolidaysModal
        isOpen={showHolidaysModal}
        onClose={() => setShowHolidaysModal(false)}
        year={l.holidaysState.year}
        setYear={l.holidaysState.setYear}
        holidays={l.holidaysState.holidays}
        loading={l.holidaysState.loading}
        syncing={l.holidaysState.syncing}
        onSync={l.holidaysState.syncYear}
        onAddHoliday={l.holidaysState.addHoliday}
        onDeleteHoliday={l.holidaysState.removeHoliday}
        canManage={l.canManage}
      />
    </div>
  );
}
