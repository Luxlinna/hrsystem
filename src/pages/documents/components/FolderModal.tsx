import { memo } from "react";
import type { DocumentFolder, FolderFormState } from "../types";
import { FOLDER_COLOR_PRESETS, AVAILABLE_FOLDER_ICONS } from "../constants";

interface FolderModalProps {
  isOpen: boolean;
  editingFolder: DocumentFolder | null;
  folderForm: FolderFormState;
  setFolderForm: React.Dispatch<React.SetStateAction<FolderFormState>>;
  folders: DocumentFolder[];
  rootFolders: DocumentFolder[];
  folderSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const FolderModal = memo(function FolderModal({
  isOpen,
  editingFolder,
  folderForm,
  setFolderForm,
  folders,
  rootFolders,
  folderSubmitting,
  onClose,
  onSubmit,
}: FolderModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !folderSubmitting && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
              <i className={editingFolder ? "ri-folder-settings-line" : folderForm.parentId ? "ri-folder-2-line" : "ri-folder-add-line"} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                {editingFolder
                  ? `Edit ${editingFolder.parent_id ? "Subfolder" : "Folder"}`
                  : folderForm.parentId
                  ? "Add New Subfolder"
                  : "Add New Folder"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {folderForm.parentId
                  ? `Create a subfolder inside "${folders.find((f) => f.id === folderForm.parentId)?.label || "parent"}"`
                  : "Create a top-level category folder"}
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

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Parent Folder Hierarchy Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Folder Location / Parent Level
            </label>
            <select
              value={folderForm.parentId}
              onChange={(e) => setFolderForm({ ...folderForm, parentId: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">📁 None (Top-Level Folder)</option>
              {rootFolders
                .filter((rf) => !editingFolder || rf.id !== editingFolder.id)
                .map((rf) => (
                  <option key={rf.id} value={rf.id}>
                    ↳ Subfolder inside: {rf.label}
                  </option>
                ))}
            </select>
          </div>

          {/* Folder Name */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              {folderForm.parentId ? "Subfolder Name" : "Folder Name"} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={folderForm.label}
              onChange={(e) => setFolderForm({ ...folderForm, label: e.target.value })}
              placeholder={folderForm.parentId ? "e.g. Standard Operating Procedures (SOPs)..." : "e.g. OPS solutions, Handbooks..."}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FOLDER_COLOR_PRESETS.map((p) => {
                const isSelected = folderForm.colorPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFolderForm({ ...folderForm, colorPreset: p.id })}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? `${p.bg} ${p.color} border-current ring-2 ring-current/20 font-black`
                        : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${p.bg} ${p.color} border border-current shrink-0`} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Folder Icon
            </label>
            <div className="grid grid-cols-6 gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-200/80 max-h-32 overflow-y-auto">
              {AVAILABLE_FOLDER_ICONS.map((iconName) => {
                const isSelected = folderForm.icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFolderForm({ ...folderForm, icon: iconName })}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#253C7D] text-white shadow-xs scale-105"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                    }`}
                  >
                    <i className={iconName} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={folderForm.description}
              onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
              placeholder="e.g. SOPs and guidelines for operational workflows"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Footer */}
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
              disabled={folderSubmitting || !folderForm.label.trim()}
              className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {folderSubmitting
                ? "Saving..."
                : editingFolder
                ? "Update Folder"
                : folderForm.parentId
                ? "Create Subfolder"
                : "Create Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
