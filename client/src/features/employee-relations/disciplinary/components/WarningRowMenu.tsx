import { memo } from "react";
import type { DisciplinaryRecord } from "../types";

interface WarningRowMenuProps {
  isOpen: boolean;
  onClose: () => void;
  record: DisciplinaryRecord;
  onView: (record: DisciplinaryRecord) => void;
  onEdit?: (record: DisciplinaryRecord) => void;
  onVoid?: (record: DisciplinaryRecord) => void;
  onDelete?: (record: DisciplinaryRecord) => void;
}

export const WarningRowMenu = memo(function WarningRowMenu({
  isOpen,
  onClose,
  record,
  onView,
  onEdit,
  onVoid,
  onDelete,
}: WarningRowMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-20 cursor-default"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className="absolute right-4 top-10 min-w-[245px] bg-white border border-slate-200/90 rounded-md shadow-lg py-1.5 z-30 animate-in fade-in text-left text-neutral-700 font-sans select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            onView(record);
          }}
          className="w-full px-3.5 py-2 text-[13px] text-neutral-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-normal transition-colors"
        >
          <i className="ri-eye-line text-base text-neutral-600 shrink-0" />
          <span>View this employee warning</span>
        </button>

        {onEdit && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(record);
            }}
            className="w-full px-3.5 py-2 text-[13px] text-neutral-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-normal transition-colors"
          >
            <i className="ri-edit-box-line text-base text-neutral-600 shrink-0" />
            <span>Edit this employee warning</span>
          </button>
        )}

        {onVoid && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onVoid(record);
            }}
            className="w-full px-3.5 py-2 text-[13px] text-neutral-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-normal transition-colors"
          >
            <i className="ri-file-reduce-line text-base text-neutral-600 shrink-0" />
            <span>Void this employee warning</span>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(record);
            }}
            className="w-full px-3.5 py-2 text-[13px] text-neutral-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-normal transition-colors"
          >
            <i className="ri-delete-bin-line text-base text-neutral-600 shrink-0" />
            <span>Delete this employee warning</span>
          </button>
        )}
      </div>
    </>
  );
});
