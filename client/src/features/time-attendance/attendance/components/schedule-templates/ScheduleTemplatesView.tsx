import { useState, useMemo, memo } from "react";
import type { ScheduleTemplate } from "./types";
import { ScheduleTemplateTableRow } from "./ScheduleTemplateTableRow";

interface Props {
  templates: ScheduleTemplate[];
  onCreateNew: () => void;
  onEdit: (template: ScheduleTemplate) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDuplicate: (template: ScheduleTemplate) => void;
  onNavigateToShifts?: () => void;
  onNavigateToLateEarly?: () => void;
}

export const ScheduleTemplatesView = memo(function ScheduleTemplatesView({
  templates,
  onCreateNew,
  onEdit,
  onDelete,
  onToggleStatus,
  onDuplicate,
  onNavigateToShifts,
  onNavigateToLateEarly,
}: Props) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.remark && t.remark.toLowerCase().includes(q)) ||
        (t.site_name && t.site_name.toLowerCase().includes(q)) ||
        Object.values(t.days).some((d) => d.toLowerCase().includes(q))
    );
  }, [templates, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
            Schedule Templates
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Configure weekly recurring shift templates and assign staff to schedules.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Schedule Templates</span>
            <i className={`ri-arrow-down-s-line text-sm transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-40 text-xs animate-in fade-in-50 zoom-in-95">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onCreateNew(); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2.5 font-bold cursor-pointer"
              >
                <i className="ri-add-circle-line text-emerald-600 text-base" />
                <span>Create New Schedule Templates</span>
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onNavigateToShifts?.(); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2.5 font-medium cursor-pointer"
              >
                <i className="ri-calendar-schedule-line text-[#253C7D] dark:text-sky-400 text-sm" />
                <span>Shifts</span>
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onNavigateToLateEarly?.(); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2.5 font-medium cursor-pointer"
              >
                <i className="ri-time-line text-amber-500 text-sm" />
                <span>Late &amp; Early</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-l-xl focus:bg-white focus:outline-none focus:border-[#253C7D] text-gray-800 dark:text-slate-100"
            />
            <button
              type="button"
              className="px-3.5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-r-xl cursor-pointer flex items-center justify-center transition-colors"
              title="Search"
            >
              <i className="ri-search-line text-sm" />
            </button>
          </div>
          <span className="text-xs text-gray-400 font-semibold hidden sm:inline">
            {filtered.length} {filtered.length === 1 ? "template" : "templates"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-800/60 text-gray-500 dark:text-slate-400 font-bold border-b border-gray-200/80 dark:border-slate-800">
                <th className="py-3 px-4 w-12 text-center">No.</th>
                <th className="py-3 px-4 min-w-[240px]">Title</th>
                <th className="py-3 px-4 min-w-[320px] text-center">Schedule Template Info</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Total Employee</th>
                <th className="py-3 px-4 min-w-[180px]">Remark</th>
                <th className="py-3 px-4 text-center min-w-[100px]">Status</th>
                <th className="py-3 px-4 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <i className="ri-calendar-line text-3xl mb-2 block" />
                    No schedule templates found
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <ScheduleTemplateTableRow
                    key={item.id}
                    item={item}
                    idx={idx}
                    actionMenuId={actionMenuId}
                    setActionMenuId={setActionMenuId}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
