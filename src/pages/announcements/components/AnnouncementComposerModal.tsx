import React, { memo } from "react";
import type { AnnouncementFormState, ComposerMode } from "../types";
import { AnnouncementBranchScopePicker } from "./AnnouncementBranchScopePicker";
import { AnnouncementCategoryPicker } from "./AnnouncementCategoryPicker";
import { AnnouncementPriorityPicker } from "./AnnouncementPriorityPicker";
import { AnnouncementAudiencePicker } from "./AnnouncementAudiencePicker";
import { AnnouncementContentEditor } from "./AnnouncementContentEditor";
import { AnnouncementCardPreview } from "./AnnouncementCardPreview";

interface AnnouncementComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  form: AnnouncementFormState;
  setForm: React.Dispatch<React.SetStateAction<AnnouncementFormState>>;
  submitting: boolean;
  composerMode: ComposerMode;
  setComposerMode: (mode: ComposerMode) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSuperAdmin?: boolean;
  userBranchName?: string;
  userBranchId?: string | null;
}

export const AnnouncementComposerModal = memo(function AnnouncementComposerModal({
  isOpen,
  onClose,
  editingId,
  form,
  setForm,
  submitting,
  composerMode,
  setComposerMode,
  onSubmit,
  isSuperAdmin = false,
  userBranchName = "Main Branch",
  userBranchId = null,
}: AnnouncementComposerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-gray-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              <i className={editingId ? "ri-edit-line" : "ri-megaphone-line"} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {editingId ? "Edit Company Announcement" : "Create Broadcast Announcement"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {editingId ? "Update announcement parameters and messaging" : "Broadcast company news, operational updates, and policies"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
              <button
                type="button"
                onClick={() => setComposerMode("write")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  composerMode === "write" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-pencil-line" />
                <span>Composer</span>
              </button>
              <button
                type="button"
                onClick={() => setComposerMode("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  composerMode === "preview" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-eye-line" />
                <span>Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {composerMode === "write" ? (
            <>
              <AnnouncementBranchScopePicker
                form={form}
                setForm={setForm}
                isSuperAdmin={isSuperAdmin}
                userBranchName={userBranchName}
                userBranchId={userBranchId}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <AnnouncementCategoryPicker form={form} setForm={setForm} />
                <AnnouncementPriorityPicker form={form} setForm={setForm} />
              </div>

              <AnnouncementAudiencePicker form={form} setForm={setForm} />

              <AnnouncementContentEditor form={form} setForm={setForm} />
            </>
          ) : (
            <AnnouncementCardPreview form={form} />
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <i className="ri-send-plane-fill text-sm" />
                  <span>{editingId ? "Save Changes" : "Broadcast Notice"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
