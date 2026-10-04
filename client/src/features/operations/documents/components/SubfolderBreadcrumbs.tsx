import { memo } from "react";
import type { DocumentFolder } from "../types";

interface SubfolderBreadcrumbsProps {
  activeCategory: string;
  activeFolderObj: DocumentFolder | undefined;
  activeParentFolder: DocumentFolder | null;
  currentSubfolders: DocumentFolder[];
  categoryCounts: Record<string, number>;
  totalFiles: number;
  canManageDocs: boolean;
  onSelectCategory: (cat: string) => void;
  onOpenNewFolder: (parentId?: string) => void;
}

export const SubfolderBreadcrumbs = memo(function SubfolderBreadcrumbs({
  activeCategory,
  activeFolderObj,
  activeParentFolder,
  currentSubfolders,
  categoryCounts,
  totalFiles,
  canManageDocs,
  onSelectCategory,
  onOpenNewFolder,
}: SubfolderBreadcrumbsProps) {
  if (activeCategory === "all" || !activeFolderObj) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 flex-wrap">
          <button
            onClick={() => onSelectCategory("all")}
            className="hover:text-[#253C7D] transition-colors cursor-pointer flex items-center gap-1"
          >
            <i className="ri-folder-line" />
            All Documents
          </button>
          <i className="ri-arrow-right-s-line text-gray-300" />
          {activeFolderObj.parent_id && activeParentFolder && (
            <>
              <button
                onClick={() => onSelectCategory(activeParentFolder.id)}
                className="hover:text-[#253C7D] transition-colors cursor-pointer"
              >
                {activeParentFolder.label}
              </button>
              <i className="ri-arrow-right-s-line text-gray-300" />
            </>
          )}
          <span className="text-gray-900 font-extrabold flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${activeFolderObj.bg} ${activeFolderObj.color} border border-current inline-block`}
            />
            {activeFolderObj.label}
          </span>
          <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-extrabold">
            {totalFiles} files
          </span>
        </div>

        {canManageDocs && (
          <button
            onClick={() => onOpenNewFolder(activeFolderObj.parent_id || activeFolderObj.id)}
            className="text-xs font-bold text-[#253C7D] hover:bg-[#253C7D]/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <i className="ri-folder-add-line text-sm" />
            + New Subfolder
          </button>
        )}
      </div>

      {/* Subfolder chips / mini-cards */}
      {currentSubfolders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            Subfolders:
          </span>
          {currentSubfolders.map((sub) => {
            const isSubActive = activeCategory === sub.id;
            const count = categoryCounts[sub.id] || 0;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectCategory(sub.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isSubActive
                    ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                    : "bg-gray-50 hover:bg-slate-100 text-gray-700 border-gray-200/80"
                }`}
              >
                <i className={sub.icon || "ri-folder-2-line"} />
                <span>{sub.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSubActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
