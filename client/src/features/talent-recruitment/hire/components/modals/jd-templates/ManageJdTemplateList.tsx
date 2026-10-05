import { memo } from "react";
import type { JobDescriptionTemplate } from "../../../types";

interface ManageJdTemplateListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  departments: string[];
  totalCount: number;
  filteredTemplates: JobDescriptionTemplate[];
  selectedTemplateId: string;
  isCreatingNew: boolean;
  onSelect: (id: string) => void;
  onEdit: (tpl: JobDescriptionTemplate) => void;
  onDeleteConfirm: (id: string) => void;
}

export const ManageJdTemplateList = memo(function ManageJdTemplateList({
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  departments,
  totalCount,
  filteredTemplates,
  selectedTemplateId,
  isCreatingNew,
  onSelect,
  onEdit,
  onDeleteConfirm,
}: ManageJdTemplateListProps) {
  return (
    <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/50">
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search template title, BU..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="all">All Departments ({totalCount})</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredTemplates.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <i className="ri-file-search-line text-3xl mb-2 text-slate-300 block" />
            <p className="text-xs font-semibold">No JD templates found</p>
            <p className="text-[11px] text-slate-400 mt-1">Try another search or create a new template.</p>
          </div>
        ) : (
          filteredTemplates.map((t) => {
            const isSelected = selectedTemplateId === t.id && !isCreatingNew;
            return (
              <div
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative group ${
                  isSelected
                    ? "bg-blue-50/70 border-blue-300 shadow-2xs"
                    : "bg-white hover:bg-slate-50 border-slate-200/80"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{t.title}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-0.5">
                      <span className="font-semibold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded">
                        {t.department || "General"}
                      </span>
                      {t.business_unit && <span className="truncate max-w-[120px]">• {t.business_unit}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(t);
                      }}
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-600 hover:text-blue-600 text-xs"
                      title="Edit template"
                    >
                      <i className="ri-edit-line" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConfirm(t.id);
                      }}
                      className="p-1 rounded-md hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-xs"
                      title="Delete template"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>{totalCount} total templates</span>
        <span className="font-semibold text-slate-700">Supabase synced</span>
      </div>
    </div>
  );
});
