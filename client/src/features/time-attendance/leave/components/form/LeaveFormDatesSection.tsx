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
  handleSelectSpecialCategory?: (catId: string) => void;
  handleSelectMaternityCategory?: (catId: string) => void;
  handleApply90DaysMaternity?: () => void;
}

export function LeaveFormDatesSection({
  formData,
  setFormData,
  requestedDays,
  showDeductionPeriod,
  setShowDeductionPeriod,
  remainingAfterLeave,
  isOverBalance,
}: LeaveFormDatesSectionProps) {
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setFormData((prev) => {
      let nextCat = "";
      let nextEnd = prev.end_date;
      if (newType === "maternity" && prev.start_date) {
        const d = new Date(prev.start_date);
        d.setDate(d.getDate() + 89);
        nextEnd = d.toISOString().split("T")[0];
        nextCat = "Standard Delivery (Labour Law Art. 182)";
      }
      return { ...prev, leave_type: newType, category_law: nextCat, end_date: nextEnd };
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setFormData((prev) => {
      let nextEnd = prev.end_date;
      if (prev.leave_type === "maternity" && newStart) {
        const d = new Date(newStart);
        d.setDate(d.getDate() + 89);
        nextEnd = d.toISOString().split("T")[0];
      }
      return { ...prev, start_date: newStart, end_date: nextEnd || newStart };
    });
  };

  return (
    <div className="space-y-2.5 w-full my-2.5">
      {/* Leave Type — Spans Full Width */}
      <div className="space-y-1 w-full">
        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200">
          Leave Type <span className="text-rose-500">*</span>
        </label>
        <div className="relative w-full">
          <select
            value={formData.leave_type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 cursor-pointer transition-all shadow-2xs appearance-none pr-9"
          >
            <option value="annual">Annual Leave (ការឈប់សម្រាកប្រចាំឆ្នាំ)</option>
            <option value="sick">Sick Leave (ការឈប់សម្រាកដោយជំងឺ)</option>
            <option value="special">Special Leave (ការឈប់សម្រាកពិសេស)</option>
            <option value="maternity">Maternity Leave (ការឈប់សម្រាកលំហែមាតុភាព)</option>
            <option value="paternity">Paternity Leave (ការឈប់សម្រាកបិតុភាព)</option>
            <option value="unpaid">Unpaid Leave (ការឈប់សម្រាកគ្មានប្រាក់ឈ្នួល)</option>
            <option value="bereavement">Bereavement Leave (ការឈប់សម្រាកបុណ្យសព)</option>
            <option value="study">Study Leave (ការឈប់សម្រាកការសិក្សា)</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <i className="ri-arrow-down-s-line text-sm" />
          </div>
        </div>
      </div>

      {/* From Date & To Date — Width Fits Text Header */}
      <div className="flex flex-wrap items-end gap-3 sm:gap-4 w-full">
        {/* From Date */}
        <div className="space-y-1">
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200">
            From Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={handleStartDateChange}
            className="w-32 sm:w-36 max-w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 shadow-2xs cursor-pointer transition-all"
          />
        </div>

        {/* To Date */}
        <div className="space-y-1">
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200">
            To Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.end_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
            className="w-32 sm:w-36 max-w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 shadow-2xs cursor-pointer transition-all"
          />
        </div>

        {/* Duration Badge */}
        {requestedDays > 0 && (
          <div className="pb-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-[11px] font-bold text-[#253C7D] dark:text-blue-300">
              <i className="ri-time-line text-xs" />
              <span>{requestedDays} {requestedDays === 1 ? "day" : "days"}</span>
            </span>
          </div>
        )}
      </div>

      {/* Reason — Full Width */}
      <div className="space-y-1 w-full">
        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200">
          Reason <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.reason}
          onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
          placeholder="Go to hometown"
          className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 shadow-2xs transition-all"
        />
      </div>

      {/* Remark — Full Width with 0/500 counter inline */}
      <div className="space-y-1 w-full">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200">
            Remark
          </label>
          <span className="text-[10px] text-slate-400">
            {formData.remark?.length || 0}/500
          </span>
        </div>
        <input
          type="text"
          maxLength={500}
          value={formData.remark || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
          placeholder="Approval by HRM already"
          className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 shadow-2xs transition-all"
        />
      </div>

      {/* Show deduction period — Phone 2 Mockup Style */}
      <div className="pt-0.5 w-full">
        <button
          type="button"
          onClick={() => setShowDeductionPeriod((prev) => !prev)}
          className="w-full py-2 px-3 bg-blue-50/70 hover:bg-blue-100/70 dark:bg-sky-950/40 border border-blue-100 dark:border-sky-900/60 text-[#1e3a8a] dark:text-sky-300 rounded-xl text-[11.5px] font-bold flex items-center justify-between shadow-2xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <i className="ri-calendar-event-fill text-[#253C7D] dark:text-sky-400 text-xs sm:text-sm" />
            <span>{showDeductionPeriod ? "Hide deduction period" : "Show deduction period"}</span>
            {requestedDays > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900 text-[#1e3a8a] dark:text-blue-200 text-[9.5px] font-extrabold ml-1">
                {requestedDays}d
              </span>
            )}
          </div>
          <i className={`ri-arrow-${showDeductionPeriod ? "down" : "right"}-s-line text-slate-400 text-sm`} />
        </button>

        {/* Deduction Breakdown Details */}
        {showDeductionPeriod && (
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] space-y-1.5 w-full animate-in fade-in-50 zoom-in-95 duration-100 shadow-2xs">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span className="font-medium">Requested Period:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {requestedDays} {requestedDays === 1 ? "day" : "days"}
              </span>
            </div>
            <div className="flex justify-between items-center font-bold border-t border-slate-200 dark:border-slate-700 pt-1.5">
              <span className="text-slate-700 dark:text-slate-200">Balance After Leave:</span>
              <span className={isOverBalance ? "text-rose-600 font-extrabold" : "text-emerald-600 font-extrabold"}>
                {remainingAfterLeave} days
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
