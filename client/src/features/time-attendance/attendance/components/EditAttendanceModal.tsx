import React, { memo } from "react";
import type { AttendanceRecord, WorkLocation } from "../types";
import { STATUS_CONFIG } from "../constants";

interface EditAttendanceModalProps {
  editingRecord: AttendanceRecord | null;
  setEditingRecord: React.Dispatch<React.SetStateAction<AttendanceRecord | null>>;
  workLocations: WorkLocation[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditAttendanceModal = memo(function EditAttendanceModal({
  editingRecord,
  setEditingRecord,
  workLocations,
  saving,
  onClose,
  onSubmit,
}: EditAttendanceModalProps) {
  if (!editingRecord) return null;

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
              <i className="ri-edit-line" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Edit Attendance Record</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {editingRecord.employees?.first_name} {editingRecord.employees?.last_name} · {editingRecord.date}
              </p>
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
              Status
            </label>
            <select
              value={editingRecord.status}
              onChange={(e) =>
                setEditingRecord({
                  ...editingRecord,
                  status: e.target.value as any,
                })
              }
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "present").map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Check In Time
              </label>
              <input
                type="time"
                value={editingRecord.clock_in || ""}
                onChange={(e) => setEditingRecord({ ...editingRecord, clock_in: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Check Out Time
              </label>
              <input
                type="time"
                value={editingRecord.clock_out || ""}
                onChange={(e) => setEditingRecord({ ...editingRecord, clock_out: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Lunch Out (Break Out)
              </label>
              <input
                type="time"
                value={editingRecord.break_out || ""}
                onChange={(e) => setEditingRecord({ ...editingRecord, break_out: e.target.value || null })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Lunch In (Break In)
              </label>
              <input
                type="time"
                value={editingRecord.break_in || ""}
                onChange={(e) => setEditingRecord({ ...editingRecord, break_in: e.target.value || null })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {editingRecord.status === "late" && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Minutes Late
              </label>
              <input
                type="number"
                min={0}
                value={editingRecord.late_minutes}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, late_minutes: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          )}

          {/* Work Site */}
          {workLocations.length > 0 && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                <i className="ri-building-2-line mr-1" />
                Work Site
              </label>
              <select
                value={editingRecord.work_location_id || ""}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, work_location_id: e.target.value || null })
                }
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="">— Not specified —</option>
                {workLocations.map((wl) => (
                  <option key={wl.id} value={wl.id}>
                    {wl.name}{wl.is_default ? " (Default)" : ""}{wl.work_start_time ? ` · ${wl.work_start_time.slice(0, 5)}–${wl.work_end_time ? wl.work_end_time.slice(0, 5) : ""}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              value={editingRecord.notes || ""}
              onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
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
              disabled={saving}
              className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
