import { memo, useState, useEffect, useMemo, useCallback } from "react";
import type { Branch, Employee, EmployeeFormState } from "../types";
import { useBranchScope } from "@/context/BranchContext";
import { ADD_EMPLOYEE_STEPS, type AddEmployeeStepId } from "./add-employee/types";
import { useAddEmployeeModalData } from "./add-employee/useAddEmployeeModalData";
import { AddEmployeePersonalTab } from "./add-employee/AddEmployeePersonalTab";
import { AddEmployeeOrgTab } from "./add-employee/AddEmployeeOrgTab";
import { AddEmployeeTermsTab } from "./add-employee/AddEmployeeTermsTab";
import { AddEmployeeCompTab } from "./add-employee/AddEmployeeCompTab";
import { AddEmployeeContactTab } from "./add-employee/AddEmployeeContactTab";
import { AddEmployeeExportMenu } from "./add-employee/AddEmployeeExportMenu";

interface AddEmployeeModalProps {
  isOpen: boolean;
  form: EmployeeFormState;
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>;
  branches: Branch[];
  managers: Employee[];
  submitting: boolean;
  isSuperAdmin?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddEmployeeModal = memo(function AddEmployeeModal({
  isOpen,
  form,
  setForm,
  submitting,
  isSuperAdmin = true,
  onClose,
  onSubmit,
}: AddEmployeeModalProps) {
  const { visibleBranches, targetBranch, userBranchId } = useBranchScope();
  const [activeTab, setActiveTab] = useState<AddEmployeeStepId>("personal");

  const {
    cleanBranches,
    currentBranch,
    currentBranchName,
    workSites,
    currentSiteSelectValue,
    getBranchCode,
    buManagers,
    buCeos,
  } = useAddEmployeeModalData(isOpen, form);

  // Auto-fill default branch if scoped
  useEffect(() => {
    if (isOpen && !isSuperAdmin) {
      const defaultBranch = targetBranch || userBranchId || "";
      if (defaultBranch && form.branch_id !== defaultBranch) {
        setForm((prev) => ({ ...prev, branch_id: defaultBranch }));
      }
    }
  }, [isOpen, isSuperAdmin, targetBranch, userBranchId, form.branch_id, setForm]);

  // Handle branch selection and auto-derive BU code, full name, and handle
  const handleSelectBranch = useCallback(
    (branchId: string) => {
      const branch = cleanBranches.find((b) => b.id === branchId);
      if (branch) {
        const code = getBranchCode(branch.name);
        setForm((prev) => ({
          ...prev,
          branch_id: branch.id,
          code_bu: code,
          bu_full_name: branch.name,
          handle_bu: `@${code.toLowerCase()}`,
          site: "Headquarters",
          working_location: branch.location || "Phnom Penh",
          default_work_location_id: "",
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          branch_id: branchId,
        }));
      }
    },
    [cleanBranches, getBranchCode, setForm]
  );

  // Handle site selection and auto-derive location
  const handleSelectSite = useCallback(
    (siteIdOrVal: string) => {
      if (!siteIdOrVal) {
        setForm((prev) => ({
          ...prev,
          default_work_location_id: "",
          site: "Headquarters",
          working_location: currentBranch?.location || "Phnom Penh",
        }));
        return;
      }

      const targetSite = workSites.find((w) => w.id === siteIdOrVal);
      if (targetSite) {
        let loc = targetSite.description || targetSite.name;
        const lower = targetSite.name.toLowerCase();
        if (lower.includes("kampong thom") || lower.includes("kampongthom")) loc = "Kampong Thom";
        else if (lower.includes("battambang") || lower.includes("btb")) loc = "Battambang";
        else if (lower.includes("siem reap")) loc = "Siem Reap";
        else if (lower.includes("poipet")) loc = "Poipet";

        setForm((prev) => ({
          ...prev,
          default_work_location_id: targetSite.id,
          site: targetSite.name,
          working_location: loc,
        }));
      }
    },
    [workSites, currentBranch, setForm]
  );

  const handleFieldChange = useCallback(
    (field: keyof EmployeeFormState, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [setForm]
  );

  const currentStepIndex = ADD_EMPLOYEE_STEPS.findIndex((s) => s.id === activeTab);

  // Calculate filled count across standard 33 fields
  const filledCount = useMemo(() => {
    const fieldsToCheck: (keyof EmployeeFormState)[] = [
      "employee_code",
      "full_name",
      "kh_name",
      "gender",
      "code_bu",
      "bu_full_name",
      "handle_bu",
      "division",
      "department",
      "position",
      "working_hour",
      "total_working_days",
      "employment_type",
      "start_date",
      "working_location",
      "national_id_number",
      "date_of_birth",
      "current_address",
      "basic_salary",
      "tax_method",
      "allowance",
      "line_manager",
      "contract_type",
      "fdc_end_date",
      "site",
      "bank_account_number",
      "nssf_number",
      "email",
      "phone",
      "emergency_contact_name",
      "emergency_phone_number",
      "hiring_status",
      "marital_status",
    ];

    let count = 0;
    for (const f of fieldsToCheck) {
      const val = form[f];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        count++;
      }
    }
    return count;
  }, [form]);

  const goToNextStep = () => {
    if (currentStepIndex < ADD_EMPLOYEE_STEPS.length - 1) {
      setActiveTab(ADD_EMPLOYEE_STEPS[currentStepIndex + 1].id);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveTab(ADD_EMPLOYEE_STEPS[currentStepIndex - 1].id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center shadow-md shadow-[#253C7D]/20 shrink-0">
                <i className="ri-user-add-line text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Add Employee &mdash; Hiring Information
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20">
                    33 Standard Fields
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Full hiring dossier &bull; S3 document upload &bull; One-click PDF/Word export
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Progress counter badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                <i className="ri-checkbox-circle-fill text-emerald-600 text-sm" />
                <span>{filledCount} / 33 Filled</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Close"
              >
                <i className="ri-close-line text-2xl" />
              </button>
            </div>
          </div>

          {/* 5 Step Wizard Tabs */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-4 pt-3 border-t border-slate-100 overflow-x-auto">
            {ADD_EMPLOYEE_STEPS.map((step, idx) => {
              const isActive = step.id === activeTab;
              const isPast = idx < currentStepIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveTab(step.id)}
                  className={`flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-2 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#253C7D] text-white shadow-sm font-bold"
                      : isPast
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isPast
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isPast ? <i className="ri-check-line font-bold" /> : <i className={step.icon} />}
                  </div>
                  <div className="min-w-0 text-center sm:text-left">
                    <p className="text-[11px] leading-tight truncate">{step.shortLabel}</p>
                    <p
                      className={`text-[9px] hidden sm:block ${
                        isActive ? "text-blue-200" : "text-slate-400"
                      }`}
                    >
                      Step {step.step}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Active Tab */}
        <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {activeTab === "personal" && (
              <AddEmployeePersonalTab form={form} onChange={handleFieldChange} />
            )}

            {activeTab === "org" && (
              <AddEmployeeOrgTab
                form={form}
                onChange={handleFieldChange}
                cleanBranches={cleanBranches}
                currentBranch={currentBranch}
                currentBranchName={currentBranchName}
                workSites={workSites}
                currentSiteSelectValue={currentSiteSelectValue}
                onSelectBranch={handleSelectBranch}
                onSelectSite={handleSelectSite}
              />
            )}

            {activeTab === "terms" && (
              <AddEmployeeTermsTab
                form={form}
                onChange={handleFieldChange}
                buManagers={buManagers}
                buCeos={buCeos}
              />
            )}

            {activeTab === "compensation" && (
              <AddEmployeeCompTab form={form} onChange={handleFieldChange} />
            )}

            {activeTab === "contact" && (
              <AddEmployeeContactTab form={form} onChange={handleFieldChange} />
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 ? (
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <i className="ri-arrow-left-s-line text-sm" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {/* Function Export (PDF / Word) directly from modal */}
              <AddEmployeeExportMenu form={form} />
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              {currentStepIndex < ADD_EMPLOYEE_STEPS.length - 1 && (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Next Step</span>
                  <i className="ri-arrow-right-s-line text-sm" />
                </button>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-[#253C7D]/25 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    <span>Saving Employee...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-check-line text-sm" />
                    <span>Add Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
