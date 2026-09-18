import React from "react";
import type { LeaveFormData, LeaveTypeBalanceStats } from "../../types";

interface LeaveFormDatesSectionProps {
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  requestedDays: number;
  showDeductionPeriod: boolean;
  setShowDeductionPeriod: React.Dispatch<React.SetStateAction<boolean>>;
  currentStats: LeaveTypeBalanceStats;
  remainingAfterLeave: number;
  isOverBalance: boolean;
}

export function LeaveFormDatesSection({
  formData,
  setFormData,
  requestedDays,
  showDeductionPeriod,
  setShowDeductionPeriod,
  currentStats,
  remainingAfterLeave,
  isOverBalance,
}: LeaveFormDatesSectionProps) {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setFormData((prev) => {
      let nextEnd = prev.end_date;
      if (prev.leave_type === "maternity" && newStart) {
        const d = new Date(newStart);
        d.setDate(d.getDate() + 89);
        nextEnd = d.toISOString().split("T")[0];
      }
      return { ...prev, start_date: newStart, end_date: nextEnd };
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700">
          From Date <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9">
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={handleStartDateChange}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700">
          To Date <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 flex items-center gap-3">
          <input
            type="date"
            required
            value={formData.end_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
            className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
          {requestedDays > 0 && (
            <span className="px-3 py-2 bg-blue-50 text-[#253C7D] border border-blue-200 rounded-xl text-xs font-extrabold whitespace-nowrap">
              {requestedDays} {requestedDays === 1 ? "Day" : "Days"}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <label className="md:col-span-3 text-xs font-bold text-gray-700 pt-2">
          Reason <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9">
          <textarea
            required
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="State the reason or purpose for taking leave..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <label className="md:col-span-3 text-xs font-bold text-gray-700 pt-2">
          Remark
        </label>
        <div className="md:col-span-9">
          <textarea
            rows={2}
            value={formData.remark}
            onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
            placeholder="Additional remarks or handover notes for manager/colleagues..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <div className="md:col-span-3"></div>
        <div className="md:col-span-9 space-y-3">
          <button
            type="button"
            onClick={() => setShowDeductionPeriod((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98"
          >
            <i className="ri-information-line text-sm" />
            {showDeductionPeriod ? "Hide deduction period" : "Show deduction period"}
          </button>

          {showDeductionPeriod && (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">Period Duration:</span>
                <strong className="text-gray-900">
                  {formData.start_date && formData.end_date
                    ? `${formData.start_date} → ${formData.end_date} (${requestedDays} day${requestedDays === 1 ? "" : "s"})`
                    : "Please select start and end dates"}
                </strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">Current Available Balance:</span>
                <strong className="text-emerald-700">{currentStats.available} days</strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">Days to Deduct:</span>
                <strong className="text-amber-700">-{requestedDays} days</strong>
              </div>

              <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700">Remaining Balance After Approval:</span>
                <span className={`text-sm ${isOverBalance ? "text-rose-600" : "text-[#253C7D]"}`}>
                  {remainingAfterLeave} days
                </span>
              </div>

              {isOverBalance && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-1.5">
                  <i className="ri-error-warning-fill text-sm" />
                  Warning: Requested days exceed the employee's available balance!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
