import { formatDate, calculateHours } from "../utils";
import { DAYS_SHORT, deptColors } from "../constants";
import type { Shift, ShiftAssignment, DensityMode } from "../types";

interface WeekViewProps {
  weekDates: Date[];
  getShiftsForDay: (date: Date) => Shift[];
  getDaySummary: (date: Date) => { count: number; totalHours: number };
  assignments: ShiftAssignment[];
  selectedShift: Shift | null;
  setSelectedShift: (s: Shift | null) => void;
  setShowAssignModal: (v: boolean) => void;
  openEditModal: (shift: Shift) => void;
  quickDuplicateToNextDay: (shift: Shift, e: React.MouseEvent) => void;
  openCreateModal: (date?: string) => void;
  density: DensityMode;
}

export function WeekView({
  weekDates, getShiftsForDay, getDaySummary, assignments,
  selectedShift, setSelectedShift, setShowAssignModal,
  openEditModal, quickDuplicateToNextDay, openCreateModal, density,
}: WeekViewProps) {
  return (
    <div className="bg-white border border-gray-200/90 rounded-xl overflow-x-auto shadow-2xs">
      <div className="min-w-[900px]">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/75 divide-x divide-gray-200">
          {weekDates.map((date, i) => {
            const isToday = formatDate(date) === formatDate(new Date());
            const summary = getDaySummary(date);
            return (
              <div key={i} className={`p-3 relative group transition-colors ${isToday ? "bg-[#253C7D]/8" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? "text-[#253C7D]" : "text-gray-500"}`}>
                      {DAYS_SHORT[i]}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[18px] font-extrabold ${isToday ? "text-[#253C7D]" : "text-gray-900"}`}>
                        {date.getDate()}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-[#253C7D] text-white rounded">Today</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openCreateModal(formatDate(date))}
                    title={`Add shift on ${formatDate(date)}`}
                    className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-500 hover:text-[#253C7D] hover:border-[#253C7D] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xs"
                  >
                    <i className="ri-add-line text-xs font-bold" />
                  </button>
                </div>
                <div className="mt-2 pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-500">
                  <span>{summary.count} shift{summary.count === 1 ? "" : "s"}</span>
                  <span className="font-bold text-gray-700">{summary.totalHours}h</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shift Cards Grid */}
        <div className="grid grid-cols-7 min-h-[380px] bg-slate-50/20 divide-x divide-gray-200">
          {weekDates.map((date, i) => {
            const dayShifts = getShiftsForDay(date);
            const isToday = formatDate(date) === formatDate(new Date());
            return (
              <div key={i} className={`p-2 space-y-2 flex flex-col ${isToday ? "bg-[#253C7D]/2" : ""}`}>
                {dayShifts.map((sh) => {
                  const aCount = sh.assignmentCount ?? 0;
                  const isFull = aCount >= sh.capacity;
                  const isSelected = selectedShift?.id === sh.id;
                  const shiftHours = calculateHours(sh.start_time, sh.end_time);
                  const shiftStaff = assignments.filter((a) => a.shift_id === sh.id);

                  return (
                    <div
                      key={sh.id}
                      onClick={() => setSelectedShift(isSelected ? null : sh)}
                      className={`group relative rounded-xl bg-white border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-md ${density === "compact" ? "p-2 space-y-1" : "p-2.5 space-y-1.5"} ${isSelected ? "ring-2 ring-offset-1 border-transparent shadow-sm" : "hover:border-gray-300"}`}
                      style={{
                        borderLeftWidth: "4px",
                        borderLeftColor: sh.color || "#253C7D",
                        ...(isSelected ? { "--tw-ring-color": sh.color || "#253C7D" } as any : {}),
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[12px] font-bold text-gray-900 leading-snug line-clamp-1">{sh.name}</p>
                        {sh.department && (
                          <span className="text-[9px] font-semibold px-1 py-0.2 rounded shrink-0 uppercase tracking-wider" style={{ backgroundColor: (deptColors[sh.department] || sh.color) + "18", color: deptColors[sh.department] || sh.color }}>
                            {sh.department}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <i className="ri-time-line text-gray-400" />
                          {sh.start_time?.slice(0, 5)} – {sh.end_time?.slice(0, 5)}
                        </span>
                        <span className="text-[9px] text-gray-400">({shiftHours}h)</span>
                      </div>

                      {sh.branches?.name && density !== "compact" && (
                        <p className="text-[9px] text-gray-400 truncate flex items-center gap-1">
                          <i className="ri-map-pin-line text-[9px] text-gray-400" />
                          <span className="truncate">{sh.branches.name}</span>
                        </p>
                      )}

                      <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {shiftStaff.slice(0, 3).map((a) => (
                            <span key={a.id} title={`${a.employee?.first_name} ${a.employee?.last_name}`} className="w-5 h-5 rounded-full border border-white bg-slate-200 text-[#253C7D] flex items-center justify-center text-[8px] font-bold overflow-hidden shadow-2xs">
                              {a.employee?.avatar_url ? (
                                <img src={a.employee.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                `${a.employee?.first_name?.[0] || ""}${a.employee?.last_name?.[0] || ""}`.toUpperCase()
                              )}
                            </span>
                          ))}
                          {shiftStaff.length > 3 && (
                            <span className="w-5 h-5 rounded-full border border-white bg-slate-100 text-gray-600 flex items-center justify-center text-[8px] font-bold">+{shiftStaff.length - 3}</span>
                          )}
                          {shiftStaff.length === 0 && <span className="text-[9px] text-gray-400 italic">No staff</span>}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${isFull ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : aCount === 0 ? "bg-rose-50 text-rose-600 font-semibold" : "bg-amber-50 text-amber-700 font-semibold"}`}>
                          {isFull ? <><i className="ri-check-line text-xs" /><span>Full</span></> : <span>{aCount}/{sh.capacity}</span>}
                        </span>
                      </div>

                      {/* Hover Toolbar */}
                      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-0.5 bg-white/95 backdrop-blur-xs p-0.5 rounded-md shadow-xs border border-gray-200">
                        {!isFull ? (
                          <button onClick={(e) => { e.stopPropagation(); setSelectedShift(sh); setShowAssignModal(true); }} title="Quick Assign Staff" className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#253C7D]/10 text-[#253C7D] cursor-pointer">
                            <i className="ri-user-add-line text-xs" />
                          </button>
                        ) : (
                          <span title="Shift is at maximum capacity" className="w-5 h-5 flex items-center justify-center rounded text-emerald-600 bg-emerald-50 cursor-default">
                            <i className="ri-lock-line text-xs" />
                          </span>
                        )}
                        <button onClick={(e) => quickDuplicateToNextDay(sh, e)} title="Duplicate to Next Day" className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 cursor-pointer">
                          <i className="ri-file-copy-line text-xs" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedShift(sh); openEditModal(sh); }} title="Edit Shift" className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 cursor-pointer">
                          <i className="ri-edit-line text-xs" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {dayShifts.length === 0 && (
                  <div onClick={() => openCreateModal(formatDate(date))} className="flex-1 min-h-[90px] rounded-lg border border-dashed border-gray-200 hover:border-[#253C7D]/50 hover:bg-[#253C7D]/2 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer group/cell">
                    <i className="ri-add-line text-gray-300 group-hover/cell:text-[#253C7D] text-base transition-colors" />
                    <span className="text-[10px] text-gray-400 group-hover/cell:text-gray-600 font-medium">Add Shift</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
