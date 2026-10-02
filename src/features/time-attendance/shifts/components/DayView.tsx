import { formatDate, calculateHours } from "../utils";
import type { Shift, ShiftAssignment } from "../types";

interface DayViewProps {
  currentDate: Date;
  dayShifts: Shift[];
  assignments: ShiftAssignment[];
  selectedShift: Shift | null;
  setSelectedShift: (s: Shift | null) => void;
  setShowAssignModal: (v: boolean) => void;
  openCreateModal: (date?: string) => void;
}

export function DayView({
  currentDate, dayShifts, assignments,
  selectedShift, setSelectedShift, setShowAssignModal, openCreateModal,
}: DayViewProps) {
  const totalAssigned = dayShifts.reduce((s, sh) => s + (sh.assignmentCount || 0), 0);
  const totalHours = dayShifts.reduce((s, sh) => s + calculateHours(sh.start_time, sh.end_time), 0);

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {dayShifts.length} shifts scheduled &middot; {totalAssigned} staff assigned &middot; {totalHours} total hours
          </p>
        </div>
        <button
          onClick={() => openCreateModal(formatDate(currentDate))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#253C7D] text-white text-xs font-semibold rounded-lg hover:bg-[#1F336A] transition-colors cursor-pointer"
        >
          <i className="ri-add-line" /> Add Shift Today
        </button>
      </div>

      {dayShifts.length === 0 ? (
        <div className="py-14 text-center text-gray-400">
          <i className="ri-calendar-event-line text-4xl mb-2 block" />
          <p className="text-sm font-semibold text-gray-700">No shifts scheduled for this day</p>
          <button onClick={() => openCreateModal(formatDate(currentDate))} className="mt-3 px-4 py-2 bg-[#253C7D] text-white text-xs font-semibold rounded-lg hover:bg-[#1F336A] transition-colors cursor-pointer">
            + Create Shift
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {dayShifts.map((sh) => {
            const shiftStaff = assignments.filter((a) => a.shift_id === sh.id);
            const isFull = (sh.assignmentCount || 0) >= sh.capacity;
            const isSelected = selectedShift?.id === sh.id;
            return (
              <div
                key={sh.id}
                onClick={() => setSelectedShift(isSelected ? null : sh)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? "ring-2 ring-[#253C7D] border-transparent bg-gray-50/60" : "border-gray-100 bg-white hover:border-gray-200"}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: sh.color || "#253C7D" }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{sh.name}</h4>
                        {sh.department && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{sh.department}</span>}
                        {sh.branches?.name && <span className="text-[11px] text-gray-400 flex items-center gap-1"><i className="ri-map-pin-line text-xs" /> {sh.branches.name}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{sh.start_time} – {sh.end_time} &middot; {calculateHours(sh.start_time, sh.end_time)} hrs duration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {shiftStaff.map((a) => (
                        <span key={a.id} title={`${a.employee?.first_name} ${a.employee?.last_name}`} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 text-[#253C7D] flex items-center justify-center text-[9px] font-bold overflow-hidden">
                          {a.employee?.avatar_url ? <img src={a.employee.avatar_url} alt="" className="w-full h-full object-cover" /> : `${a.employee?.first_name?.[0] || ""}${a.employee?.last_name?.[0] || ""}`.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${isFull ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {isFull ? "Fully Staffed" : `${sh.assignmentCount || 0}/${sh.capacity} Staffed`}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (isFull) return; setSelectedShift(sh); setShowAssignModal(true); }}
                      disabled={isFull}
                      title={isFull ? "Shift is full" : "Assign staff"}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isFull ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#253C7D]/10 hover:bg-[#253C7D]/20 text-[#253C7D] cursor-pointer"}`}
                    >
                      {isFull ? "Full" : "+ Assign"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
