import { memo } from "react";
import type { DocumentFolder } from "../types";
import { FolderTreeItem } from "./FolderTreeItem";

interface FolderTreeSidebarProps {
  rootFolders: DocumentFolder[];
  folders: DocumentFolder[];
  activeCategory: string;
  expandedFolderIds: Set<string>;
  categoryCounts: Record<string, number>;
  canManageDocs: boolean;
  filterTemplate: boolean | null;
  onSelectCategory: (categoryId: string) => void;
  onToggleExpanded: (folderId: string, e?: React.MouseEvent) => void;
  onOpenNewFolder: (parentId?: string) => void;
  onOpenEditFolder: (folder: DocumentFolder) => void;
  onDeleteFolder: (folder: DocumentFolder) => void;
  onSetFilterTemplate: (value: boolean | null) => void;
}

export const FolderTreeSidebar = memo(function FolderTreeSidebar({
  rootFolders,
  folders,
  activeCategory,
  expandedFolderIds,
  categoryCounts,
  canManageDocs,
  filterTemplate,
  onSelectCategory,
  onToggleExpanded,
  onOpenNewFolder,
  onOpenEditFolder,
  onDeleteFolder,
  onSetFilterTemplate,
}: FolderTreeSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Categories &amp; Folders
          </span>
          {canManageDocs && (
            <button
              onClick={() => onOpenNewFolder()}
              className="text-[11px] font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
              title="Add Top-Level Folder"
            >
              <i className="ri-add-line" />
              Add Folder
            </button>
          )}
        </div>

        {/* All Documents item */}
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeCategory === "all"
              ? "bg-[#253C7D] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm ${
                activeCategory === "all" ? "bg-white/20 text-white" : "bg-[#253C7D]/10 text-[#253C7D]"
              }`}
            >
              <i className="ri-folder-line" />
            </div>
            <span>All Documents</span>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeCategory === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {categoryCounts["all"] || 0}
          </span>
        </button>

        {/* Root Folders & Nested Subfolders */}
        {rootFolders.map((rf) => (
          <FolderTreeItem
            key={rf.id}
            folder={rf}
            folders={folders}
            activeCategory={activeCategory}
            expandedFolderIds={expandedFolderIds}
            categoryCounts={categoryCounts}
            canManageDocs={canManageDocs}
            onSelectCategory={onSelectCategory}
            onToggleExpanded={onToggleExpanded}
            onOpenNewFolder={onOpenNewFolder}
            onOpenEditFolder={onOpenEditFolder}
            onDeleteFolder={onDeleteFolder}
          />
        ))}
      </div>

      {/* Templates Filter Quick Card */}
      <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 rounded-3xl border border-indigo-100/80 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900">
          <i className="ri-file-copy-2-line text-indigo-600 text-base" />
          <span>Quick Filter: Templates</span>
        </div>
        <p className="text-[11px] text-indigo-950/70 leading-relaxed">
          Standardized reusable forms, evaluation sheets, and templates.
        </p>
        <button
          type="button"
          onClick={() => onSetFilterTemplate(filterTemplate ? null : true)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterTemplate
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-indigo-700 border border-indigo-200/60 hover:bg-indigo-50"
          }`}
        >
          {filterTemplate ? "✓ Showing Templates Only" : "Filter by Templates"}
        </button>
      </div>
    </div>
  );
});
