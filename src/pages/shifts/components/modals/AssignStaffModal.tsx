import { memo } from "react";
import { toast } from "@/components/Toast";
import type { Shift, ShiftAssignment, Employee } from "../../types";
import { AssignStaffHeader } from "./AssignStaffHeader";
import { AssignStaffFiltersBar } from "./AssignStaffFiltersBar";
import { AssignStaffCard } from "./AssignStaffCard";
import { AssignSelectedStaffChips } from "./AssignSelectedStaffChips";
import { AssignStaffFooter } from "./AssignStaffFooter";

interface AssignStaffModalProps {
  show: boolean;
  onClose: () => void;
  selectedShift: Shift | null;
  selectedShiftAssignments: ShiftAssignment[];
  employees: Employee[];
  departments: string[];
  remainingSpots: number;
  assignEmployeeIds: string[];
  setAssignEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
  assignSearch: string;
  setAssignSearch: (q: string) => void;
  assignDeptFilter: string;
  setAssignDeptFilter: (d: string) => void;
  checkEmployeeConflict: (employeeId: string, shiftDate: string, excludeShiftId: string) => boolean;
  submitting: boolean;
  onAssign: (e: React.FormEvent) => Promise<void>;
  onOpenEditShift: (shift: Shift) => void;
}

export const AssignStaffModal = memo(function AssignStaffModal({
  show,
  onClose,
  selectedShift,
  selectedShiftAssignments,
  employees,
  departments,
  remainingSpots,
  assignEmployeeIds,
  setAssignEmployeeIds,
  assignSearch,
  setAssignSearch,
  assignDeptFilter,
  setAssignDeptFilter,
  checkEmployeeConflict,
  submitting,
  onAssign,
  onOpenEditShift,
}: AssignStaffModalProps) {
  if (!show || !selectedShift) return null;

  const excludeIds = selectedShiftAssignments.map((a) => a.employee_id);
  const available = employees.filter((emp) => !excludeIds.includes(emp.id));
  const filtered = available.filter((emp) => {
    if (assignDeptFilter !== "all" && emp.department !== assignDeptFilter) return false;
    if (!assignSearch.trim()) return true;
    const q = assignSearch.trim().toLowerCase();
    return `${emp.first_name} ${emp.last_name} ${emp.department} ${emp.role}`.toLowerCase().includes(q);
  });

  const isMaxSelected = assignEmployeeIds.length >= remainingSpots;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        <AssignStaffHeader
          selectedShift={selectedShift}
          selectedShiftAssignments={selectedShiftAssignments}
          assignEmployeeIds={assignEmployeeIds}
          remainingSpots={remainingSpots}
          onClose={onClose}
        />

        <div className="p-5 flex-1 overflow-y-auto overflow-x-hidden space-y-4">
          {remainingSpots <= 0 ? (
            <div className="p-8 text-center bg-emerald-50/70 border border-emerald-200/80 rounded-2xl my-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <i className="ri-shield-check-line text-2xl" />
              </div>
              <h3 className="text-base font-bold text-emerald-900">Shift is 100% Fully Staffed</h3>
              <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                All {selectedShift.capacity} required employee positions are already assigned to this shift.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEditShift(selectedShift);
                  }}
                  className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl hover:bg-[#1F336A] transition-colors cursor-pointer shadow-xs"
                >
                  Increase Shift Capacity
                </button>
              </div>
            </div>
          ) : (
            <>
              <AssignStaffFiltersBar
                assignSearch={assignSearch}
                setAssignSearch={setAssignSearch}
                assignDeptFilter={assignDeptFilter}
                setAssignDeptFilter={setAssignDeptFilter}
                departments={departments}
                totalEmployees={employees.length}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-1 text-slate-500">
                  <span className="font-semibold text-[11px]">{filtered.length} available staff</span>
                  {filtered.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (assignEmployeeIds.length === remainingSpots) setAssignEmployeeIds([]);
                        else setAssignEmployeeIds(filtered.map((e) => e.id).slice(0, remainingSpots));
                      }}
                      className="text-xs font-bold text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <i className="ri-magic-line text-xs" />
                      <span>{assignEmployeeIds.length === remainingSpots ? "Clear Selection" : `Auto-fill remaining ${remainingSpots} spot(s)`}</span>
                    </button>
                  )}
                </div>

                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <i className="ri-user-search-line text-3xl mb-1 block" />
                    <p className="text-xs font-semibold">No available employees found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[310px] overflow-y-auto overflow-x-hidden pr-1">
                    {filtered.map((emp) => {
                      const isChecked = assignEmployeeIds.includes(emp.id);
                      const hasConflict = checkEmployeeConflict(emp.id, selectedShift.shift_date, selectedShift.id);
                      const isSlotDisabled = !isChecked && isMaxSelected;

                      return (
                        <AssignStaffCard
                          key={emp.id}
                          emp={emp}
                          isChecked={isChecked}
                          hasConflict={hasConflict}
                          isSlotDisabled={isSlotDisabled}
                          onToggle={() => {
                            if (isSlotDisabled) {
                              toast("Capacity Reached", `You can only select up to ${remainingSpots} staff members. Deselect one first to swap.`, "info");
                              return;
                            }
                            if (isChecked) setAssignEmployeeIds(assignEmployeeIds.filter((id) => id !== emp.id));
                            else setAssignEmployeeIds([...assignEmployeeIds, emp.id]);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <AssignSelectedStaffChips
                assignEmployeeIds={assignEmployeeIds}
                remainingSpots={remainingSpots}
                employees={employees}
                onClearAll={() => setAssignEmployeeIds([])}
                onRemoveId={(id) => setAssignEmployeeIds(assignEmployeeIds.filter((x) => x !== id))}
              />
            </>
          )}
        </div>

        <AssignStaffFooter
          assignEmployeeIds={assignEmployeeIds}
          remainingSpots={remainingSpots}
          submitting={submitting}
          onClose={onClose}
          onAssign={onAssign}
        />
      </div>
    </div>
  );
});
