import { memo } from "react";
import type { MovementAttachmentItem } from "./movementAttachmentTypes";

interface AttachmentItemRowProps {
  item: MovementAttachmentItem;
  onDelete: (id: string) => void;
}

export const AttachmentItemRow = memo(function AttachmentItemRow({
  item,
  onDelete,
}: AttachmentItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="shrink-0 text-slate-800 dark:text-slate-200">
        <div className="relative flex items-center justify-center w-6 h-7 border border-slate-700 dark:border-slate-300 rounded-[2px] bg-transparent">
          <span className="text-[7px] font-bold tracking-tighter text-slate-800 dark:text-slate-200">
            PDF
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 text-[13px] mb-1">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 truncate"
            title={item.name}
          >
            {item.name}
          </a>
        </div>

        <div className="w-full h-[3px] bg-[#5bb381] rounded-full" />
      </div>

      <span className="text-[13px] text-slate-800 dark:text-slate-200 shrink-0 font-medium ml-2">
        {item.sizeText}
      </span>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-xs px-1 cursor-pointer font-bold shrink-0 ml-1"
        title="Remove attachment"
      >
        X
      </button>
    </div>
  );
});
