import React, { useMemo } from "react";
import type { LeaveFormData, LeaveTypeBalanceStats, Employee } from "../../types";
import {
  type LeaveTypeSetting,
  getLeaveTypeSlug,
  getStoredLeaveTypes,
} from "../../services/leaveSettingsService";

interface LeaveFormDatesSectionProps {
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  requestedDays: number;
  showDeductionPeriod: boolean;
  setShowDeductionPeriod: React.Dispatch<React.SetStateAction<boolean>>;
  currentStats: LeaveTypeBalanceStats;
  remainingAfterLeave: number | string;
  isOverBalance: boolean;
  leaveTypes?: LeaveTypeSetting[];
  activeTypeCfg?: {
    code?: string;
    label?: string;
    requiresUpload?: boolean;
    periodType?: string;
    isUnpaid?: boolean;
    eligibleFor?: string;
    excludedContractTypes?: string[];
  };
  selectedEmployee?: Employee | null;
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
  leaveTypes: propLeaveTypes,
  activeTypeCfg,
  selectedEmployee,
}: LeaveFormDatesSectionProps) {
  // Dynamic active leave types list from Settings (Leave Type tab)
  const activeLeaveTypes = useMemo(() => {
    const list = propLeaveTypes && propLeaveTypes.length > 0 ? propLeaveTypes : getStoredLeaveTypes();
    const active = list.filter((t) => t.is_active);
    return active.length > 0 ? active : list;
  }, [propLeaveTypes]);

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

  // Eligibility and exclusion checks
  const isGenderRestricted = useMemo(() => {
    if (!activeTypeCfg?.eligibleFor || activeTypeCfg.eligibleFor === "both") return false;
    if (!selectedEmployee?.gender) return false;
    const empGender = selectedEmployee.gender.toLowerCase();
    return (
      (activeTypeCfg.eligibleFor === "female" && empGender === "male") ||
      (activeTypeCfg.eligibleFor === "male" && empGender === "female")
    );
  }, [activeTypeCfg?.eligibleFor, selectedEmployee?.gender]);

  const isContractExcluded = useMemo(() => {
    if (!activeTypeCfg?.excludedContractTypes || activeTypeCfg.excludedContractTypes.length === 0) return false;
    if (!selectedEmployee?.contract_type) return false;
    return activeTypeCfg.excludedContractTypes.some(
      (ct) => ct.toLowerCase() === selectedEmployee.contract_type?.toLowerCase()
    );
  }, [activeTypeCfg?.excludedContractTypes, selectedEmployee?.contract_type]);

  return (
    <div className="space-y-2.5 w-full my-2.5">
      {/* Leave Type — Spans Full Width, dynamically populated from Leave Settings */}
      <div className="space-y-1 w-full">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200">
            <span>Leave Type</span>
            <span className="text-rose-500">*</span>
            {activeTypeCfg?.requiresUpload && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"
                title="Requires attachment / medical cert"
              />
            )}
          </label>

          {activeTypeCfg?.periodType && (
            <span className="text-[10px] font-semibold text-slate-400 capitalize">
              Period: <span className="text-slate-600 dark:text-slate-300 font-bold">{activeTypeCfg.periodType}</span>
            </span>
          )}
        </div>

        <div className="relative w-full">
          <select
            value={formData.leave_type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 cursor-pointer transition-all shadow-2xs appearance-none pr-9"
          >
            {activeLeaveTypes.map((type) => {
              const slug = getLeaveTypeSlug(type);
              return (
                <option key={type.id || type.code} value={slug}>
                  {type.name}
                </option>
              );
            })}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <i className="ri-arrow-down-s-line text-sm" />
          </div>
        </div>

        {/* Dynamic policy notices */}
        {isGenderRestricted && (
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-medium flex items-center gap-1.5">
            <i className="ri-error-warning-line text-xs shrink-0" />
            <span>
              Notice: {activeTypeCfg?.label || "This leave type"} is designated for {activeTypeCfg?.eligibleFor} employees under policy.
            </span>
          </div>
        )}

        {isContractExcluded && (
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-medium flex items-center gap-1.5">
            <i className="ri-information-line text-xs shrink-0" />
            <span>
              Notice: Not entitled under contract type &quot;{selectedEmployee?.contract_type}&quot;.
            </span>
          </div>
        )}
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
                {typeof remainingAfterLeave === "number" ? `${remainingAfterLeave} days` : remainingAfterLeave}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
