import { useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ProfileHeader } from "./components/profile/ProfileHeader";
import { BasicInfoCard } from "./components/profile/BasicInfoCard";
import { LeaveHistoryCard } from "./components/profile/LeaveHistoryCard";
import { PayrollHistoryCard } from "./components/profile/PayrollHistoryCard";
import { ProfileSidebar } from "./components/profile/ProfileSidebar";
import { useEmployeeProfile } from "./hooks/useEmployeeProfile";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
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
    branches,
    workSites,
    hasBiometricDevice,
    saveChanges,
    uploadAvatar,
  } = useEmployeeProfile(id);

  const handleToggleEditing = useCallback(() => {
    setEditing((prev) => !prev);
  }, [setEditing]);

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
    <div className="p-6 lg:p-10 min-h-screen bg-[#FAFAF8]">
      {/* Header & Avatar */}
      <ProfileHeader
        employee={employee}
        canEdit={canEdit}
        editing={editing}
        hasBiometric={hasBiometricDevice}
        uploadingAvatar={uploadingAvatar}
        onToggleEditing={handleToggleEditing}
        onUploadAvatar={uploadAvatar}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Info, Leave History & Payroll History */}
        <div className="lg:col-span-2 space-y-6">
          <BasicInfoCard
            employee={employee}
            form={form}
            setForm={setForm}
            editing={editing}
            saving={saving}
            manager={manager}
            allEmployees={allEmployees}
            branches={branches}
            workSites={workSites}
            onSave={saveChanges}
          />
          <LeaveHistoryCard leaveRequests={leaveRequests} />
          <PayrollHistoryCard payrollRecords={payrollRecords} />
        </div>

        {/* Right: Sidebar */}
        <ProfileSidebar
          manager={manager}
          reports={reports}
          interviews={interviews}
        />
      </div>
    </div>
  );
}
