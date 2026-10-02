interface BulkActionBarProps {
  count: number;
  onBulkDelete: () => void;
  onDeselect: () => void;
}

export function BulkActionBar({ count, onBulkDelete, onDeselect }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="mb-4 p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top duration-150">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
          {count}
        </span>
        <span className="text-xs font-semibold">shift(s) selected</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onBulkDelete}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
        >
          <i className="ri-delete-bin-line text-xs" /> Delete Selected
        </button>
        <button
          onClick={onDeselect}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          Deselect All
        </button>
      </div>
    </div>
  );
}
