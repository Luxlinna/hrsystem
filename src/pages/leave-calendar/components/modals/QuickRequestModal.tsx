import { memo } from "react";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Employee, LeaveFormData } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { calculateDays } from "../../dateUtils";

interface QuickRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  employees: Employee[];
  myEmployee: Employee | null;
  canManage: boolean;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
}

export const QuickRequestModal = memo(function QuickRequestModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  employees,
  myEmployee,
  canManage,
  submitting,
  onSubmit,
}: QuickRequestModalProps) {
  if (!isOpen) return null;

  const requestedDays = calculateDays(formData.start_date, formData.end_date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Schedule Leave Request</h3>
            <p className="text-xs text-gray-400 mt-0.5">Quickly book time off on the team availability calendar</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Employee Picker */}
          {canManage && employees.length > 1 && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Select Employee *
              </label>
              <EmployeeSearchSelect
                employees={employees}
                value={formData.employee_id || myEmployee?.id || ""}
                onChange={(id) => setFormData({ ...formData, employee_id: id })}
                placeholder="Search employee..."
              />
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Leave Type Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.keys(LEAVE_TYPE_CONFIG).map((t) => {
                const cfg = LEAVE_TYPE_CONFIG[t];
                const isSelected = formData.leave_type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, leave_type: t })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <i className={`${cfg.icon} text-sm ${isSelected ? "text-white" : cfg.text}`} />
                    <span className="text-xs font-bold truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start & End Dates */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
              />
            </div>
          </div>

          {/* Working Days Duration Banner */}
          {formData.start_date && formData.end_date && (
            <div className="p-3 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <span>Working Days:</span>
              <strong className="font-extrabold">{requestedDays} working days</strong>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Reason / Additional Context
            </label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide a brief explanation for time off request..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Bottom Actions */}
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
              {submitting ? "Submitting..." : "Submit Leave Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
