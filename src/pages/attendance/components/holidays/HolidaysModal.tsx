import { memo, useState, useMemo } from "react";
import type { Holiday } from "@/services/holidays/holidaysService";
import { toast } from "@/components/Toast";

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
  const [newDate, setNewDate] = useState("");
  const [newName, setNewName] = useState("");
  const [newKhName, setNewKhName] = useState("");
  const [newIsPaid, setNewIsPaid] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const availableYears = [2024, 2025, 2026, 2027, 2028];

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

  const handleSync = async () => {
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
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newName.trim()) {
      toast("Error", "Please provide date and holiday name", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await onAddHoliday({
        date: newDate,
        name: newName.trim(),
        local_name: newKhName.trim() || null,
        year: parseInt(newDate.substring(0, 4), 10) || year,
        is_paid: newIsPaid,
      });

      if (res.success) {
        toast("Success", "Custom holiday added successfully", "success");
        setShowAddForm(false);
        setNewDate("");
        setNewName("");
        setNewKhName("");
        setNewIsPaid(true);
      } else {
        toast("Error", res.error || "Failed to add holiday", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (h: Holiday) => {
    if (!confirm(`Are you sure you want to remove holiday: "${h.name}"?`)) return;
    const res = await onDeleteHoliday(h.id || h.date, year);
    if (res.success) {
      toast("Deleted", `Removed holiday: ${h.name}`, "info");
    } else {
      toast("Error", res.error || "Could not delete holiday", "error");
    }
  };

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

        {/* Action Controls & Filter */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          {/* Year selector pills */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-2xs">
            {availableYears.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  year === y
                    ? "bg-purple-600 text-white shadow-2xs"
                    : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Sync Button & Add Button */}
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Sync official 21 Cambodia Labor Law holidays from API"
                >
                  <i className={`ri-refresh-line text-xs ${syncing ? "animate-spin" : ""}`} />
                  <span>{syncing ? "Syncing..." : `Sync ${year} Holidays`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <i className={`ri-${showAddForm ? "subtract" : "add"}-line text-xs`} />
                  <span>{showAddForm ? "Cancel" : "Add Holiday"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Custom Holiday Form */}
        {showAddForm && (
          <form onSubmit={handleCreate} className="p-4 sm:p-5 bg-purple-50/40 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/40 animate-in slide-in-from-top duration-150">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-1.5">
              <i className="ri-add-circle-fill text-purple-600" />
              Add Custom Company Holiday / Compensatory Day
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Holiday Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Company Anniversary"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={newIsPaid}
                  onChange={(e) => setNewIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Paid Holiday (100% Salary, 2.0x OT if worked)</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Holiday"}
              </button>
            </div>
          </form>
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
            filteredHolidays.map((h) => {
              const dateObj = new Date(`${h.date}T00:00:00`);
              const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
              const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
              const dayNum = dateObj.getDate();

              return (
                <div
                  key={h.id || h.date}
                  className="bg-white dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 rounded-2xl p-3 sm:p-3.5 hover:border-purple-300 dark:hover:border-purple-800 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Date Block */}
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold uppercase leading-none">{monthName}</span>
                      <span className="text-base font-black leading-tight">{dayNum}</span>
                      <span className="text-[9px] font-semibold text-purple-500/80 leading-none">{dayName}</span>
                    </div>

                    {/* Names */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                          {h.name}
                        </h4>
                        {h.is_paid && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
                            Paid (100%)
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 shrink-0">
                          2.0x OT
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">
                        {h.date}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDelete(h)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center cursor-pointer shrink-0"
                      title="Remove holiday"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  )}
                </div>
              );
            })
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
