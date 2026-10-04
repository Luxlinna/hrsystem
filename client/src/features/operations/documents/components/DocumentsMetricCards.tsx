import { memo } from "react";
import type { StatusFilter } from "../types";

interface DocumentsMetricCardsProps {
  activeDocsCount: number;
  rootFoldersCount: number;
  subfoldersCount: number;
  templatesCount: number;
  totalDownloads: number;
  archivedCount: number;
  statusFilter: StatusFilter;
  filterTemplate: boolean | null;
  onFilterActive: () => void;
  onFilterTemplates: () => void;
  onFilterArchived: () => void;
}

export const DocumentsMetricCards = memo(function DocumentsMetricCards({
  activeDocsCount,
  rootFoldersCount,
  subfoldersCount,
  templatesCount,
  totalDownloads,
  archivedCount,
  statusFilter,
  filterTemplate,
  onFilterActive,
  onFilterTemplates,
  onFilterArchived,
}: DocumentsMetricCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Active Documents */}
      <div
        onClick={onFilterActive}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          statusFilter === "active" && filterTemplate === null
            ? "border-[#253C7D] ring-2 ring-[#253C7D]/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active Files</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-file-text-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{activeDocsCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {rootFoldersCount} Folders · {subfoldersCount} Subfolders
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Templates */}
      <div
        onClick={onFilterTemplates}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterTemplate === true ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Templates</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-file-copy-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{templatesCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Ready for reuse</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Total Downloads */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Downloads</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-download-cloud-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{totalDownloads.toLocaleString()}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Staff distributions</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Archived Records */}
      <div
        onClick={onFilterArchived}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          statusFilter === "archived" ? "border-slate-500 ring-2 ring-slate-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Archived</span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <i className="ri-archive-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-700 mt-2">{archivedCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Historical records</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
      </div>
    </div>
  );
});
