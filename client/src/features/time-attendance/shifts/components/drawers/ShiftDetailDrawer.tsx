import { memo } from "react";
import type { Shift, ShiftAssignment } from "../../types";
import { calculateHours } from "../../utils";

interface ShiftDetailDrawerProps {
  selectedShift: Shift | null;
  onClose: () => void;
  onOpenEdit: (shift: Shift) => void;
  onOpenDuplicate: (shift: Shift) => void;
  onOpenDeleteConfirm: () => void;
  onOpenAssign: () => void;
  selectedShiftAssignments: ShiftAssignment[];
  remainingSpots: number;
  isSelectedShiftFull: boolean;
  checkEmployeeConflict: (employeeId: string, shiftDate: string, excludeShiftId: string) => boolean;
  removeAssignment: (assignId: string) => void;
}

export const ShiftDetailDrawer = memo(function ShiftDetailDrawer({
  selectedShift,
  onClose,
  onOpenEdit,
  onOpenDuplicate,
  onOpenDeleteConfirm,
  onOpenAssign,
  selectedShiftAssignments,
  remainingSpots,
  isSelectedShiftFull,
  checkEmployeeConflict,
  removeAssignment,
}: ShiftDetailDrawerProps) {
  if (!selectedShift) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] lg:w-[400px] bg-white border-l border-gray-100 overflow-y-auto z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      <div className="p-5 border-b border-gray-100" style={{ backgroundColor: (selectedShift.color || "#253C7D") + "15" }}>
        <div className="flex items-start justify-between">
          <div>
            <span
              className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md"
              style={{
                backgroundColor: (selectedShift.color || "#253C7D") + "25",
                color: selectedShift.color || "#253C7D",
              }}
            >
              {selectedShift.department || "Operations"}
            </span>
            <h3 className="text-[16px] font-bold text-gray-900 mt-1">{selectedShift.name}</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {new Date(selectedShift.shift_date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 cursor-pointer text-gray-500">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenEdit(selectedShift)}
              className="px-2.5 py-1 text-xs font-semibold bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-edit-line text-xs" /> Edit
            </button>
            <button
              onClick={() => onOpenDuplicate(selectedShift)}
              className="px-2.5 py-1 text-xs font-semibold bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-file-copy-line text-xs" /> Duplicate
            </button>
          </div>
          <button
            onClick={onOpenDeleteConfirm}
            className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <i className="ri-delete-bin-line text-xs" /> Delete
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400">Time</p>
            <p className="text-[12px] font-bold text-gray-800 mt-0.5">
              {selectedShift.start_time?.slice(0, 5)} – {selectedShift.end_time?.slice(0, 5)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400">Capacity</p>
            <p className="text-[12px] font-bold mt-0.5" style={{ color: isSelectedShiftFull ? "#059669" : selectedShift.color || "#253C7D" }}>
              {selectedShiftAssignments.length} / {selectedShift.capacity} {isSelectedShiftFull ? "(Full)" : "Staffed"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400">Branch</p>
            <p className="text-[12px] font-semibold text-gray-800 mt-0.5 truncate">{selectedShift.branches?.name || "All Branches"}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400">Department</p>
            <p className="text-[12px] font-semibold text-gray-800 mt-0.5 truncate">{selectedShift.department || "Operations"}</p>
          </div>
        </div>

        {selectedShift.notes && (
          <div className="mt-2.5 bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-0.5">Notes</p>
            <p className="text-[12px] text-gray-600 whitespace-pre-wrap">{selectedShift.notes}</p>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
              Assigned Employees ({selectedShiftAssignments.length}/{selectedShift.capacity})
            </h4>
            <p className="text-[11px] text-gray-400">
              {isSelectedShiftFull ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <i className="ri-checkbox-circle-fill text-xs" /> Maximum capacity reached
                </span>
              ) : (
                <span>{remainingSpots} spot(s) remaining</span>
              )}
            </p>
          </div>

          <button
            onClick={onOpenAssign}
            disabled={isSelectedShiftFull}
            title={isSelectedShiftFull ? "Shift is at full capacity" : "Assign employees"}
            className="text-[12px] text-[#253C7D] font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline cursor-pointer flex items-center gap-1"
          >
            <i className={isSelectedShiftFull ? "ri-lock-line text-xs" : "ri-user-add-line text-xs"} />
            <span>{isSelectedShiftFull ? "Full" : "+ Assign Staff"}</span>
          </button>
        </div>

        {selectedShiftAssignments.length === 0 ? (
          <div className="text-center py-10">
            <i className="ri-user-add-line text-3xl text-gray-200" />
            <p className="text-[13px] text-gray-400 mt-2">No employees assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedShiftAssignments.map((a) => {
              const hasConflict = checkEmployeeConflict(a.employee_id, selectedShift.shift_date, selectedShift.id);
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                    {a.employee?.avatar_url ? (
                      <img src={a.employee.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      `${a.employee?.first_name?.[0] || ""}${a.employee?.last_name?.[0] || ""}`.toUpperCase()
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{a.employee?.first_name} {a.employee?.last_name}</p>
                      {hasConflict && (
                        <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[8px] font-bold rounded">Conflict</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{a.employee?.role || "Staff"}</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium capitalize">
                    {a.status || "scheduled"}
                  </span>
                  <button
                    onClick={() => removeAssignment(a.id)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove from shift"
                  >
                    <i className="ri-close-line text-xs" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
