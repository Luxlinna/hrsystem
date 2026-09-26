import { useState, memo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { ContextMenuTarget } from "./ScheduleMatrixContextMenu";

interface CreateCellLeaveModalProps {
  target: ContextMenuTarget | null;
  formMode: "self" | "for_employee";
  onClose: () => void;
  onSaved?: () => void;
}

export const CreateCellLeaveModal = memo(function CreateCellLeaveModal({
  target,
  formMode,
  onClose,
  onSaved,
}: CreateCellLeaveModalProps) {
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState(target?.dateString || "");
  const [endDate, setEndDate] = useState(target?.dateString || "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast("Validation", "Please provide a reason for the leave", "error");
      return;
    }

    setSubmitting(true);
    try {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      const { error } = await supabase.from("leave_requests").insert([
        {
          employee_id: target.empId,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          days: diffDays,
          status: "pending",
          reason: reason.trim(),
        },
      ]);

      if (error) throw error;

      toast("Success", `Leave request created for ${target.empName}`, "success");
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast("Error", err.message || "Failed to create leave request", "error");
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
              <i className="ri-calendar-event-line text-blue-600" />
              <span>{formMode === "for_employee" ? "Create Leave Request For..." : "Create Leave Request"}</span>
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
            <label className="block font-bold text-gray-700 mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="annual">Annual Leave (AL)</option>
              <option value="sick">Sick Leave (SL)</option>
              <option value="special">Special Leave (SP)</option>
              <option value="maternity">Maternity Leave (ML)</option>
              <option value="paternity">Paternity Leave (PL)</option>
              <option value="unpaid">Unpaid Leave (UL)</option>
              <option value="bereavement">Bereavement (BL)</option>
              <option value="study">Study Leave (STL)</option>
            </select>
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
            <label className="block font-bold text-gray-700 mb-1">
              Reason / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide reason for this leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
              {submitting ? "Submitting..." : "Submit Leave Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
