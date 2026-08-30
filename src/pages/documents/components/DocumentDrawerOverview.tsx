import { memo } from "react";
import type { Document, DocumentFolder } from "../types";
import { VISIBILITY_LABELS } from "../constants";
import { cleanFileName } from "../exportUtils";

interface DocumentDrawerOverviewProps {
  selectedDoc: Document;
  folder?: DocumentFolder;
  folders: DocumentFolder[];
  rootFolders: DocumentFolder[];
  canManageDocs: boolean;
  onQuickMoveFolder: (doc: Document, newCategoryId: string) => void;
  onSearchTag: (tag: string) => void;
}

export const DocumentDrawerOverview = memo(function DocumentDrawerOverview({
  selectedDoc,
  folder,
  folders,
  rootFolders,
  canManageDocs,
  onQuickMoveFolder,
  onSearchTag,
}: DocumentDrawerOverviewProps) {
  const getSubfolders = (parentId: string) => folders.filter((f) => f.parent_id === parentId);

  return (
    <div className="space-y-4">
      {/* Description */}
      {selectedDoc.description && (
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Summary / Scope:
          </span>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
            {selectedDoc.description}
          </p>
        </div>
      )}

      {/* Metadata Table */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Attached File:</span>
          <span className="font-bold text-gray-800 truncate max-w-[200px]" title={selectedDoc.file_name}>
            {cleanFileName(selectedDoc.file_name)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">File Size:</span>
          <span className="font-bold text-gray-800">{selectedDoc.file_size || "—"}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Access Visibility:</span>
          <span className="font-bold text-gray-800">
            {VISIBILITY_LABELS[selectedDoc.visibility] || selectedDoc.visibility}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Total Downloads:</span>
          <span className="font-extrabold text-[#253C7D] bg-[#253C7D]/10 px-2 py-0.5 rounded-full text-[11px]">
            {selectedDoc.download_count || 0} times
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Uploaded By:</span>
          <span className="font-bold text-gray-800">{selectedDoc.created_by || "Administrator"}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Created Date:</span>
          <span className="font-bold text-gray-800">
            {new Date(selectedDoc.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Tags */}
      {selectedDoc.tags && selectedDoc.tags.length > 0 && (
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
            Search Tags
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedDoc.tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onSearchTag(t)}
                className="px-2 py-1 bg-gray-100 hover:bg-[#253C7D]/10 hover:text-[#253C7D] text-gray-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Move Folder */}
      {canManageDocs && (
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Move to Another Folder:
          </label>
          <select
            value={selectedDoc.category}
            onChange={(e) => onQuickMoveFolder(selectedDoc, e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D] cursor-pointer"
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
      )}
    </div>
  );
});
