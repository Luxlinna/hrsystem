import { useState, useMemo, memo } from "react";
import type { ManagedShift } from "./types";

interface ShiftsListViewProps {
  shifts: ManagedShift[];
  onCreateNew: () => void;
  onEdit: (shift: ManagedShift) => void;
  onDelete: (id: string) => void;
  onDuplicate: (shift: ManagedShift) => void;
  onNavigateToScheduleTemplates?: () => void;
  onNavigateToLateEarly?: () => void;
}

export const ShiftsListView = memo(function ShiftsListView({
  shifts,
  onCreateNew,
  onEdit,
  onDelete,
  onDuplicate,
  onNavigateToScheduleTemplates,
  onNavigateToLateEarly,
}: ShiftsListViewProps) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return shifts;
    const q = search.toLowerCase();
    return shifts.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.time_display.toLowerCase().includes(q)
    );
  }, [shifts, search]);

  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
            Shifts
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Configure working hours, shift codes, and break allowances.
          </p>
        </div>

        {/* Top Right Action: Shifts Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Shifts</span>
            <i className={`ri-arrow-down-s-line text-sm transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-40 text-xs animate-in fade-in-50 zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onCreateNew();
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2.5 font-bold cursor-pointer"
              >
                <i className="ri-add-circle-line text-emerald-600 text-base" />
                <span>Create New Shift</span>
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
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
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigateToScheduleTemplates?.();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2.5 font-medium cursor-pointer"
              >
                <i className="ri-calendar-schedule-line text-[#253C7D] dark:text-sky-400 text-sm" />
                <span>Schedule Templates</span>
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
              className="px-3.5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-r-xl cursor-pointer flex items-center justify-center"
            >
              <i className="ri-search-line text-sm" />
            </button>
          </div>

          <span className="text-xs text-gray-400 font-semibold hidden sm:inline">
            {filtered.length} {filtered.length === 1 ? "shift" : "shifts"}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-800/60 text-gray-500 dark:text-slate-400 font-bold border-b border-gray-200/80 dark:border-slate-800">
                <th className="py-3 px-4 w-12 text-center">No.</th>
                <th className="py-3 px-4 min-w-[120px]">Shift Code</th>
                <th className="py-3 px-4 min-w-[280px]">Shift Name</th>
                <th className="py-3 px-4 min-w-[220px]">Time</th>
                <th className="py-3 px-4 text-center w-24">Color</th>
                <th className="py-3 px-4 min-w-[140px]">Total Work Hours</th>
                <th className="py-3 px-4 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <i className="ri-calendar-event-line text-3xl mb-2 block" />
                    No shifts found
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-4 text-center font-bold text-gray-400">
                      {idx + 1}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-gray-900 dark:text-slate-100">
                      {s.code}
                    </td>

                    <td className="py-4 px-4 font-semibold text-gray-800 dark:text-slate-200">
                      {s.name}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-700 dark:text-slate-300">
                          {s.time_display}
                        </span>
                        {s.is_overnight && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60">
                            Overnight
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className="inline-block w-8 h-4 rounded shadow-2xs"
                        style={{ backgroundColor: s.color || "#253C7D" }}
                        title={s.color}
                      />
                    </td>

                    <td className="py-4 px-4 font-bold text-gray-900 dark:text-slate-100">
                      {s.total_work_hours} Hours
                    </td>

                    <td className="py-4 px-4 text-center relative">
                      <div className="inline-block relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActionMenuId(actionMenuId === s.id ? null : s.id)
                          }
                          className="w-7 h-7 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 hover:text-[#253C7D] dark:hover:text-sky-400 hover:border-[#253C7D] flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
                          title="Actions"
                        >
                          <i className="ri-settings-4-line text-sm" />
                        </button>

                        {actionMenuId === s.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActionMenuId(null);
                                onEdit(s);
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
                                onDuplicate(s);
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
                                onDelete(s.id);
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
