import { memo } from "react";
import type { Shift } from "../../types";

interface DeleteShiftConfirmModalProps {
  show: boolean;
  onClose: () => void;
  selectedShift: Shift | null;
  submitting: boolean;
  onConfirm: () => Promise<void>;
}

export const DeleteShiftConfirmModal = memo(function DeleteShiftConfirmModal({
  show,
  onClose,
  selectedShift,
  submitting,
  onConfirm,
}: DeleteShiftConfirmModalProps) {
  if (!show || !selectedShift) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5">
        <h3 className="text-[15px] font-bold text-gray-900">Delete Shift?</h3>
        <p className="text-xs text-gray-500 mt-1.5">
          Are you sure you want to delete <span className="font-semibold text-gray-800">{selectedShift.name}</span>? Any assigned workers will be removed.
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Deleting..." : "Delete Shift"}
          </button>
        </div>
      </div>
    </div>
  );
});
