import React from "react";
import { createPortal } from "react-dom";
import type { CreateChangeStatusModalProps } from "./change-status/types";
import { useChangeStatusForm } from "./change-status/useChangeStatusForm";
import { ChangeStatusEmployeeSection } from "./change-status/ChangeStatusEmployeeSection";
import { ChangeStatusInfoSection } from "./change-status/ChangeStatusInfoSection";
import { ChangeStatusAttachmentSection } from "./change-status/ChangeStatusAttachmentSection";

export const CreateChangeStatusModal: React.FC<CreateChangeStatusModalProps> = ({
  isOpen,
  onClose,
  employees,
  branches = [],
  divisions = [],
  departments = [],
  positions = [],
  preselectedEmployeeId,
  onSuccess,
}) => {
  const form = useChangeStatusForm({
    isOpen,
    employees,
    branches,
    divisions,
    preselectedEmployeeId,
    onSuccess,
    onClose,
  });

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto text-xs">
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <h2 className="text-base font-normal text-slate-800 dark:text-slate-100 tracking-tight">
            Create Change Status
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700"
          >
            <i className="ri-arrow-left-line text-xs" />
            <span>Back</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={form.handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {form.errorMsg && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md flex items-center gap-2">
              <i className="ri-error-warning-line text-base shrink-0" />
              <span>{form.errorMsg}</span>
            </div>
          )}

          <ChangeStatusEmployeeSection
            empSearchQuery={form.empSearchQuery}
            setEmpSearchQuery={form.setEmpSearchQuery}
            isEmpDropdownOpen={form.isEmpDropdownOpen}
            setIsEmpDropdownOpen={form.setIsEmpDropdownOpen}
            empDropdownRef={form.empDropdownRef}
            filteredEmployees={form.filteredEmployees}
            selectedEmpId={form.selectedEmpId}
            onSelectEmployee={(emp) => {
              form.setSelectedEmpId(emp.id);
              form.setEmpSearchQuery(`${emp.first_name} ${emp.last_name}`);
              form.setIsEmpDropdownOpen(false);
            }}
          />

          <div className="border-t border-slate-100 dark:border-slate-800" />

          <ChangeStatusInfoSection
            statusType={form.statusType}
            setStatusType={form.setStatusType}
            effectiveDate={form.effectiveDate}
            setEffectiveDate={form.setEffectiveDate}
            bu={form.bu}
            setBu={form.setBu}
            site={form.site}
            setSite={form.setSite}
            division={form.division}
            setDivision={form.setDivision}
            department={form.department}
            setDepartment={form.setDepartment}
            position={form.position}
            setPosition={form.setPosition}
            designation={form.designation}
            setDesignation={form.setDesignation}
            employeeType={form.employeeType}
            setEmployeeType={form.setEmployeeType}
            supervisor={form.supervisor}
            setSupervisor={form.setSupervisor}
            isSupervisorDropdownOpen={form.isSupervisorDropdownOpen}
            setIsSupervisorDropdownOpen={form.setIsSupervisorDropdownOpen}
            supervisorDropdownRef={form.supervisorDropdownRef}
            salaryType={form.salaryType}
            setSalaryType={form.setSalaryType}
            salary={form.salary}
            setSalary={form.setSalary}
            remark={form.remark}
            setRemark={form.setRemark}
            buOptions={form.allBuOptions}
            siteOptions={form.siteOptions}
            divisions={form.allDivisionOptions}
            departments={departments}
            positions={positions}
            supervisorOptions={form.supervisorOptions}
            onReloadBranches={form.reloadBranches}
            onReloadSites={form.reloadWorkLocations}
          />

          <div className="border-t border-slate-100 dark:border-slate-800" />

          <ChangeStatusAttachmentSection
            attachmentFile={form.attachmentFile}
            setAttachmentFile={form.setAttachmentFile}
          />

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              type="submit"
              disabled={form.submitting || !form.selectedEmployee}
              className="px-4 py-1.5 rounded bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {form.submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-xs" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="ri-save-line text-xs" />
                  <span>Save</span>
                  <i className="ri-arrow-down-s-line text-[10px] text-slate-300" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={form.submitting}
              className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <i className="ri-close-line text-xs" />
              <span>Discard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
