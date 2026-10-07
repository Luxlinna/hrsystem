import React, { useState } from "react";
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

const COMMON_REASONS = [
  "Personal appointment & errands",
  "Family matter / personal obligation",
  "Medical appointment / recovery",
  "Annual rest & vacation",
  "Urgent emergency leave",
];

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
  const [selectedQuickReason, setSelectedQuickReason] = useState("");

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

  const handleQuickReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedQuickReason(val);
    if (val && !formData.reason.includes(val)) {
      setFormData((prev) => ({
        ...prev,
        reason: prev.reason ? `${val} - ${prev.reason}` : val,
      }));
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Top Banner Notice */}
      <div className="flex items-center gap-2 p-2 px-2.5 rounded-xl bg-[#d1fae5]/80 dark:bg-emerald-950/40 border border-[#a7f3d0] dark:border-emerald-800/60 text-[#065f46] dark:text-emerald-300 text-[9.5px] sm:text-[10.5px] font-semibold">
        <div className="w-3.5 h-3.5 rounded-full bg-[#059669] text-white flex items-center justify-center text-[9px] shrink-0">
          <i className="ri-check-line font-bold" />
        </div>
        <span>Standard Annual Leave deduction. Document upload is optional.</span>
      </div>

      {/* From Date & To Date (Compact Single Line) */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* From Date */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            From Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={handleStartDateChange}
              className="w-36 sm:w-40 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2563eb] shadow-2xs cursor-pointer"
            />
          </div>
        </div>

        {/* To Date */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            To Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              className="w-36 sm:w-40 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2563eb] shadow-2xs cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Reason Dropdown & Textarea */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
          Reason <span className="text-rose-500">*</span>
        </label>
        
        {/* Quick Reason Dropdown */}
        <div className="relative">
          <select
            value={selectedQuickReason}
            onChange={handleQuickReasonChange}
            className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium focus:outline-none focus:border-[#2563eb] cursor-pointer appearance-none shadow-2xs"
          >
            <option value="">Select or enter reason</option>
            {COMMON_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <i className="ri-arrow-down-s-line text-sm" />
          </div>
        </div>

        {/* Textarea with Character Counter */}
        <div className="relative">
          <textarea
            required
            rows={2.5}
            maxLength={500}
            value={formData.reason}
            onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Add more details (optional)..."
            className="w-full p-2.5 sm:p-3 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#253C7D] shadow-2xs resize-none"
          />
          <div className="absolute right-3 bottom-2 text-[9.5px] text-slate-400 font-mono pointer-events-none">
            {formData.reason.length}/500
          </div>
        </div>
      </div>

      {/* Deduction Toggle Button */}
      <button
        type="button"
        onClick={() => setShowDeductionPeriod((prev) => !prev)}
        className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-blue-50/50 border border-[#253C7D]/60 text-[#253C7D] dark:text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
      >
        <i className="ri-calendar-event-line" />
        <span>Show deduction period</span>
        {requestedDays > 0 && (
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#253C7D] dark:text-blue-200 font-bold text-[10px]">
            {requestedDays}d
          </span>
        )}
      </button>

      {/* Deduction Breakdown Details */}
      {showDeductionPeriod && (
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] space-y-1 animate-in fade-in-50">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Requested Period:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {requestedDays} {requestedDays === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-1">
            <span className="text-slate-800 dark:text-slate-200">Balance After Leave:</span>
            <span className={isOverBalance ? "text-rose-600" : "text-emerald-600"}>
              {remainingAfterLeave} days
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
