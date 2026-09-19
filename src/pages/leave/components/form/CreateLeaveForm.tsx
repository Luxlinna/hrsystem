import React, { memo } from "react";
import type { Employee, LeaveFormData, LeaveTypeBalanceStats } from "../../types";
import { useCreateLeaveFormState } from "./useCreateLeaveFormState";
import { LeaveFormHeader } from "./LeaveFormHeader";
import { LeaveFormEmployeeSection } from "./LeaveFormEmployeeSection";
import { LeaveFormTypeBalances } from "./LeaveFormTypeBalances";
import { LeaveFormDatesSection } from "./LeaveFormDatesSection";
import { LeaveFormApproversSection } from "./LeaveFormApproversSection";
import { LeaveFormAttachmentSection } from "./LeaveFormAttachmentSection";
import { LeaveFormActions } from "./LeaveFormActions";

export interface CreateLeaveFormProps {
  onBack: () => void;
  employees: Employee[];
  myEmployee: Employee | null;
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  submitting: boolean;
  canManage: boolean;
  isSuperAdmin: boolean;
  isBranchAdmin?: boolean;
  isDirectHrApproval?: boolean;
  myApproverName: string;
  hrApprovers?: Employee[];
  getLeaveTypeStats: (empId: string, type: string) => LeaveTypeBalanceStats;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formMode?: "self" | "for_employee";
  isEmbedded?: boolean;
}

export const CreateLeaveForm = memo(function CreateLeaveForm({
  onBack,
  employees,
  myEmployee,
  formData,
  setFormData,
  submitting,
  canManage,
  isSuperAdmin,
  isBranchAdmin = false,
  isDirectHrApproval,
  myApproverName,
  getLeaveTypeStats,
  onSubmit,
  formMode = "self",
  isEmbedded = false,
}: CreateLeaveFormProps) {
  const {
    activeEmpId,
    employeeSearch,
    setEmployeeSearch,
    isEmpDropdownOpen,
    setIsEmpDropdownOpen,
    showDeductionPeriod,
    setShowDeductionPeriod,
    isDragOver,
    setIsDragOver,
    empDropdownRef,
    fileInputRef,
    selectedEmployee,
    lineManager,
    filteredEmployees,
    requestedDays,
    activeTypeCfg,
    currentStats,
    remainingAfterLeave,
    isOverBalance,
    handleSelectSpecialCategory,
    handleSelectMaternityCategory,
    handleApply90DaysMaternity,
    handleFileChange,
    handleFileDrop,
    handleRemoveAttachment,
    handleExportSlip,
  } = useCreateLeaveFormState({
    employees,
    myEmployee,
    formData,
    setFormData,
    isSuperAdmin,
    myApproverName,
    getLeaveTypeStats,
  });

  const isEmployeeSelectorEditable = canManage && formMode !== "self" && employees.length > 1;

  const isDirectApproval = useMemo(() => {
    if (isDirectHrApproval !== undefined) return isDirectHrApproval;
    const target = formMode === "self" ? (myEmployee || selectedEmployee) : selectedEmployee;
    const targetRole = target?.role?.toLowerCase() || "";
    const isTargetAdmin =
      targetRole.includes("super admin") ||
      targetRole.includes("superadmin") ||
      targetRole.includes("branch admin") ||
      targetRole.includes("bu admin") ||
      targetRole.includes("be admin");
    if (formMode === "self") {
      return Boolean(isSuperAdmin || isBranchAdmin || isTargetAdmin);
    }
    return isTargetAdmin;
  }, [isDirectHrApproval, formMode, myEmployee, selectedEmployee, isSuperAdmin, isBranchAdmin]);

  return (
    <div className={isEmbedded ? "w-full space-y-6 font-sans" : "min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 font-sans"}>
      <div className="w-full space-y-6">
        <LeaveFormHeader onBack={onBack} isSuperAdmin={isSuperAdmin} formMode={formMode} />

        <form onSubmit={onSubmit} className="space-y-6">
          <LeaveFormEmployeeSection
            selectedEmployee={selectedEmployee}
            isEmployeeSelectorEditable={isEmployeeSelectorEditable}
            isEmpDropdownOpen={isEmpDropdownOpen}
            setIsEmpDropdownOpen={setIsEmpDropdownOpen}
            empDropdownRef={empDropdownRef}
            employeeSearch={employeeSearch}
            setEmployeeSearch={setEmployeeSearch}
            filteredEmployees={filteredEmployees}
            activeEmpId={activeEmpId}
            onSelectEmployee={(empId) => setFormData((prev) => ({ ...prev, employee_id: empId }))}
          />

          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold text-[#253C7D] uppercase tracking-wider mb-2 flex items-center gap-2">
              <i className="ri-calendar-todo-line text-base" />
              Leave Type Info
            </h2>

            <LeaveFormTypeBalances
              formData={formData}
              setFormData={setFormData}
              activeTypeCfg={activeTypeCfg}
              currentStats={currentStats}
              handleSelectSpecialCategory={handleSelectSpecialCategory}
              handleSelectMaternityCategory={handleSelectMaternityCategory}
              handleApply90DaysMaternity={handleApply90DaysMaternity}
            />

            <LeaveFormDatesSection
              formData={formData}
              setFormData={setFormData}
              requestedDays={requestedDays}
              showDeductionPeriod={showDeductionPeriod}
              setShowDeductionPeriod={setShowDeductionPeriod}
              currentStats={currentStats}
              remainingAfterLeave={remainingAfterLeave}
              isOverBalance={isOverBalance}
            />
          </div>

          <LeaveFormApproversSection
            lineManager={lineManager}
            myApproverName={myApproverName}
            isDirectHrApproval={isDirectApproval}
          />

          <LeaveFormAttachmentSection
            formData={formData}
            activeTypeCfg={activeTypeCfg}
            fileInputRef={fileInputRef}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            handleFileChange={handleFileChange}
            handleFileDrop={handleFileDrop}
            handleRemoveAttachment={handleRemoveAttachment}
          />

          <LeaveFormActions
            submitting={submitting}
            isSuperAdmin={isSuperAdmin}
            formMode={formMode}
            onExportSlip={handleExportSlip}
            onBack={onBack}
          />
        </form>
      </div>
    </div>
  );
});
