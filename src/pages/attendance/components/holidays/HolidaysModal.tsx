import { memo, useState, useMemo, useCallback } from "react";
import type { Holiday } from "@/services/holidays/holidaysService";
import { toast } from "@/components/Toast";
import { HolidaysModalControls } from "./HolidaysModalControls";
import { AddHolidayForm } from "./AddHolidayForm";
import { HolidayCardItem } from "./HolidayCardItem";

interface HolidaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  setYear: (year: number) => void;
  holidays: Holiday[];
  loading: boolean;
  syncing: boolean;
  onSync: (year: number) => Promise<{ success: boolean; count: number; error?: string }>;
  onAddHoliday: (holiday: Omit<Holiday, "id" | "created_at">) => Promise<{ success: boolean; error?: string }>;
  onDeleteHoliday: (idOrDate: string, year: number) => Promise<{ success: boolean; error?: string }>;
  canManage: boolean;
}

export const HolidaysModal = memo(function HolidaysModal({
  isOpen,
  onClose,
  year,
  setYear,
  holidays,
  loading,
  syncing,
  onSync,
  onAddHoliday,
  onDeleteHoliday,
  canManage,
}: HolidaysModalProps) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredHolidays = useMemo(() => {
    if (!search.trim()) return holidays;
    const q = search.toLowerCase();
    return holidays.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (h.local_name && h.local_name.toLowerCase().includes(q)) ||
        h.date.includes(q)
    );
  }, [holidays, search]);

  const handleSync = useCallback(async () => {
    try {
      const res = await onSync(year);
      if (res.success) {
        toast("Holidays Synced", `Successfully loaded ${res.count} Cambodia Labor Law holidays for ${year}`, "success");
      } else {
        toast("Sync Warning", res.error || "Could not sync from remote API, fallback loaded", "warning");
      }
    } catch (err: any) {
      toast("Sync Error", err?.message || "Error syncing holidays", "error");
    }
  }, [onSync, year]);

  const handleDelete = useCallback(async (h: Holiday) => {
    if (!confirm(`Are you sure you want to remove holiday: "${h.name}"?`)) return;
    const res = await onDeleteHoliday(h.id || h.date, year);
    if (res.success) {
      toast("Deleted", `Removed holiday: ${h.name}`, "info");
    } else {
      toast("Error", res.error || "Could not delete holiday", "error");
    }
  }, [onDeleteHoliday, year]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-purple-50/50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/20 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-purple-500/20">
              <i className="ri-calendar-event-fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-slate-100">
                  Cambodia Public Holidays
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Labor Law Prakas
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Official paid public holidays under Cambodia Labor Law (Art. 161 & 139)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <HolidaysModalControls
          year={year}
          setYear={setYear}
          canManage={canManage}
          syncing={syncing}
          showAddForm={showAddForm}
          onSync={handleSync}
          onToggleAddForm={() => setShowAddForm((p) => !p)}
        />

        {showAddForm && (
          <AddHolidayForm
            year={year}
            onAddHoliday={onAddHoliday}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {/* Search bar & count */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-xs">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search holiday..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400 font-semibold">
            <span>{filteredHolidays.length} Holidays</span>
            <span className="text-gray-300 dark:text-slate-600">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Paid Off</span>
            <span className="text-gray-300 dark:text-slate-600">·</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">2.0x OT Rate</span>
          </div>
        </div>

        {/* Holidays List */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-2.5 flex-1">
          {loading && holidays.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading Cambodia holidays...</span>
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <i className="ri-calendar-close-line text-3xl text-gray-300 dark:text-slate-600 block mb-2" />
              No holidays found for {year}
            </div>
          ) : (
            filteredHolidays.map((h) => (
              <HolidayCardItem
                key={h.id || h.date}
                holiday={h}
                canManage={canManage}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Footer Notice */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900 text-[11px] text-gray-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <i className="ri-scales-3-line text-purple-600" />
            Cambodia Labor Law Art. 139: Working on public holidays grants 200% wage.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-gray-800 dark:text-slate-200 transition-colors cursor-pointer self-end"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
