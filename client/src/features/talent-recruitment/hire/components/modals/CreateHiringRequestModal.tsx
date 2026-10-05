import { memo, useState, useEffect } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { CreateHiringRequestFields } from "./CreateHiringRequestFields";
import { useHiringRequestAutoSave } from "../../hooks/useHiringRequestAutoSave";
import { toast } from "@/components/Toast";

interface CreateHiringRequestModalProps {
  isOpen: boolean;
  editingRequest?: any | null;
  onClose: () => void;
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  branches: Branch[];
  departments: string[];
  employees?: SearchableEmployee[];
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  userBranchId?: string | null;
  userBranchName?: string | null;
  targetBranch?: string | null;
}

export const CreateHiringRequestModal = memo(function CreateHiringRequestModal({
  isOpen,
  editingRequest,
  onClose,
  form,
  setForm,
  branches,
  departments,
  employees = [],
  submitting,
  onSubmit,
  isSuperAdmin = true,
  isBranchAdmin = false,
  userBranchId,
  userBranchName,
  targetBranch,
}: CreateHiringRequestModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const {
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveStatus,
    lastSavedAt,
    availableDraft,
    restoreDraft,
    clearDraft,
    saveDraftManually,
  } = useHiringRequestAutoSave(isOpen, form, setForm, Boolean(editingRequest));

  useEffect(() => {
    if (isOpen) {
      setActiveStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isStep1Complete = Boolean(
    (form.title || form.position)?.trim() &&
    form.department?.trim() &&
    form.justification?.trim()
  );

  const isStep2Complete = Boolean(
    (form.employee_type || form.employment_type) &&
    form.employee_level &&
    form.contract_type
  );

  const isStep3Complete = Boolean(
    form.jd_summary?.trim() || form.job_description?.trim()
  );

  const handleNextFromStep1 = () => {
    if (!form.title.trim() && !form.position?.trim()) {
      toast.error("Please provide a Position / Job Title.");
      return;
    }
    if (!form.department.trim()) {
      toast.error("Please select a Department.");
      return;
    }
    if (!form.justification.trim()) {
      toast.error("Please enter the Reason for Hiring / Business Need.");
      return;
    }
    setActiveStep(2);
  };

  const handleNextFromStep2 = () => {
    setActiveStep(3);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() && !form.position?.trim()) {
      setActiveStep(1);
      toast.error("Please provide a Position Title in Part 1.");
      return;
    }
    if (!form.department.trim()) {
      setActiveStep(1);
      toast.error("Please select a Department in Part 1.");
      return;
    }
    if (!form.justification.trim()) {
      setActiveStep(1);
      toast.error("Please provide the Business Need in Part 1.");
      return;
    }
    if (!form.jd_summary?.trim() && !form.job_description?.trim()) {
      setActiveStep(3);
      toast.error("Please enter the Role Purpose & Mission in Part 3 (Job Description).");
      return;
    }
    clearDraft();
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[700px] max-h-[92vh]">
        {/* Top Breadcrumb & Close Bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-0.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line text-xs" />
            <span>Hiring Requisition</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Modal Title Banner with Auto-Save Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-5 pb-2 shrink-0">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center text-base shrink-0 shadow-2xs">
              <i className={editingRequest ? "ri-edit-line" : "ri-file-text-fill"} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-snug">
                  {editingRequest
                    ? `Edit Requisition ${editingRequest.requisition_id ? `(${editingRequest.requisition_id})` : ""}`
                    : "New Hiring Requisition"}
                </h2>
                
                {/* Auto-Save Indicators */}
                {!editingRequest && autoSaveStatus === "saving" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700 animate-pulse">
                    <i className="ri-loader-4-line animate-spin text-xs" />
                    <span>Saving draft...</span>
                  </span>
                )}

                {!editingRequest && autoSaveStatus !== "saving" && lastSavedAt && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-700"
                    title={`Last auto-saved at ${lastSavedAt.toLocaleTimeString()}`}
                  >
                    <i className="ri-check-line text-xs font-bold" />
                    <span>Draft saved at {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                  </span>
                )}

                {!editingRequest && lastSavedAt && (
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors underline cursor-pointer"
                    title="Discard saved draft and start fresh"
                  >
                    Clear draft
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {editingRequest ? "Modify requisition parameters, position requirements, and job description." : "Submit a complete enterprise hiring requisition for executive review and live posting."}
              </p>
            </div>
          </div>

          {!editingRequest && (
            <div className="flex items-center gap-2 shrink-0">
              <label
                className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-700 cursor-pointer select-none bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg"
                title={autoSaveEnabled ? "Auto-save is enabled" : "Auto-save is disabled"}
              >
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-medium">Auto-save</span>
              </label>
            </div>
          )}
        </div>

        {/* Existing Draft Recovery Banner */}
        {!editingRequest && availableDraft && (
          <div className="mx-5 mb-2 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between gap-2.5 text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <i className="ri-history-line text-amber-600 text-sm shrink-0" />
              <span>
                <strong>Unsaved Draft Detected:</strong> (<strong>{availableDraft.title || availableDraft.position || "Untitled Position"}</strong> &bull; <strong>{availableDraft.department || "General"}</strong>).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-2xs cursor-pointer text-xs"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={clearDraft}
                className="px-2.5 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-100/50 text-amber-800 font-semibold transition-colors cursor-pointer text-xs"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* 3-Step Horizontal Stepper Header */}
        <div className="px-5 sm:px-8 py-2 border-y border-slate-200/80 bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between max-w-4xl mx-auto gap-3 sm:gap-6">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="flex items-center gap-2 group cursor-pointer relative pb-0.5 shrink-0"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  activeStep === 1
                    ? "bg-[#2563EB] text-white shadow-sm ring-2 ring-blue-100"
                    : "border border-slate-300 text-slate-500 bg-white group-hover:border-slate-400 group-hover:text-slate-700"
                }`}
              >
                1
              </span>
              <span
                className={`text-xs sm:text-xs font-semibold transition-colors ${
                  activeStep === 1 ? "text-[#2563EB] font-bold" : "text-slate-600 group-hover:text-slate-900"
                }`}
              >
                Placement & Position
              </span>
              {activeStep === 1 && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#2563EB] rounded-full" />
              )}
            </button>

            <div className="flex-1 h-[2px] bg-slate-200 min-w-[30px] sm:min-w-[60px]" />

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-2 group cursor-pointer relative pb-0.5 shrink-0"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  activeStep === 2
                    ? "bg-[#2563EB] text-white shadow-sm ring-2 ring-blue-100"
                    : "border border-slate-300 text-slate-500 bg-white group-hover:border-slate-400 group-hover:text-slate-700"
                }`}
              >
                2
              </span>
              <span
                className={`text-xs sm:text-xs font-semibold transition-colors ${
                  activeStep === 2 ? "text-[#2563EB] font-bold" : "text-slate-600 group-hover:text-slate-900"
                }`}
              >
                Terms & Contract
              </span>
              {activeStep === 2 && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#2563EB] rounded-full" />
              )}
            </button>

            <div className="flex-1 h-[2px] bg-slate-200 min-w-[30px] sm:min-w-[60px]" />

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="flex items-center gap-2 group cursor-pointer relative pb-0.5 shrink-0"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  activeStep === 3
                    ? "bg-[#2563EB] text-white shadow-sm ring-2 ring-blue-100"
                    : "border border-slate-300 text-slate-500 bg-white group-hover:border-slate-400 group-hover:text-slate-700"
                }`}
              >
                3
              </span>
              <span
                className={`text-xs sm:text-xs font-semibold transition-colors ${
                  activeStep === 3 ? "text-[#2563EB] font-bold" : "text-slate-600 group-hover:text-slate-900"
                }`}
              >
                Job Description
              </span>
              {activeStep === 3 && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#2563EB] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-3 sm:px-5 sm:py-3 space-y-2.5">
          <CreateHiringRequestFields
            form={form}
            setForm={setForm}
            editingRequest={editingRequest}
            branches={branches}
            departments={departments}
            employees={employees}
            isSuperAdmin={isSuperAdmin}
            isBranchAdmin={isBranchAdmin}
            userBranchId={userBranchId}
            userBranchName={userBranchName}
            targetBranch={targetBranch}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
        </form>

        {/* Footer Actions */}
        <div className="p-3 sm:px-5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div>
            {activeStep === 1 ? (
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            ) : activeStep === 2 ? (
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-arrow-left-line" /> Back to Placement
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-arrow-left-line" /> Back to Terms & Contract
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeStep === 1 ? (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Continue to Terms & Contract</span>
                <i className="ri-arrow-right-line" />
              </button>
            ) : activeStep === 2 ? (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Continue to Job Description</span>
                <i className="ri-arrow-right-line" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const success = saveDraftManually();
                    if (success) {
                      toast.success("Draft saved successfully!");
                    } else {
                      toast.error("Please fill in some details before saving draft.");
                    }
                  }}
                  disabled={submitting}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-save-line text-slate-500" /> Save Draft
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin" /> {editingRequest ? "Updating..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <i className={editingRequest ? "ri-save-line" : "ri-send-plane-fill"} />
                      <span>{editingRequest ? "Save & Update Requisition" : "Submit Requisition"}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
