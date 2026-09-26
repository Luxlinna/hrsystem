import { useState, useMemo, memo } from "react";
import type { ScheduleTemplate } from "./types";

interface ScheduleTemplatesViewProps {
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
}: ScheduleTemplatesViewProps) {
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

  const daysHeader = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" },
    { key: "sun", label: "Sun" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
            Schedule Templates
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Configure weekly recurring shift templates and assign staff to schedules.
          </p>
        </div>

        {/* Top Right Actions: Schedule Templates Dropdown */}
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
                onClick={() => {
                  setMenuOpen(false);
                  onCreateNew();
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2.5 font-bold cursor-pointer"
              >
                <i className="ri-add-circle-line text-emerald-600 text-base" />
                <span>Create New Schedule Templates</span>
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigateToShifts?.();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2.5 font-medium cursor-pointer"
              >
                <i className="ri-calendar-schedule-line text-[#253C7D] dark:text-sky-400 text-sm" />
                <span>Shifts</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigateToLateEarly?.();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2.5 font-medium cursor-pointer"
              >
                <i className="ri-time-line text-amber-500 text-sm" />
                <span>Late &amp; Early</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Search Bar */}
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

        {/* Table */}
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
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4 text-center font-bold text-gray-400">
                      {idx + 1}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900 dark:text-slate-100">
                        {item.title}
                      </div>
                      {item.site_name && (
                        <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">
                          Site: {item.site_name}
                        </span>
                      )}
                    </td>

                    {/* Schedule Template Info Days Matrix */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center">
                        {/* Day Badges */}
                        <div className="grid grid-cols-7 gap-1 w-full max-w-[280px]">
                          {daysHeader.map((d) => (
                            <div
                              key={d.key}
                              className="text-center py-0.5 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10px] font-bold rounded"
                            >
                              {d.label}
                            </div>
                          ))}
                        </div>

                        {/* Shift Code Values */}
                        <div className="grid grid-cols-7 gap-1 w-full max-w-[280px] mt-1">
                          {daysHeader.map((d) => {
                            const val = item.days[d.key] || "OFF";
                            const isOff = val.toUpperCase() === "OFF";
                            return (
                              <div
                                key={d.key}
                                className={`text-center py-1 text-[10px] font-mono font-bold rounded border ${
                                  isOff
                                    ? "bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-800 dark:border-slate-700"
                                    : "bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 shadow-2xs"
                                }`}
                                title={`${d.label}: ${val}`}
                              >
                                {val}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center font-bold text-gray-800 dark:text-slate-200">
                      {item.total_employee}
                    </td>

                    <td className="py-4 px-4 text-gray-600 dark:text-slate-300 text-xs">
                      {item.remark || "—"}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          item.status === "Active"
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-400 text-white"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center relative">
                      <div className="inline-block relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActionMenuId(actionMenuId === item.id ? null : item.id)
                          }
                          className="w-7 h-7 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 hover:text-[#253C7D] dark:hover:text-sky-400 hover:border-[#253C7D] flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
                          title="Actions"
                        >
                          <i className="ri-settings-4-line text-sm" />
                        </button>

                        {actionMenuId === item.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActionMenuId(null);
                                onEdit(item);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <i className="ri-edit-line text-blue-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActionMenuId(null);
                                onToggleStatus(item.id);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <i className="ri-toggle-line text-amber-600" />
                              <span>
                                {item.status === "Active" ? "Disable" : "Activate"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActionMenuId(null);
                                onDuplicate(item);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <i className="ri-file-copy-line text-indigo-600" />
                              <span>Duplicate</span>
                            </button>
                            <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
                            <button
                              type="button"
                              onClick={() => {
                                setActionMenuId(null);
                                onDelete(item.id);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <i className="ri-delete-bin-line" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
