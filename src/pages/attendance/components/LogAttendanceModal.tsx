import React, { memo } from "react";
import type { Employee, NewRecordForm } from "../types";
import { STATUS_CONFIG } from "../constants";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";

interface LogAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  employees: Employee[];
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
  myEmployee,
  newRecord,
  setNewRecord,
  saving,
  onSubmit,
}: LogAttendanceModalProps) {
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
                Date (Past or Present) <span className="text-rose-500">*</span>
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
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <select
                value={newRecord.status}
                onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {newRecord.status !== "absent" && newRecord.status !== "holiday" && (
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Check In Time
                </label>
                <input
                  type="time"
                  value={newRecord.clock_in}
                  onChange={(e) => setNewRecord({ ...newRecord, clock_in: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Check Out Time
                </label>
                <input
                  type="time"
                  value={newRecord.clock_out}
                  onChange={(e) => setNewRecord({ ...newRecord, clock_out: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>
          )}

          {newRecord.status === "late" && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Minutes Late
              </label>
              <input
                type="number"
                min={1}
                value={newRecord.late_minutes}
                onChange={(e) => setNewRecord({ ...newRecord, late_minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Notes / Reason
            </label>
            <textarea
              rows={2}
              value={newRecord.notes}
              onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
              placeholder="Optional supervisor notes, reason for late/remote..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newRecord.employee_id || !newRecord.date}
              className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
