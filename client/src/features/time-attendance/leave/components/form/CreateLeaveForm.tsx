import React, { memo, useMemo, useState } from "react";
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
  hrApprovers = [],
  getLeaveTypeStats,
  onSubmit,
  formMode = "self",
  isEmbedded = false,
}: CreateLeaveFormProps) {
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);

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
    supervisorName,
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

  const isEmployeeSelectorEditable = canManage || isSuperAdmin || formMode !== "self" || employees.length > 1;

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
    <div className={isEmbedded ? "w-full font-sans pb-6" : "min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-2 sm:p-5 font-sans"}>
      <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-6 shadow-xs overflow-hidden">
        {/* Header with Back and Title — On mobile step 2, back button goes back to step 1 */}
        <LeaveFormHeader
          onBack={mobileStep === 2 ? () => { setMobileStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); } : onBack}
          isSuperAdmin={isSuperAdmin}
          formMode={formMode}
        />

        <form onSubmit={onSubmit} className="space-y-2.5 pt-0.5">
          {/* Step 1: Employee Info & Entitlement — Always visible on desktop, on mobile visible when mobileStep === 1 */}
          <div className={`space-y-2.5 ${mobileStep === 1 ? "block" : "hidden md:block"}`}>
            {/* Section 1: Employee Info */}
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
              supervisorName={supervisorName}
            />

            {/* Section 2: Entitlement Cards */}
            <LeaveFormTypeBalances
              currentStats={currentStats}
            />

            {/* Mobile Step 1 Actions: Cancel & Next (Phone 1 Mockup) */}
            <div className="md:hidden pt-1.5 flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow-2xs hover:bg-slate-50 text-center transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex-1 py-2 bg-[#253C7D] hover:bg-[#1e3064] active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#253C7D]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <i className="ri-send-plane-fill text-xs" />
                <span>Next</span>
              </button>
            </div>
          </div>

          {/* Step 2: Leave Details, Attachment, Approvers — Always visible on desktop, on mobile visible when mobileStep === 2 */}
          <div className={`space-y-2.5 ${mobileStep === 2 ? "block" : "hidden md:block"}`}>
            {/* Section 3: Leave Form Fields (Leave Type, Dates, Reason, Remark, Show deduction period) */}
            <LeaveFormDatesSection
              formData={formData}
              setFormData={setFormData}
              requestedDays={requestedDays}
              showDeductionPeriod={showDeductionPeriod}
              setShowDeductionPeriod={setShowDeductionPeriod}
              currentStats={currentStats}
              remainingAfterLeave={remainingAfterLeave}
              isOverBalance={isOverBalance}
              handleSelectSpecialCategory={handleSelectSpecialCategory}
              handleSelectMaternityCategory={handleSelectMaternityCategory}
              handleApply90DaysMaternity={handleApply90DaysMaternity}
            />

            {/* Section 4: Attachment Info */}
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

            {/* Section 5: Approvers Info */}
            <LeaveFormApproversSection
              lineManager={lineManager}
              myApproverName={myApproverName}
              hrApprovers={hrApprovers}
              selectedEmployee={selectedEmployee}
              isDirectHrApproval={isDirectApproval}
            />

            {/* Mobile Step 2 Actions: Cancel & Submit (Phone 2 Mockup) */}
            <div className="md:hidden pt-1.5 flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setMobileStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow-2xs hover:bg-slate-50 text-center transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-[1.4] py-2 bg-[#253C7D] hover:bg-[#1e3064] active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm shadow-[#253C7D]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <i className="ri-send-plane-fill text-xs" />
                <span className="truncate">{submitting ? "Submitting..." : "Submit Leave Request"}</span>
              </button>
            </div>
          </div>

          {/* Desktop Actions: Submit & Cancel (Hidden on Mobile) */}
          <div className="hidden md:block">
            <LeaveFormActions
              submitting={submitting}
              isSuperAdmin={isSuperAdmin}
              formMode={formMode}
              onExportSlip={handleExportSlip}
              onBack={onBack}
            />
          </div>
        </form>
      </div>
    </div>
  );
});
