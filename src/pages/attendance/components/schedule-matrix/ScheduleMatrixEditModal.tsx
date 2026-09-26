import { useState, useMemo, memo } from "react";
import type { AvailableShiftItem } from "./types";
import { getShiftPillStyle } from "./shiftCodeStyles";

interface ScheduleMatrixEditModalProps {
  editingCell: {
    empId: string;
    empName: string;
    dateString: string;
    dayNumber: number;
    currentCode: string;
  } | null;
  availableShifts: AvailableShiftItem[];
  onClose: () => void;
  onSelectShift: (code: string) => void;
}

export const ScheduleMatrixEditModal = memo(function ScheduleMatrixEditModal({
  editingCell,
  availableShifts,
  onClose,
  onSelectShift,
}: ScheduleMatrixEditModalProps) {
  const [search, setSearch] = useState("");

  const filteredShifts = useMemo(() => {
    if (!search.trim()) return availableShifts;
    const q = search.toLowerCase();
    return availableShifts.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.timeDisplay.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q)
    );
  }, [availableShifts, search]);

  if (!editingCell) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Change Day Shift</h4>
            <p className="text-[11px] text-gray-500">
              {editingCell.empName} · Day {editingCell.dayNumber} ({editingCell.dateString})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-base cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {availableShifts.length > 5 && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search shift code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 pl-8 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          </div>
        )}

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Select Shift Code ({filteredShifts.length})
          </p>

          {filteredShifts.map((opt) => {
            const isSelected =
              editingCell.currentCode === opt.code ||
              editingCell.currentCode.endsWith(`_${opt.code}`);
            const pillStyle = getShiftPillStyle(opt.code, false);

            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => onSelectShift(opt.code)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/70 text-blue-900 shadow-xs"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${pillStyle.bg} ${pillStyle.text}`}
                  >
                    {opt.code}
                  </span>
                  <div className="flex flex-col text-left truncate">
                    <span className="font-semibold text-gray-900 text-xs truncate">
                      {opt.code === "OFF" ? "OFF - Day Off" : opt.name}
                    </span>
                    <span className="text-[10px] text-gray-500 truncate">
                      {opt.timeDisplay}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <i className="ri-check-line text-blue-600 font-bold text-sm shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});
