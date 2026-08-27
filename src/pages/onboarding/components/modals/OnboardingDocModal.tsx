import { memo } from "react";
import type { OnboardingRequest, DocForm } from "../../types";
import { STAGES } from "../../constants";

interface OnboardingDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequest: OnboardingRequest | null;
  selectedStage: string;
  docForm: DocForm;
  setDocForm: React.Dispatch<React.SetStateAction<DocForm>>;
  selectedFileName: string | null;
  editingDocId: string | null;
  uploading: boolean;
  isDragOver: boolean;
  setIsDragOver: (isOver: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const OnboardingDocModal = memo(function OnboardingDocModal({
  isOpen,
  onClose,
  selectedRequest,
  selectedStage,
  docForm,
  setDocForm,
  selectedFileName,
  editingDocId,
  uploading,
  isDragOver,
  setIsDragOver,
  fileInputRef,
  onSubmit,
}: OnboardingDocModalProps) {
  if (!isOpen || !selectedRequest) return null;

  const stageLabel = STAGES.find((s) => s.key === selectedStage)?.label || selectedStage;
  const emp = selectedRequest.employees;
  const fullName = emp ? `${emp.first_name} ${emp.last_name}` : "New Hire";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              {editingDocId ? "Edit Checklist Item" : "Add Checklist Item"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {fullName} &middot; {stageLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Document / Task Name */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Document / Task Description *
            </label>
            <input
              type="text"
              required
              value={docForm.document_name}
              onChange={(e) => setDocForm({ ...docForm, document_name: e.target.value })}
              placeholder="e.g., Signed Employment Agreement or ID Scan"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={docForm.due_date}
              onChange={(e) => setDocForm({ ...docForm, due_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Attachment File (Optional)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0] && fileInputRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(e.dataTransfer.files[0]);
                  fileInputRef.current.files = dt.files;
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-[#253C7D] bg-[#253C7D]/5"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
              }`}
            >
              <i className="ri-upload-cloud-2-line text-2xl text-gray-400 mb-1 block" />
              <p className="text-xs font-bold text-gray-700">
                Click or drag & drop file here
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">PDF, DOCX, PNG, JPG up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={() => {}}
              />
            </div>
            {selectedFileName && (
              <p className="text-[11px] text-sky-600 font-bold mt-1.5 flex items-center gap-1">
                <i className="ri-file-line" />
                Current: {selectedFileName}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Instructions or Notes
            </label>
            <textarea
              rows={2}
              value={docForm.notes}
              onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
              placeholder="Instructions for the new hire or internal team..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {uploading ? "Saving..." : editingDocId ? "Save Changes" : "Add to Checklist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
