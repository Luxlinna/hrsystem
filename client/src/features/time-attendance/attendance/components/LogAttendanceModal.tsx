import React, { memo, useEffect } from "react";
import type { Employee, NewRecordForm, WorkLocation } from "../types";
import { STATUS_CONFIG } from "../constants";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";

interface LogAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  employees: Employee[];
  workLocations: WorkLocation[];
  myEmployee: Employee | null;
  newRecord: NewRecordForm;
  setNewRecord: React.Dispatch<React.SetStateAction<NewRecordForm>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const LogAttendanceModal = memo(function LogAttendanceModal({
  isOpen,
  onClose,
  canManage,
  employees,
  workLocations,
  myEmployee,
  newRecord,
  setNewRecord,
  saving,
  onSubmit,
}: LogAttendanceModalProps) {
  useEffect(() => {
    if (!newRecord.employee_id) return;
    const emp = employees.find((e) => e.id === newRecord.employee_id);
    const targetWlId = newRecord.work_location_id || emp?.default_work_location_id;
    const wl = workLocations.find((l) => l.id === targetWlId) || (workLocations.length > 0 ? (workLocations.find((l) => l.is_default) || workLocations[0]) : null);

    setNewRecord((p) => {
      const start = wl?.work_start_time ? wl.work_start_time.slice(0, 5) : p.clock_in || "08:00";
      const end = wl?.work_end_time ? wl.work_end_time.slice(0, 5) : p.clock_out || "17:00";
      const shouldUpdateTimes = !p.clock_in || p.clock_in === "08:00";
      return {
        ...p,
        work_location_id: p.work_location_id || wl?.id || "",
        clock_in: shouldUpdateTimes && wl?.work_start_time ? start : (p.clock_in || "08:00"),
        clock_out: shouldUpdateTimes && wl?.work_end_time ? end : (p.clock_out || "17:00"),
      };
    });
  }, [newRecord.employee_id, newRecord.work_location_id, employees, workLocations, setNewRecord]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
              <i className="ri-time-line" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Log Attendance Record</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Manually record or backdate an entry</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Employee <span className="text-rose-500">*</span>
            </label>
            {canManage ? (
              <EmployeeSearchSelect
                employees={employees}
                value={newRecord.employee_id}
                onChange={(id) => setNewRecord({ ...newRecord, employee_id: id })}
              />
            ) : (
              <div className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800">
                {myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name} — ${myEmployee.department}` : "—"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newRecord.date}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Status</label>
              <select
                value={newRecord.status}
                onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "present").map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Work Site */}
          {workLocations.length > 0 && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                <i className="ri-building-2-line mr-1" /> Work Site
              </label>
              <select
                value={newRecord.work_location_id}
                onChange={(e) => {
                  const wlId = e.target.value;
                  const wl = workLocations.find((l) => l.id === wlId);
                  const start = wl?.work_start_time ? wl.work_start_time.slice(0, 5) : newRecord.clock_in || "08:00";
                  const end = wl?.work_end_time ? wl.work_end_time.slice(0, 5) : newRecord.clock_out || "17:00";
                  setNewRecord({
                    ...newRecord,
                    work_location_id: wlId,
                    clock_in: wl?.work_start_time ? start : newRecord.clock_in,
                    clock_out: wl?.work_end_time ? end : newRecord.clock_out,
                  });
                }}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="">— Select work site —</option>
                {workLocations.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.name}{wl.is_default ? " (Default)" : ""}{wl.work_start_time ? ` · ${wl.work_start_time.slice(0, 5)}–${wl.work_end_time ? wl.work_end_time.slice(0, 5) : ""}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {newRecord.status !== "absent" && newRecord.status !== "holiday" && (
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Check In</label>
                <input
                  type="time"
                  value={newRecord.clock_in}
                  onChange={(e) => setNewRecord({ ...newRecord, clock_in: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Check Out</label>
                <input
                  type="time"
                  value={newRecord.clock_out}
                  onChange={(e) => setNewRecord({ ...newRecord, clock_out: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Notes / Reason</label>
            <input
              type="text"
              value={newRecord.notes}
              onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
              placeholder="e.g. Worked from home, Approved medical leave..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newRecord.employee_id || !newRecord.date}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? "Saving..." : "Record Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
