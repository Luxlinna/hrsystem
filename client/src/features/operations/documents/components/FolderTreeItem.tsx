import { memo } from "react";
import type { DocumentFolder } from "../types";

interface FolderTreeItemProps {
  folder: DocumentFolder;
  folders: DocumentFolder[];
  activeCategory: string;
  expandedFolderIds: Set<string>;
  categoryCounts: Record<string, number>;
  canManageDocs: boolean;
  onSelectCategory: (categoryId: string) => void;
  onToggleExpanded: (folderId: string, e?: React.MouseEvent) => void;
  onOpenNewFolder: (parentId?: string) => void;
  onOpenEditFolder: (folder: DocumentFolder) => void;
  onDeleteFolder: (folder: DocumentFolder) => void;
}

export const FolderTreeItem = memo(function FolderTreeItem({
  folder: rf,
  folders,
  activeCategory,
  expandedFolderIds,
  categoryCounts,
  canManageDocs,
  onSelectCategory,
  onToggleExpanded,
  onOpenNewFolder,
  onOpenEditFolder,
  onDeleteFolder,
}: FolderTreeItemProps) {
  const isSelected = activeCategory === rf.id;
  const subfolders = folders.filter((f) => f.parent_id === rf.id);
  const isExpanded = expandedFolderIds.has(rf.id);
  const count = categoryCounts[rf.id] || 0;

  return (
    <div className="space-y-1">
      {/* Root Folder Row */}
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
          {canManageDocs && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                type="button"
                onClick={() => onOpenNewFolder(rf.id)}
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  isSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 text-[#253C7D]"
                }`}
                title={`Add Subfolder inside ${rf.label}`}
              >
                <i className="ri-folder-add-line text-xs" />
              </button>
              <button
                type="button"
                onClick={() => onOpenEditFolder(rf)}
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  isSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                }`}
                title="Edit Folder"
              >
                <i className="ri-edit-line text-xs" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteFolder(rf)}
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                  isSelected ? "hover:bg-white/20 text-white" : "hover:bg-rose-100 text-rose-500"
                }`}
                title="Delete Folder"
              >
                <i className="ri-delete-bin-line text-xs" />
              </button>
            </div>
          )}

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ml-1 ${
              isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Subfolder list */}
      {isExpanded && subfolders.length > 0 && (
        <div className="pl-6 space-y-1 border-l-2 border-gray-100 ml-4">
          {subfolders.map((sf) => {
            const isSubSelected = activeCategory === sf.id;
            const subCount = categoryCounts[sf.id] || 0;
            return (
              <div
                key={sf.id}
                onClick={() => onSelectCategory(sf.id)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSubSelected ? "bg-[#253C7D] text-white" : "text-gray-600 hover:text-gray-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    isSubSelected ? "bg-white/20 text-white" : `${sf.bg} ${sf.color}`
                  }`}>
                    <i className={sf.icon || "ri-folder-2-line"} />
                  </div>
                  <span className="truncate">{sf.label}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSubSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {subCount}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
