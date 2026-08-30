import { memo } from "react";
import type { Shift } from "../../types";

interface DuplicateShiftModalProps {
  show: boolean;
  onClose: () => void;
  selectedShift: Shift | null;
  duplicateDate: string;
  setDuplicateDate: (d: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const DuplicateShiftModal = memo(function DuplicateShiftModal({
  show,
  onClose,
  selectedShift,
  duplicateDate,
  setDuplicateDate,
  submitting,
  onSubmit,
}: DuplicateShiftModalProps) {
  if (!show || !selectedShift) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-900">Duplicate Shift</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-gray-500">
            Clone <span className="font-bold text-gray-800">{selectedShift.name}</span> to a new date:
          </p>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Target Date *</label>
            <input
              required
              type="date"
              value={duplicateDate}
              onChange={(e) => setDuplicateDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#253C7D] text-white text-xs font-semibold rounded-lg hover:bg-[#1F336A] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Duplicating..." : "Duplicate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
