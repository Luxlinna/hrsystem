import { memo } from "react";
import type { Document, DocumentFolder, DocFormState } from "../types";
import { MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES } from "../constants";
import { toast } from "@/components/Toast";

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
        {/* Modal Header */}
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
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Modal Body Form */}
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

          {/* Attach File or Link */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Attach File or Resource
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) {
                  if (dropped.size > MAX_FILE_SIZE_BYTES) {
                    toast("File Too Large", `Maximum file size is ${MAX_FILE_SIZE_MB} MB.`, "error");
                    return;
                  }
                  setFileUpload(dropped);
                }
              }}
              className={`w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-[#253C7D] bg-[#253C7D]/10"
                  : "border-gray-200 hover:border-[#253C7D]/40 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size > MAX_FILE_SIZE_BYTES) {
                    toast("File Too Large", `Maximum file size is ${MAX_FILE_SIZE_MB} MB.`, "error");
                    e.target.value = "";
                    return;
                  }
                  setFileUpload(file || null);
                }}
              />
              {fileUpload ? (
                <div className="flex items-center justify-center gap-2">
                  <i className="ri-file-line text-[#253C7D] text-lg" />
                  <span className="text-xs text-gray-800 font-bold">{fileUpload.name}</span>
                  <span className="text-[11px] text-gray-400">({Math.round(fileUpload.size / 1024)} KB)</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileUpload(null);
                      setFileLink("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-gray-400 hover:text-rose-500 ml-1 cursor-pointer"
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>
              ) : (
                <div>
                  <i
                    className={`text-2xl transition-colors ${
                      dragOver ? "ri-upload-cloud-line text-[#253C7D]" : "ri-upload-cloud-2-line text-gray-400"
                    }`}
                  />
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    {dragOver ? "Drop your file here" : "Click to browse or drag file here"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 my-2.5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] text-gray-400 font-bold">OR PASTE URL LINK</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="relative">
              <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="url"
                value={fileLink}
                onChange={(e) => setFileLink(e.target.value)}
                placeholder="https://docs.google.com/... or SharePoint URL"
                className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
              {fileLink && (
                <button
                  type="button"
                  onClick={() => setFileLink("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-xs" />
                </button>
              )}
            </div>
          </div>

          {/* Category Folder / Subfolder & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Folder / Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenNewFolder}
                  className="text-[10px] font-bold text-[#253C7D] hover:underline cursor-pointer"
                >
                  + New Folder
                </button>
              </div>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {rootFolders.map((rf) => {
                  const subs = getSubfolders(rf.id);
                  if (subs.length === 0) {
                    return (
                      <option key={rf.id} value={rf.id}>
                        📁 {rf.label}
                      </option>
                    );
                  }
                  return (
                    <optgroup key={rf.id} label={`📁 ${rf.label}`}>
                      <option value={rf.id}>📁 {rf.label} (Main Folder)</option>
                      {subs.map((s) => (
                        <option key={s.id} value={s.id}>
                          &nbsp;&nbsp;↳ 📂 {s.label}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Section Tag / Note
              </label>
              <input
                type="text"
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                placeholder="e.g. Operations Q3, Guidelines..."
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Version & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Version
              </label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="1.0"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Audience Visibility
              </label>
              <select
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="all">All Staff</option>
                <option value="managers">Managers Only</option>
                <option value="hr_only">HR Only</option>
              </select>
            </div>
          </div>

          {/* Author & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Author / Issuer
              </label>
              <input
                type="text"
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="policy, ops, 2026"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Summary Description
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Summary of document purpose and key terms..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Template Checkbox Switch */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-gray-200/60">
            <input
              type="checkbox"
              id="templateToggle"
              checked={form.is_template}
              onChange={(e) => setForm({ ...form, is_template: e.target.checked })}
              className="rounded text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
            />
            <label htmlFor="templateToggle" className="text-xs font-bold text-gray-800 cursor-pointer">
              Mark as Reusable Document Template
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 flex gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title}
              className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : editingDoc
                ? "Save Changes"
                : "Upload Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
