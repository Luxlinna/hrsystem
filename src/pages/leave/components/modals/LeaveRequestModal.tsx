import { memo } from "react";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Employee, LeaveFormData } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { calculateDays } from "../../dateUtils";
import { LeaveRequestDateFields } from "./LeaveRequestDateFields";

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
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {canManage && employees.length > 1 && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Request For Employee *
              </label>
              <EmployeeSearchSelect
                employees={employees}
                value={formData.employee_id || myEmployee?.id || ""}
                onChange={(id) => setFormData((prev) => ({ ...prev, employee_id: id }))}
                placeholder="Search employee..."
              />
            </div>
          )}

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
                    onClick={() => setFormData((prev) => ({ ...prev, leave_type: t }))}
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

          <LeaveRequestDateFields
            formData={formData}
            setFormData={setFormData}
            requestedDays={requestedDays}
            remainingDays={remainingDays}
            isOverBalance={isOverBalance}
          />

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Reason / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Vacation with family, doctor appointment..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 flex items-center gap-2">
            <i className="ri-shield-user-line text-[#253C7D] text-base shrink-0" />
            <span>
              Approver: <strong className="text-gray-900">{myApproverName}</strong>
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isOverBalance}
              className="px-5 py-2 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1f336b] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
