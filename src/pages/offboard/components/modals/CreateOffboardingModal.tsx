import { memo } from "react";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { EmployeeOption, CreateOffboardingForm } from "../../types";
import { EXIT_REASONS } from "../../constants";

interface CreateOffboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  newForm: CreateOffboardingForm;
  setNewForm: React.Dispatch<React.SetStateAction<CreateOffboardingForm>>;
  employees: EmployeeOption[];
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const CreateOffboardingModal = memo(function CreateOffboardingModal({
  isOpen,
  onClose,
  newForm,
  setNewForm,
  employees,
  submitting,
  onSubmit,
}: CreateOffboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Initiate Employee Offboarding</h3>
            <p className="text-xs text-gray-400 mt-0.5">Start formal exit procedure and clearance workflow</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Departing Employee */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Select Departing Employee *
            </label>
            <EmployeeSearchSelect
              employees={employees}
              value={newForm.employee_id}
              onChange={(id) => setNewForm({ ...newForm, employee_id: id })}
              placeholder="Search employee by name, role, department..."
            />
          </div>

          {/* Last Working Day */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Effective Last Working Day *
            </label>
            <input
              type="date"
              required
              value={newForm.last_day}
              onChange={(e) => setNewForm({ ...newForm, last_day: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
            />
          </div>

          {/* Departure Reason */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Reason for Departure *
            </label>
            <select
              value={newForm.reason}
              onChange={(e) => setNewForm({ ...newForm, reason: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer"
            >
              {EXIT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Internal Notes / Handover Instructions
            </label>
            <textarea
              rows={3}
              value={newForm.notes}
              onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
              placeholder="Optional notes for HR, IT, and Finance teams regarding this departure..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Default Tasks Option */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-gray-800">Generate Standard Exit Checklist</p>
              <p className="text-[11px] text-gray-400">
                Automatically create 5 standard IT, HR, and Finance clearance tasks.
              </p>
            </div>
            <input
              type="checkbox"
              checked={newForm.includeDefaultTasks}
              onChange={(e) => setNewForm({ ...newForm, includeDefaultTasks: e.target.checked })}
              className="rounded text-[#253C7D] cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Initiating..." : "Start Offboarding Procedure"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
