import { memo } from "react";
import type { Employee } from "../../types";
import type { OvertimeStatus } from "../../types/overtimeTypes";
import { formatBiometricId } from "@/lib/biometricUtils";

interface OvertimeApprovalSectionProps {
  formMode: "direct" | "request" | "request_for";
  employees: Employee[];
  approvalStatus: OvertimeStatus;
  setApprovalStatus: (v: OvertimeStatus) => void;
  approverEmployeeId: string;
  setApproverEmployeeId: (v: string) => void;
  rejectionReason: string;
  setRejectionReason: (v: string) => void;
  approvalDate: string;
  setApprovalDate: (v: string) => void;
}

export const OvertimeApprovalSection = memo(function OvertimeApprovalSection({
  formMode,
  employees,
  approvalStatus,
  setApprovalStatus,
  approverEmployeeId,
  setApproverEmployeeId,
  rejectionReason,
  setRejectionReason,
  approvalDate,
  setApprovalDate,
}: OvertimeApprovalSectionProps) {
  const isRequestMode = formMode === "request" || formMode === "request_for";

  const statusOptions: { value: OvertimeStatus; label: string; color: string }[] = [
    { value: "pending", label: "Pending Review", color: "amber" },
    { value: "approved", label: "Approved", color: "emerald" },
    { value: "rejected", label: "Rejected", color: "rose" },
  ];

  const colorMap: Record<string, string> = {
    amber:
      "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
    emerald:
      "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
    rose: "border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
  };

  const selectedColor = statusOptions.find((s) => s.value === approvalStatus)?.color || "amber";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
        <span className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center text-sm">
          <i className="ri-shield-check-line font-bold" />
        </span>
        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100">
            Approval Information
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
            {isRequestMode
              ? "This request will be sent for manager review."
              : "Record the approval details for this overtime entry."}
          </p>
        </div>
      </div>

      {/* Request Mode: info banner only */}
      {isRequestMode ? (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
          <i className="ri-time-line text-amber-500 dark:text-amber-400 text-sm mt-0.5 shrink-0" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <p className="font-bold mb-0.5">Pending Approval</p>
            <p className="text-[11px] opacity-80">
              Once submitted, this request will be reviewed by your manager or HR. You will be
              notified when a decision is made.
            </p>
          </div>
        </div>
      ) : (
        // Direct Entry Mode: full approval form
        <div className="space-y-4">
          {/* Approval Status */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-2">
              Approval Status <span className="text-rose-400">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setApprovalStatus(opt.value)}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                    approvalStatus === opt.value
                      ? colorMap[opt.color]
                      : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:border-gray-300"
                  }`}
                >
                  {opt.value === "pending" && <i className="ri-time-line text-xs" />}
                  {opt.value === "approved" && <i className="ri-checkbox-circle-line text-xs" />}
                  {opt.value === "rejected" && <i className="ri-close-circle-line text-xs" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Approved By */}
          {approvalStatus === "approved" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Approved By <span className="text-rose-400">*</span>
                </label>
                <select
                  value={approverEmployeeId}
                  onChange={(e) => setApproverEmployeeId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30 dark:focus:ring-sky-500/30 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">— Select Approver —</option>
                  {employees.map((emp) => {
                    const bioId = formatBiometricId(emp.biometric_user_id, emp.branches?.name);
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                        {bioId ? ` [${bioId}]` : ""}
                        {emp.role ? ` (${emp.role})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Approval Date
                </label>
                <input
                  type="date"
                  value={approvalDate}
                  onChange={(e) => setApprovalDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30 dark:focus:ring-sky-500/30 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all"
                />
              </div>
            </>
          )}

          {/* Rejection Reason */}
          {approvalStatus === "rejected" && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Rejection Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Explain why this overtime request is rejected..."
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all resize-none placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Pending note */}
          {approvalStatus === "pending" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <i className="ri-information-line text-gray-400 text-sm mt-0.5 shrink-0" />
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                The status will be saved as <strong>Pending Review</strong>. You can approve or
                reject this record from the overtime list at any time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
