import { memo } from "react";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Employee, LeaveFormData } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { calculateDays, toYMD } from "../../dateUtils";

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  employees: Employee[];
  myEmployee: Employee | null;
  myApproverName: string;
  canManage: boolean;
  submitting: boolean;
  getRemaining: (empId: string, type: string) => number | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const LeaveRequestModal = memo(function LeaveRequestModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  employees,
  myEmployee,
  myApproverName,
  canManage,
  submitting,
  getRemaining,
  onSubmit,
}: LeaveRequestModalProps) {
  if (!isOpen) return null;

  const activeEmpId = formData.employee_id || myEmployee?.id || "";
  const requestedDays = calculateDays(formData.start_date, formData.end_date);
  const remainingDays = activeEmpId ? getRemaining(activeEmpId, formData.leave_type) : null;
  const isOverBalance = remainingDays !== null && requestedDays > remainingDays;

  const setDatePreset = (preset: "today" | "tomorrow" | "3days" | "thisWeek" | "nextWeek") => {
    const now = new Date();
    const s = new Date(now);
    const e = new Date(now);

    if (preset === "tomorrow") {
      s.setDate(s.getDate() + 1);
      e.setDate(e.getDate() + 1);
    } else if (preset === "3days") {
      e.setDate(e.getDate() + 2);
    } else if (preset === "thisWeek") {
      const day = s.getDay();
      const diff = s.getDate() - day + (day === 0 ? -6 : 1);
      s.setDate(diff);
      e.setDate(diff + 4);
    } else if (preset === "nextWeek") {
      const day = s.getDay();
      const diff = s.getDate() - day + (day === 0 ? 1 : 8);
      s.setDate(diff);
      e.setDate(diff + 4);
    }

    setFormData({
      ...formData,
      start_date: toYMD(s),
      end_date: toYMD(e),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Request Leave of Absence</h3>
            <p className="text-xs text-gray-400 mt-0.5">Submit a time off application for managerial approval</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Employee Picker for Admins / Managers */}
          {canManage && employees.length > 1 && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Request For Employee *
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

          {/* Date Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quick Presets</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Today", val: "today" as const },
                { label: "Tomorrow", val: "tomorrow" as const },
                { label: "3 Days", val: "3days" as const },
                { label: "This Week", val: "thisWeek" as const },
                { label: "Next Week", val: "nextWeek" as const },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDatePreset(p.val)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
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

          {/* Duration & Balance Notice */}
          {formData.start_date && formData.end_date && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                isOverBalance
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              <span>
                Total Duration: <strong className="font-extrabold">{requestedDays} working days</strong>
              </span>
              {remainingDays !== null && (
                <span>
                  {isOverBalance ? "Exceeds allowance" : `${remainingDays} days available`}
                </span>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Reason / Additional Details
            </label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide context for your manager regarding your leave request..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Manager Approver note */}
          {myApproverName && (
            <p className="text-[11px] text-gray-400">
              This request will be routed to <strong className="text-gray-700">{myApproverName}</strong> for decision.
            </p>
          )}

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
