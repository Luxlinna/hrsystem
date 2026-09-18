import type { OvertimeTypeEntry } from "./OvertimeTypeForm";

interface OvertimeTypeRowProps {
  item: OvertimeTypeEntry;
  index: number;
  canManage: boolean;
  isEditing: boolean;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function OvertimeTypeRow({
  item: t,
  index: i,
  canManage,
  isEditing,
  onEdit,
  onDelete,
}: OvertimeTypeRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60 group">
      <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 dark:bg-sky-950/50 flex items-center justify-center shrink-0">
        <i className="ri-timer-line text-xs text-[#253C7D] dark:text-sky-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{t.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">{t.code}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{t.rate}x</span>
          {t.remark && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
              <span className="text-[10px] text-gray-400 italic truncate max-w-[120px]">{t.remark}</span>
            </>
          )}
        </div>
      </div>
      {canManage && !isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(i)}
            className="p-1.5 hover:bg-[#253C7D]/10 text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 rounded-lg cursor-pointer transition-colors"
            title="Edit"
          >
            <i className="ri-pencil-line text-xs" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(i)}
            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
            title="Delete"
          >
            <i className="ri-delete-bin-line text-xs" />
          </button>
        </div>
      )}
    </div>
  );
}
