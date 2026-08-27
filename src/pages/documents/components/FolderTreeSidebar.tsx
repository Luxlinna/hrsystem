import { memo } from "react";
import type { DocumentFolder } from "../types";

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
  const getSubfolders = (parentId: string) => folders.filter((f) => f.parent_id === parentId);

  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Categories & Folders
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

        {/* Root Folders & Nested Subfolders List */}
        {rootFolders.map((rf) => {
          const isSelected = activeCategory === rf.id;
          const subfolders = getSubfolders(rf.id);
          const isExpanded = expandedFolderIds.has(rf.id);
          const count = categoryCounts[rf.id] || 0;

          return (
            <div key={rf.id} className="space-y-1">
              {/* Root Folder Item */}
              <div
                className={`group relative flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#253C7D] text-white shadow-xs"
                    : "text-gray-700 hover:text-gray-900 hover:bg-slate-50"
                }`}
                onClick={() => {
                  onSelectCategory(rf.id);
                  if (subfolders.length > 0 && !isExpanded) {
                    onToggleExpanded(rf.id);
                  }
                }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Expand / Collapse Chevron */}
                  {subfolders.length > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => onToggleExpanded(rf.id, e)}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-transform cursor-pointer ${
                        isExpanded ? "rotate-90" : ""
                      } ${isSelected ? "text-white/80" : "text-gray-400"}`}
                    >
                      <i className="ri-arrow-right-s-line text-sm" />
                    </button>
                  ) : (
                    <span className="w-4" />
                  )}

                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                      isSelected ? "bg-white/20 text-white" : `${rf.bg} ${rf.color}`
                    }`}
                  >
                    <i className={rf.icon || "ri-folder-line"} />
                  </div>
                  <span className="truncate">{rf.label}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Actions: Add Subfolder / Edit / Delete */}
                  {canManageDocs && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onOpenNewFolder(rf.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 text-[#253C7D]"
                        }`}
                        title={`Add Subfolder inside ${rf.label}`}
                      >
                        <i className="ri-folder-add-line text-xs" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEditFolder(rf)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 text-gray-500"
                        }`}
                        title="Edit Folder"
                      >
                        <i className="ri-pencil-line text-xs" />
                      </button>
                      {!rf.is_system && (
                        <button
                          type="button"
                          onClick={() => onDeleteFolder(rf)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            isSelected ? "hover:bg-rose-500/30 text-rose-200" : "hover:bg-rose-100 text-rose-600"
                          }`}
                          title="Delete Folder"
                        >
                          <i className="ri-delete-bin-line text-xs" />
                        </button>
                      )}
                    </div>
                  )}

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </div>
              </div>

              {/* Nested Subfolders */}
              {isExpanded && subfolders.length > 0 && (
                <div className="ml-5 pl-3 border-l-2 border-slate-100 space-y-1 py-0.5">
                  {subfolders.map((sub) => {
                    const isSubSelected = activeCategory === sub.id;
                    const subCount = categoryCounts[sub.id] || 0;

                    return (
                      <div
                        key={sub.id}
                        className={`group/sub flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSubSelected
                            ? "bg-[#253C7D] text-white font-bold shadow-xs"
                            : "text-gray-600 hover:text-gray-900 hover:bg-slate-50"
                        }`}
                        onClick={() => onSelectCategory(sub.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                              isSubSelected ? "bg-white/20 text-white" : `${sub.bg} ${sub.color}`
                            }`}
                          >
                            <i className={sub.icon || "ri-folder-2-line"} />
                          </div>
                          <span className="truncate">{sub.label}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {canManageDocs && (
                            <div className="opacity-0 group-hover/sub:opacity-100 flex items-center gap-0.5 transition-opacity">
                              <button
                                type="button"
                                onClick={() => onOpenEditFolder(sub)}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                  isSubSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 text-gray-500"
                                }`}
                                title="Edit Subfolder"
                              >
                                <i className="ri-pencil-line text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteFolder(sub)}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                  isSubSelected ? "hover:bg-rose-500/30 text-rose-200" : "hover:bg-rose-100 text-rose-600"
                                }`}
                                title="Delete Subfolder"
                              >
                                <i className="ri-delete-bin-line text-xs" />
                              </button>
                            </div>
                          )}

                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                              isSubSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {subCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Filter Pill Box */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-2xs space-y-2">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 block">
          Quick Filter
        </span>
        <div className="space-y-1">
          {[
            { label: "All Document Types", value: null },
            { label: "Templates Only", value: true },
            { label: "Regular Documents", value: false },
          ].map((filterItem) => (
            <button
              key={String(filterItem.value)}
              onClick={() => onSetFilterTemplate(filterItem.value)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterTemplate === filterItem.value
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-gray-600 hover:bg-slate-50"
              }`}
            >
              {filterItem.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
