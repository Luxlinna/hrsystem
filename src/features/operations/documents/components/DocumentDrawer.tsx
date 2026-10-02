import { memo } from "react";
import type { Document, DocumentFolder, DrawerTabKey } from "../types";
import { FILE_TYPE_COLOR, FILE_TYPE_ICON } from "../constants";
import { DocumentDrawerHeader } from "./DocumentDrawerHeader";
import { DocumentDrawerOverview } from "./DocumentDrawerOverview";
import { DocumentDrawerRelated } from "./DocumentDrawerRelated";

interface DocumentDrawerProps {
  selectedDoc: Document | null;
  folders: DocumentFolder[];
  rootFolders: DocumentFolder[];
  drawerTab: DrawerTabKey;
  setDrawerTab: (tab: DrawerTabKey) => void;
  relatedDocuments: Document[];
  canManageDocs: boolean;
  onClose: () => void;
  onSelectDoc: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onCopyLink: (doc: Document) => void;
  onQuickMoveFolder: (doc: Document, newCategoryId: string) => void;
  onOpenEdit: (doc: Document) => void;
  onArchive: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onSearchTag: (tag: string) => void;
}

export const DocumentDrawer = memo(function DocumentDrawer({
  selectedDoc,
  folders,
  rootFolders,
  drawerTab,
  setDrawerTab,
  relatedDocuments,
  canManageDocs,
  onClose,
  onSelectDoc,
  onDownload,
  onCopyLink,
  onQuickMoveFolder,
  onOpenEdit,
  onArchive,
  onDelete,
  onSearchTag,
}: DocumentDrawerProps) {
  if (!selectedDoc) return null;

  const folder = folders.find((f) => f.id === selectedDoc.category);
  const parentFolder = folder?.parent_id ? folders.find((f) => f.id === folder.parent_id) : null;
  const typeColor = FILE_TYPE_COLOR[selectedDoc.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
  const typeIcon = FILE_TYPE_ICON[selectedDoc.file_type] || "ri-file-line";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[500px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-hidden">
        <DocumentDrawerHeader
          selectedDoc={selectedDoc}
          folder={folder}
          parentFolder={parentFolder}
          typeColor={typeColor}
          typeIcon={typeIcon}
          onClose={onClose}
        />

        {/* Quick Action Strip */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {selectedDoc.file_url && (
              <a
                href={selectedDoc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <i className="ri-external-link-line text-emerald-600" />
                Open Preview
              </a>
            )}

            <button
              type="button"
              onClick={() => onCopyLink(selectedDoc)}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <i className="ri-file-copy-line text-[#253C7D]" />
              Copy Link
            </button>
          </div>

          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${selectedDoc.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
            ● {selectedDoc.status}
          </span>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDrawerTab("overview")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                drawerTab === "overview" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <i className="ri-information-line" />
              <span>File Details</span>
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab("related")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                drawerTab === "related" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <i className="ri-folder-line" />
              <span>Folder Files ({relatedDocuments.length + 1})</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {drawerTab === "overview" ? (
            <DocumentDrawerOverview
              selectedDoc={selectedDoc}
              folder={folder}
              folders={folders}
              rootFolders={rootFolders}
              canManageDocs={canManageDocs}
              onQuickMoveFolder={onQuickMoveFolder}
              onSearchTag={onSearchTag}
            />
          ) : (
            <DocumentDrawerRelated
              relatedDocuments={relatedDocuments}
              onSelectDoc={onSelectDoc}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onDownload(selectedDoc)}
            className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="ri-download-cloud-line" />
            Download Resource
          </button>

          {canManageDocs && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenEdit(selectedDoc)}
                className="p-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors cursor-pointer"
                title="Edit Document"
              >
                <i className="ri-edit-line text-sm" />
              </button>
              <button
                type="button"
                onClick={() => onArchive(selectedDoc)}
                className="p-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors cursor-pointer"
                title={selectedDoc.status === "archived" ? "Unarchive Document" : "Archive Document"}
              >
                <i className="ri-archive-line text-sm" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(selectedDoc)}
                className="p-2.5 bg-white border border-gray-200 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors cursor-pointer"
                title="Delete Document"
              >
                <i className="ri-delete-bin-line text-sm" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
