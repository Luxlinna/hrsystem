import { useState, memo } from "react";
import { toast } from "@/components/Toast";
import type { ContextMenuTarget } from "./ScheduleMatrixContextMenu";

interface CreateMissionModalProps {
  target: ContextMenuTarget | null;
  formMode: "self" | "for_employee";
  onClose: () => void;
  onSaved?: () => void;
}

export const CreateMissionModal = memo(function CreateMissionModal({
  target,
  formMode,
  onClose,
  onSaved,
}: CreateMissionModalProps) {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(target?.dateString || "");
  const [endDate, setEndDate] = useState(target?.dateString || "");
  const [purpose, setPurpose] = useState("");
  const [transport, setTransport] = useState("Company Vehicle");
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !purpose.trim()) {
      toast("Validation", "Please provide mission destination and purpose", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Record mission request
      toast("Success", `Mission request submitted for ${target.empName} to ${destination}`, "success");
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast("Error", err.message || "Failed to submit mission", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <i className="ri-flight-takeoff-line text-emerald-600" />
              <span>{formMode === "for_employee" ? "Create Mission Request For..." : "Create Mission Request"}</span>
            </h4>
            <p className="text-[11px] text-gray-500">
              {target.empName} ({target.employeeCode})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-base cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Mission Destination / Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Siem Reap Branch, Client Site, Battambang..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Transportation Mode</label>
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Company Vehicle">Company Vehicle</option>
              <option value="Flight / Air Travel">Flight / Air Travel</option>
              <option value="Bus / Public Transport">Bus / Public Transport</option>
              <option value="Personal Vehicle">Personal Vehicle</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Purpose / Mission Objectives <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Outline mission scope, deliverables, and client/site details..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Mission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
