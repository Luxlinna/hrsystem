import { useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ProfileHeader } from "./components/profile/ProfileHeader";
import { BasicInfoCard } from "./components/profile/BasicInfoCard";
import { EmployeeDocumentsCard } from "./components/profile/EmployeeDocumentsCard";
import { LeaveHistoryCard } from "./components/profile/LeaveHistoryCard";
import { PayrollHistoryCard } from "./components/profile/PayrollHistoryCard";
import { ProfileSidebar } from "./components/profile/ProfileSidebar";
import { EmployeeOverviewTabs, OverviewTabKey } from "./components/overview/EmployeeOverviewTabs";
import { EmployeeQuickSearchHeader } from "./components/overview/EmployeeQuickSearchHeader";
import { MovementInfoCard } from "./components/overview/MovementInfoCard";
import { WarningInfoCard } from "./components/overview/WarningInfoCard";
import { NssfInfoCard } from "./components/overview/NssfInfoCard";
import { ComplaintSuggestionCard } from "./components/overview/ComplaintSuggestionCard";
import { TrainingInfoCard } from "./components/overview/TrainingInfoCard";
import { AssetInfoCard } from "./components/overview/AssetInfoCard";
import { QuickEditManagerModal } from "./components/profile/QuickEditManagerModal";
import { useEmployeeProfile } from "./hooks/useEmployeeProfile";
import { filterBuManagers } from "./hooks/employeeProfileLoader";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<OverviewTabKey>("info");
  const [counts, setCounts] = useState<Partial<Record<OverviewTabKey, number>>>({});
  const [showManagerModal, setShowManagerModal] = useState(false);

  const {
    canEdit,
    employee,
    loading,
    editing,
    setEditing,
    saving,
    uploadingAvatar,
    manager,
    reports,
    interviews,
    leaveRequests,
    payrollRecords,
    form,
    setForm,
    allEmployees,
    userManagementUsers,
    managersList,
    branches,
    workSites,
    hasBiometricDevice,
    loadEmployee,
    saveChanges,
    uploadAvatar,
  } = useEmployeeProfile(id);

  // Dynamically filter User Management users belonging to this employee's effective BU only
  const dynamicBuManagers = useMemo(() => {
    const effectiveBranchId = form.branch_id || employee?.branch_id;
    const effectiveBuName = form.bu_full_name || employee?.bu_full_name || employee?.branches?.name;
    const effectiveCodeBu = form.code_bu || employee?.code_bu;

    return filterBuManagers(
      userManagementUsers,
      employee?.id,
      effectiveBranchId,
      effectiveBuName,
      effectiveCodeBu
    );
  }, [form.branch_id, form.bu_full_name, form.code_bu, employee, userManagementUsers]);

  const handleToggleEditing = useCallback(() => {
    if (!editing) {
      setActiveTab("info");
    } else if (employee) {
      setForm(employee);
    }
    setEditing((prev) => !prev);
  }, [editing, employee, setForm, setEditing]);

  const updateCount = useCallback((key: OverviewTabKey, count: number) => {
    setCounts((prev) => (prev[key] === count ? prev : { ...prev, [key]: count }));
  }, []);

  const handleWarningCount = useCallback((c: number) => updateCount("warning", c), [updateCount]);
  const handleComplaintsCount = useCallback((c: number) => updateCount("complaints", c), [updateCount]);
  const handleTrainingCount = useCallback((c: number) => updateCount("training", c), [updateCount]);
  const handleAssetsCount = useCallback((c: number) => updateCount("assets", c), [updateCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-10 text-center">
        <i className="ri-user-search-line text-4xl text-gray-300 mb-3 block" />
        <p className="text-gray-500">Employee not found</p>
        <Link to="/employees" className="text-[13px] text-[#253C7D] hover:underline mt-2 inline-block">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#FAFAF8] font-sans">
      {/* Search by Staff ID or Name Header */}
      <EmployeeQuickSearchHeader currentEmployee={employee} allEmployees={allEmployees} />

      {/* Profile Header & Summary */}
      <ProfileHeader
        employee={employee}
        canEdit={canEdit}
        editing={editing}
        hasBiometric={hasBiometricDevice}
        uploadingAvatar={uploadingAvatar}
        onToggleEditing={handleToggleEditing}
        onUploadAvatar={uploadAvatar}
      />

      {/* 8-Column Navigation Tabs */}
      <EmployeeOverviewTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        counts={{
          ...counts,
          payroll: payrollRecords?.length,
        }}
      />

      {/* Tab Content Display */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BasicInfoCard
              employee={employee}
              form={form}
              setForm={setForm}
              editing={editing}
              saving={saving}
              manager={manager}
              allEmployees={dynamicBuManagers}
              branches={branches}
              workSites={workSites}
              onSave={saveChanges}
            />
            <EmployeeDocumentsCard employee={employee} />
            <LeaveHistoryCard leaveRequests={leaveRequests} />
          </div>
          <ProfileSidebar
            manager={manager}
            reports={reports}
            interviews={interviews}
            canEdit={canEdit}
            onEditManager={() => setShowManagerModal(true)}
          />
        </div>
      )}

      {activeTab === "movement" && <MovementInfoCard employee={employee} />}
      {activeTab === "warning" && (
        <WarningInfoCard employee={employee} onCountLoaded={handleWarningCount} />
      )}
      {activeTab === "nssf" && <NssfInfoCard employee={employee} />}
      {activeTab === "complaints" && (
        <ComplaintSuggestionCard employee={employee} onCountLoaded={handleComplaintsCount} />
      )}
      {activeTab === "training" && (
        <TrainingInfoCard employee={employee} onCountLoaded={handleTrainingCount} />
      )}
      {activeTab === "assets" && (
        <AssetInfoCard employee={employee} onCountLoaded={handleAssetsCount} />
      )}
      {activeTab === "payroll" && (
        <div className="max-w-5xl">
          <PayrollHistoryCard employee={employee} payrollRecords={payrollRecords} />
        </div>
      )}

      {employee && (
        <QuickEditManagerModal
          isOpen={showManagerModal}
          onClose={() => setShowManagerModal(false)}
          employee={employee}
          manager={manager}
          allEmployees={dynamicBuManagers}
          onSuccess={() => id && loadEmployee(id)}
        />
      )}
    </div>
  );
}
