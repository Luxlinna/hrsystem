const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028];

interface HolidaysModalControlsProps {
  year: number;
  setYear: (year: number) => void;
  canManage: boolean;
  syncing: boolean;
  showAddForm: boolean;
  onSync: () => void;
  onToggleAddForm: () => void;
}

export function HolidaysModalControls({
  year,
  setYear,
  canManage,
  syncing,
  showAddForm,
  onSync,
  onToggleAddForm,
}: HolidaysModalControlsProps) {
  return (
    <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
      {/* Year selector pills */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-2xs">
        {AVAILABLE_YEARS.map((y) => (
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
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Sync official 21 Cambodia Labor Law holidays from API"
            >
              <i className={`ri-refresh-line text-xs ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : `Sync ${year} Holidays`}</span>
            </button>

            <button
              type="button"
              onClick={onToggleAddForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <i className={`ri-${showAddForm ? "subtract" : "add"}-line text-xs`} />
              <span>{showAddForm ? "Cancel" : "Add Holiday"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
