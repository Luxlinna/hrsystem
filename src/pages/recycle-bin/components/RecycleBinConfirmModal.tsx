import { memo } from "react";
import type { BinItem } from "../types";

interface RecycleBinConfirmModalProps {
  confirming: BinItem | null;
  working: boolean;
  onCancel: () => void;
  onConfirm: (item: BinItem) => void;
}

export const RecycleBinConfirmModal = memo(function RecycleBinConfirmModal({
  confirming,
  working,
  onCancel,
  onConfirm,
}: RecycleBinConfirmModalProps) {
  if (!confirming) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permanent-delete-title"
      onMouseDown={() => !working && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
          <i className="ri-alert-line text-xl" />
        </div>
        <h2 id="permanent-delete-title" className="text-lg font-semibold text-gray-900">
          Delete forever?
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold text-gray-900">&ldquo;{confirming.label}&rdquo;</span>? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(confirming)}
            disabled={working}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <i className="ri-delete-bin-2-line" />
            {working ? "Deleting..." : "Delete forever"}
          </button>
        </div>
      </div>
    </div>
  );
});
