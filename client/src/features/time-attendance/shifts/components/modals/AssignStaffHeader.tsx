import { memo } from "react";
import type { Shift, ShiftAssignment } from "../../types";
import { calculateHours } from "../../utils";

interface AssignStaffHeaderProps {
  selectedShift: Shift;
  selectedShiftAssignments: ShiftAssignment[];
  assignEmployeeIds: string[];
  remainingSpots: number;
  onClose: () => void;
}

export const AssignStaffHeader = memo(function AssignStaffHeader({
  selectedShift,
  selectedShiftAssignments,
  assignEmployeeIds,
  remainingSpots,
  onClose,
}: AssignStaffHeaderProps) {
  return (
    <div
      className="p-5 text-white relative overflow-hidden shrink-0"
      style={{ background: `linear-gradient(135deg, ${selectedShift.color || "#253C7D"}ee, #1E293B)` }}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-white/20 text-white backdrop-blur-xs">
              {selectedShift.department || "Operations"}
            </span>
            {selectedShift.branches?.name && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-black/20 text-white/90 flex items-center gap-1">
                <i className="ri-map-pin-2-fill text-[10px] text-amber-300" />
                {selectedShift.branches.name}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 truncate">Assign Staff &bull; {selectedShift.name}</h2>
          <p className="text-xs text-white/80 mt-0.5 flex items-center gap-2">
            <span>{new Date(selectedShift.shift_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            <span>&middot;</span>
            <span>{selectedShift.start_time?.slice(0, 5)} – {selectedShift.end_time?.slice(0, 5)}</span>
            <span>&middot;</span>
            <span>{calculateHours(selectedShift.start_time, selectedShift.end_time)} hrs</span>
          </p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0">
          <i className="ri-close-line text-lg" />
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center font-black text-sm text-white shadow-inner">
            {selectedShiftAssignments.length + assignEmployeeIds.length}/{selectedShift.capacity}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-white/70 block">Target Staffing</span>
            <span className="text-xs font-bold text-white">
              {remainingSpots - assignEmployeeIds.length === 0 ? (
                <span className="text-emerald-300 flex items-center gap-1"><i className="ri-checkbox-circle-fill text-xs" /> Capacity full ({selectedShift.capacity} staff)</span>
              ) : (
                <span className="text-amber-200">{remainingSpots - assignEmployeeIds.length} open spot(s) remaining</span>
              )}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold text-white/70 block">Selection</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[#253C7D] shadow-xs inline-block">
            {assignEmployeeIds.length} of {remainingSpots} selected
          </span>
        </div>
      </div>
    </div>
  );
});
