import React from "react";
import type { WorkLog } from "./DailyReportEntryRow";

interface DailyReportModalProps {
  showModal: boolean;
  setShowModal: (b: boolean) => void;
  saving: boolean;
  editingLog: WorkLog | null;
  form: { log_date: string; start_time: string; end_time: string; activity: string; notes: string };
  setForm: React.Dispatch<React.SetStateAction<{ log_date: string; start_time: string; end_time: string; activity: string; notes: string }>>;
  handleSave: () => void;
  handleDelete: () => void;
}

export function DailyReportModal({
  showModal,
  setShowModal,
  saving,
  editingLog,
  form,
  setForm,
  handleSave,
  handleDelete,
}: DailyReportModalProps) {
  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4"
      onClick={() => !saving && setShowModal(false)}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-gray-900 mb-4">
          {editingLog ? "Edit Entry" : "Add Work Entry"}
        </h3>

        <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
          Date
        </label>
        <input
          type="date"
          value={form.log_date}
          onChange={(e) => setForm({ ...form, log_date: e.target.value })}
          className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              Start
            </label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              End
            </label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        </div>

        <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
          Work Activity
        </label>
        <input
          type="text"
          value={form.activity}
          onChange={(e) => setForm({ ...form, activity: e.target.value })}
          placeholder="e.g. Reviewed onboarding documents"
          className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
        />

        <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
          Notes
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          placeholder="Optional detail..."
          className="w-full mt-1 mb-4 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] resize-none"
        />

        <div className="flex gap-2">
          {editingLog && (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-[13px] font-semibold hover:bg-red-50 cursor-pointer"
            >
              <i className="ri-delete-bin-line" />
            </button>
          )}
          <button
            onClick={() => setShowModal(false)}
            disabled={saving}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#253C7D] text-white py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving..." : editingLog ? "Save Changes" : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
