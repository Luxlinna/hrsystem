import React, { memo, useMemo } from "react";
import type { Employee, LeaveFormData, LeaveTypeBalanceStats } from "../../types";
import { useCreateLeaveFormState } from "./useCreateLeaveFormState";
import { LeaveFormHeader } from "./LeaveFormHeader";
import { LeaveFormEmployeeSection } from "./LeaveFormEmployeeSection";
import { LeaveFormTypeBalances } from "./LeaveFormTypeBalances";
import { LeaveFormDatesSection } from "./LeaveFormDatesSection";
import { LeaveFormApproversSection } from "./LeaveFormApproversSection";
import { LeaveFormAttachmentSection } from "./LeaveFormAttachmentSection";
import { LeaveFormActions } from "./LeaveFormActions";
import { getApplicantTier } from "../../utils/leaveApprovalChain";

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

  const applicantTier = useMemo(() => {
    const target = formMode === "self" ? (myEmployee || selectedEmployee) : selectedEmployee;
    return getApplicantTier(target, isDirectApproval);
  }, [formMode, myEmployee, selectedEmployee, isDirectApproval]);

  return (
    <div className={isEmbedded ? "w-full space-y-3 font-sans pb-10 sm:pb-0" : "min-h-screen bg-[#f0f4f9] dark:bg-slate-950 p-3 sm:p-5 lg:p-7 pb-24 sm:pb-8 font-sans"}>
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-3.5">
        {/* Header with Back and Title */}
        <LeaveFormHeader onBack={onBack} isSuperAdmin={isSuperAdmin} formMode={formMode} />

        <form onSubmit={onSubmit} className="space-y-3 sm:space-y-3.5">
          {/* Card 1: Main Form Grid (Employee, Leave Type, Dates, Reason) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-3.5 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Left Column: Employee & Leave Type Info */}
              <div className="space-y-3">
                {isEmployeeSelectorEditable && (
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
                )}

                <LeaveFormTypeBalances
                  formData={formData}
                  setFormData={setFormData}
                  activeTypeCfg={activeTypeCfg}
                  currentStats={currentStats}
                  handleSelectSpecialCategory={handleSelectSpecialCategory}
                  handleSelectMaternityCategory={handleSelectMaternityCategory}
                  handleApply90DaysMaternity={handleApply90DaysMaternity}
                />
              </div>

              {/* Right Column: Dates, Reason, Deduction Toggle */}
              <div className="md:border-l md:border-slate-100 dark:md:border-slate-800 md:pl-5 space-y-3">
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
            </div>
          </div>

          {/* Card 2: Approval Workflow Chain */}
          <LeaveFormApproversSection
            lineManager={lineManager}
            myApproverName={myApproverName}
            isDirectHrApproval={isDirectApproval}
            applicantTier={applicantTier}
          />

          {/* Card 3: Attachment Section */}
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

          {/* Submit Button */}
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
