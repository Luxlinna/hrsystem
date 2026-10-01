import { memo, useState, useCallback, useEffect } from "react";
import type { Branch, Employee, EmployeeFormState } from "../types";
import { useBranchScope } from "@/context/BranchContext";
import { useSidebar } from "@/components/layout/SidebarContext";
import { ADD_EMPLOYEE_STEPS, type AddEmployeeStepId } from "./add-employee/types";
import { useAddEmployeeModalData } from "./add-employee/useAddEmployeeModalData";
import { useAddEmployeeAutoSave } from "./add-employee/useAddEmployeeAutoSave";
import { useAddEmployeeBranchSync } from "./add-employee/useAddEmployeeBranchSync";
import { PersonalPhotoCard } from "./add-employee/personal/PersonalPhotoCard";
import { AddEmployeeHeader } from "./add-employee/AddEmployeeHeader";
import { AddEmployeeNavTabs } from "./add-employee/AddEmployeeNavTabs";
import { AddEmployeeTabRouter } from "./add-employee/AddEmployeeTabRouter";
import { AddEmployeeFormFooter } from "./add-employee/AddEmployeeFormFooter";

interface AddEmployeeModalProps {
  isOpen: boolean;
  isEdit?: boolean;
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
  isEdit = false,
  form,
  setForm,
  submitting,
  isSuperAdmin = true,
  onClose,
  onSubmit,
}: AddEmployeeModalProps) {
  const { targetBranch, userBranchId } = useBranchScope();
  const { collapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState<AddEmployeeStepId>("personal");
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveStatus,
    lastSavedAt,
    availableDraft,
    restoreDraft,
    clearDraft,
    markDirty,
  } = useAddEmployeeAutoSave(isOpen, isEdit, form, setForm);

  const {
    cleanBranches,
    currentBranch,
    currentBranchName,
    workSites,
    currentSiteSelectValue,
    divisions,
    departments,
    positions,
    employeeTypes,
    contractTypes,
    getBranchCode,
    deriveBuHandle,
    buManagers,
    buCeos,
  } = useAddEmployeeModalData(isOpen, form);

  const { handleSelectBranch, handleSelectSite } = useAddEmployeeBranchSync({
    isOpen,
    isSuperAdmin,
    targetBranch,
    userBranchId,
    form,
    setForm,
    cleanBranches,
    workSites,
    currentBranch,
    getBranchCode,
    deriveBuHandle,
    onFieldTouch: markDirty,
  });

  const handleFieldChange = useCallback(
    (field: keyof EmployeeFormState, value: any) => {
      markDirty();
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [markDirty, setForm]
  );

  const handleClearDraft = useCallback(() => {
    clearDraft();
    setForm((prev) => ({
      ...prev,
      full_name: "",
      first_name: "",
      last_name: "",
      khmer_name: "",
      email: "",
      phone: "",
      work_email: "",
      personal_email: "",
      home_phone: "",
      current_address: "",
      permanent_address: "",
      emergency_contact_name: "",
      emergency_contact_relationship: "",
      emergency_contact_phone: "",
      national_id: "",
      passport_number: "",
      id_card_number: "",
      photo_url: null,
    }));
  }, [clearDraft, setForm]);

  const handleStepClick = (stepId: AddEmployeeStepId) => {
    const currentIdx = ADD_EMPLOYEE_STEPS.findIndex((s) => s.id === activeTab);
    const targetIdx = ADD_EMPLOYEE_STEPS.findIndex((s) => s.id === stepId);
    setSlideDirection(targetIdx >= currentIdx ? "next" : "prev");
    setActiveTab(stepId);
  };

  if (!isOpen) return null;

  const leftOffset = isMobile ? 0 : (collapsed ? 64 : 260);

  return (
    <div
      className="fixed top-0 bottom-0 right-0 z-40 flex flex-col bg-white overflow-hidden animate-fullscreen-cover transition-[left] duration-300 ease-in-out border-l border-slate-200"
      style={{ left: leftOffset }}
    >
      {/* Top Header */}
      <AddEmployeeHeader
        isEdit={isEdit}
        onClose={onClose}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={setAutoSaveEnabled}
        autoSaveStatus={autoSaveStatus}
        lastSavedAt={lastSavedAt}
        onClearDraft={handleClearDraft}
      />

      {/* Main 2-Column Content Body */}
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto bg-white p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start max-w-7xl mx-auto w-full">
          {/* Left Column: Persistent Avatar & Image Actions */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col items-center lg:sticky lg:top-4">
            <PersonalPhotoCard form={form} onChange={handleFieldChange} />
          </div>

          {/* Right Column: Tab Bar + Active Section + Form Actions */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {/* Draft Restore Notification Banner */}
            {availableDraft && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-amber-900">
                  <i className="ri-draft-line text-base text-amber-600 shrink-0" />
                  <span>
                    Found an unsaved draft
                    {availableDraft.full_name || availableDraft.first_name
                      ? ` for "${availableDraft.full_name || availableDraft.first_name}"`
                      : ""}
                    . Would you like to restore it?
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={restoreDraft}
                    className="px-3 py-1 bg-[#253C7D] hover:bg-[#1E3064] text-white font-medium rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    Restore Draft
                  </button>
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            <AddEmployeeNavTabs activeTab={activeTab} onSelectTab={handleStepClick} />

            {/* Tab Content with Smooth Slide Wipe */}
            <div
              key={activeTab}
              className={`w-full ${
                slideDirection === "next" ? "animate-cover-next" : "animate-cover-prev"
              }`}
            >
              <AddEmployeeTabRouter
                activeTab={activeTab}
                form={form}
                onChange={handleFieldChange}
                cleanBranches={cleanBranches}
                currentBranch={currentBranch}
                currentBranchName={currentBranchName}
                workSites={workSites}
                currentSiteSelectValue={currentSiteSelectValue}
                onSelectBranch={handleSelectBranch}
                onSelectSite={handleSelectSite}
                buManagers={buManagers}
                buCeos={buCeos}
                divisions={divisions}
                departments={departments}
                positions={positions}
                employeeTypes={employeeTypes}
                contractTypes={contractTypes}
              />
            </div>

            <AddEmployeeFormFooter
              submitting={submitting}
              onClose={onClose}
              lastSavedAt={lastSavedAt}
              onClearDraft={handleClearDraft}
              isEdit={isEdit}
            />
          </div>
        </div>
      </form>
    </div>
  );
});
