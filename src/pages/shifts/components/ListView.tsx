import { calculateHours } from "../utils";
import type { Shift } from "../types";

interface ListViewProps {
  filteredShifts: Shift[];
  selectedShift: Shift | null;
  setSelectedShift: (s: Shift | null) => void;
  selectedShiftIds: string[];
  setSelectedShiftIds: (ids: string[]) => void;
  setShowAssignModal: (v: boolean) => void;
  openEditModal: (shift: Shift) => void;
}

export function ListView({
  filteredShifts, selectedShift, setSelectedShift,
  selectedShiftIds, setSelectedShiftIds,
  setShowAssignModal, openEditModal,
}: ListViewProps) {
  return (
    <div className="border border-gray-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
      <div className="grid grid-cols-12 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider items-center">
        <div className="col-span-1 flex items-center">
          <input
            type="checkbox"
            checked={filteredShifts.length > 0 && selectedShiftIds.length === filteredShifts.length}
            onChange={(e) => {
              if (e.target.checked) setSelectedShiftIds(filteredShifts.map((s) => s.id));
              else setSelectedShiftIds([]);
            }}
            className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
          />
        </div>
        <span className="col-span-3">Shift Name</span>
        <span className="col-span-2">Date & Time</span>
        <span className="col-span-2">Department</span>
        <span className="col-span-2">Branch</span>
        <span className="col-span-1">Staffing</span>
        <span className="col-span-1 text-right">Actions</span>
      </div>

      <div className="divide-y divide-gray-100">
        {filteredShifts.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <i className="ri-calendar-line text-4xl mb-2 block" />
            <p className="text-sm">No shifts found</p>
          </div>
        ) : (
          filteredShifts.map((sh) => {
            const aCount = sh.assignmentCount || 0;
            const isFull = aCount >= sh.capacity;
            const isSelected = selectedShift?.id === sh.id;
            const isChecked = selectedShiftIds.includes(sh.id);

            return (
              <div
                key={sh.id}
                onClick={() => setSelectedShift(isSelected ? null : sh)}
                className={`grid grid-cols-12 px-5 py-3.5 items-center hover:bg-[#253C7D]/5 transition-colors cursor-pointer ${isSelected || isChecked ? "bg-[#253C7D]/10" : ""}`}
              >
                <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedShiftIds([...selectedShiftIds, sh.id]);
                      else setSelectedShiftIds(selectedShiftIds.filter((id) => id !== sh.id));
                    }}
                    className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                  />
                </div>

                <div className="col-span-3 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sh.color || "#253C7D" }} />
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{sh.name}</p>
                    <p className="text-[11px] text-gray-400">{calculateHours(sh.start_time, sh.end_time)} hrs duration</p>
                  </div>
                </div>

                <div className="col-span-2 text-[12px] text-gray-700">
                  {sh.shift_date}
                  <span className="block text-[11px] text-gray-400">{sh.start_time?.slice(0, 5)} – {sh.end_time?.slice(0, 5)}</span>
                </div>

                <div className="col-span-2 text-[13px] text-gray-700">{sh.department || "—"}</div>
                <div className="col-span-2 text-[13px] text-gray-600">{sh.branches?.name || "All Branches"}</div>

                <div className="col-span-1">
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${isFull ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {isFull ? "Full" : `${aCount}/${sh.capacity}`}
                  </span>
                </div>

                <div className="col-span-1 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { if (isFull) return; setSelectedShift(sh); setShowAssignModal(true); }}
                    disabled={isFull}
                    className={`p-1.5 rounded-lg transition-colors ${isFull ? "opacity-30 cursor-not-allowed text-gray-400" : "hover:bg-gray-100 text-gray-600 hover:text-[#253C7D] cursor-pointer"}`}
                    title={isFull ? "Shift at capacity" : "Assign Staff"}
                  >
                    <i className="ri-user-add-line text-sm" />
                  </button>
                  <button
                    onClick={() => { setSelectedShift(sh); openEditModal(sh); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    title="Edit Shift"
                  >
                    <i className="ri-edit-line text-sm" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
