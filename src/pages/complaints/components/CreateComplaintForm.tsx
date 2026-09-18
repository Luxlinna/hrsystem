import React, { memo } from "react";
import type { ComplaintFormState, ComplaintSuggestion } from "../types";
import { ComplaintInfoFields } from "./ComplaintInfoFields";
import { ComplaintAttachmentSection } from "./ComplaintAttachmentSection";
import { ComplaintFormActions } from "./ComplaintFormActions";

interface CreateComplaintFormProps {
  form: ComplaintFormState;
  setForm: React.Dispatch<React.SetStateAction<ComplaintFormState>>;
  editingRecord: ComplaintSuggestion | null;
  saving: boolean;
  branchId?: string | null;
  branchName?: string | null;
  onBack: () => void;
  onSubmit: (e: React.FormEvent, shouldClose?: boolean) => void;
  onUploadDocument: (file: File) => Promise<{ url: string; name: string } | null>;
}

export const CreateComplaintForm = memo(function CreateComplaintForm({
  form,
  setForm,
  editingRecord,
  saving,
  branchId,
  branchName,
  onBack,
  onSubmit,
  onUploadDocument,
}: CreateComplaintFormProps) {
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, false);
  };

  const handleSaveAndClose = () => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    onSubmit(fakeEvent, true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 mb-6 sticky top-0 z-30 flex items-center justify-between">
        <h1 className="text-xl font-medium text-slate-600 tracking-tight">
          {editingRecord ? "Edit Complaint/Suggestion" : "Create Complaint/Suggestion"}
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line text-sm" />
          Back
        </button>
      </div>

      {/* Main Form Body Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <form
          onSubmit={handleSubmitForm}
          className="bg-white border border-slate-200 rounded p-6 sm:p-8 space-y-6 shadow-2xs"
        >
          {/* 1. COMPLAINT/SUGGESTION INFO */}
          <ComplaintInfoFields
            form={form}
            setForm={setForm}
            branchId={branchId}
            branchName={branchName}
          />

          {/* 2. ATTACHMENT INFO */}
          <ComplaintAttachmentSection
            form={form}
            setForm={setForm}
            onUploadDocument={onUploadDocument}
          />

          {/* 3. Actions */}
          <ComplaintFormActions
            saving={saving}
            onDiscard={onBack}
            onSaveAndClose={handleSaveAndClose}
          />
        </form>
      </div>
    </div>
  );
});
