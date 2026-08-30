import { memo } from "react";
import type { DocumentFolder, DocFormState } from "../types";

interface DocumentUploadModalFieldsProps {
  form: DocFormState;
  setForm: React.Dispatch<React.SetStateAction<DocFormState>>;
  rootFolders: DocumentFolder[];
  getSubfolders: (parentId: string) => DocumentFolder[];
  onOpenNewFolder: () => void;
}

export const DocumentUploadModalFields = memo(function DocumentUploadModalFields({
  form,
  setForm,
  rootFolders,
  getSubfolders,
  onOpenNewFolder,
}: DocumentUploadModalFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Folder Category Select */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Destination Folder <span className="text-rose-500">*</span>
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
          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          {rootFolders.map((rf) => {
            const sub = getSubfolders(rf.id);
            if (sub.length > 0) {
              return (
                <optgroup key={rf.id} label={`📁 ${rf.label}`}>
                  <option value={rf.id}>{rf.label} (Top Level)</option>
                  {sub.map((sf) => (
                    <option key={sf.id} value={sf.id}>
                      &nbsp;&nbsp;↳ {sf.label}
                    </option>
                  ))}
                </optgroup>
              );
            }
            return (
              <option key={rf.id} value={rf.id}>
                📁 {rf.label}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Visibility
          </label>
          <select
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value as any })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">🌐 All Employees</option>
            <option value="management">🔒 Management Only</option>
            <option value="confidential">🛑 Confidential (HR Only)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Version
          </label>
          <input
            type="text"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            placeholder="1.0"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
          Description / Executive Summary
        </label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of the document contents and who should review it..."
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
        />
      </div>
    </div>
  );
});
