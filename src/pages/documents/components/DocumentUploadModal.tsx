import { memo } from "react";
import type { Document, DocumentFolder, DocFormState } from "../types";
import { DocumentDropzone } from "./DocumentDropzone";
import { DocumentUploadModalFields } from "./DocumentUploadModalFields";

interface DocumentUploadModalProps {
  isOpen: boolean;
  editingDoc: Document | null;
  form: DocFormState;
  setForm: React.Dispatch<React.SetStateAction<DocFormState>>;
  fileUpload: File | null;
  setFileUpload: (file: File | null) => void;
  fileLink: string;
  setFileLink: (link: string) => void;
  dragOver: boolean;
  setDragOver: (drag: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  rootFolders: DocumentFolder[];
  getSubfolders: (parentId: string) => DocumentFolder[];
  submitting: boolean;
  onClose: () => void;
  onOpenNewFolder: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const DocumentUploadModal = memo(function DocumentUploadModal({
  isOpen,
  editingDoc,
  form,
  setForm,
  fileUpload,
  setFileUpload,
  fileLink,
  setFileLink,
  dragOver,
  setDragOver,
  fileInputRef,
  rootFolders,
  getSubfolders,
  submitting,
  onClose,
  onOpenNewFolder,
  onSubmit,
}: DocumentUploadModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
              <i className={editingDoc ? "ri-edit-line" : "ri-upload-cloud-line"} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                {editingDoc ? "Edit Document Metadata" : "Upload Corporate Document"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {editingDoc ? "Update document terms and visibility" : "Add new file to corporate repository"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Employee Code of Conduct & Ethics 2026"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <DocumentDropzone
            fileUpload={fileUpload}
            setFileUpload={setFileUpload}
            fileLink={fileLink}
            setFileLink={setFileLink}
            dragOver={dragOver}
            setDragOver={setDragOver}
            fileInputRef={fileInputRef}
          />

          <DocumentUploadModalFields
            form={form}
            setForm={setForm}
            rootFolders={rootFolders}
            getSubfolders={getSubfolders}
            onOpenNewFolder={onOpenNewFolder}
          />

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingDoc ? "Save Changes" : "Publish Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
