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
    <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
      {/* Year selector pills */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-2xs">
        {AVAILABLE_YEARS.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
              year === y
                ? "bg-[#253C7D] text-white shadow-2xs"
                : "text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Sync Button & Add Button */}
      <div className="flex items-center gap-1.5">
        {canManage && (
          <>
            <button
              type="button"
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#253C7D] dark:text-blue-300 hover:bg-blue-100 text-[11px] sm:text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Sync official 21 Cambodia Labor Law holidays from API"
            >
              <i className={`ri-refresh-line text-xs ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : `Sync ${year}`}</span>
            </button>

            <button
              type="button"
              onClick={onToggleAddForm}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 text-[11px] sm:text-xs font-bold transition-all shadow-2xs cursor-pointer"
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
