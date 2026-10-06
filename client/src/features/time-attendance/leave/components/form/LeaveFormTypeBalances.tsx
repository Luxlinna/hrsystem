import React from "react";
import type { LeaveFormData, LeaveTypeBalanceStats } from "../../types";

interface LeaveFormTypeBalancesProps {
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  activeTypeCfg: { code: string; label: string };
  currentStats: LeaveTypeBalanceStats;
  handleSelectSpecialCategory?: (catId: string) => void;
  handleSelectMaternityCategory?: (catId: string) => void;
  handleApply90DaysMaternity?: () => void;
}

export function LeaveFormTypeBalances({
  formData,
  setFormData,
  activeTypeCfg,
  currentStats,
}: LeaveFormTypeBalancesProps) {
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

  return (
    <div className="space-y-2.5 pt-1">
      {/* Section Header */}
      <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-[#1e293b] dark:text-slate-100">
        <div className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
          <i className="ri-calendar-todo-fill" />
        </div>
        <span>Leave Type Info</span>
      </div>

      {/* Type Dropdown */}
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
          Leave Type <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
            {formData.leave_type === "annual" ? (
              <i className="ri-sun-line text-emerald-600 text-sm" />
            ) : formData.leave_type === "sick" ? (
              <i className="ri-heart-pulse-line text-rose-500 text-sm" />
            ) : formData.leave_type === "maternity" ? (
              <i className="ri-parent-line text-purple-500 text-sm" />
            ) : formData.leave_type === "special" ? (
              <i className="ri-star-line text-amber-500 text-sm" />
            ) : formData.leave_type === "study" ? (
              <i className="ri-book-open-line text-blue-500 text-sm" />
            ) : (
              <i className="ri-calendar-event-line text-slate-500 text-sm" />
            )}
          </div>
          <select
            value={formData.leave_type}
            onChange={handleTypeChange}
            className="w-full pl-8 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] cursor-pointer appearance-none shadow-2xs"
          >
            <option value="annual">AL — Annual Leave</option>
            <option value="sick">SL — Sick Leave</option>
            <option value="special">SP — Special Leave (Labour Law Art. 171)</option>
            <option value="maternity">ML — Maternity Leave (90 Days Statutory)</option>
            <option value="unpaid">UL — Unpaid Leave</option>
            <option value="paternity">PL — Paternity Leave</option>
            <option value="bereavement">BL — Bereavement Leave</option>
            <option value="study">STL — Study Leave</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-10">
            <i className="ri-arrow-down-s-line text-sm" />
          </div>
        </div>
      </div>

      {/* Entitlement Summary Stat Cards */}
      <div className="space-y-1 pt-0.5">
        <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300">
          {activeTypeCfg.code} Entitlement
        </label>
        
        <div className="grid grid-cols-3 gap-1.5">
          {/* Balance */}
          <div className="p-1.5 py-1.5 bg-[#e0f2fe] dark:bg-sky-950/40 rounded-xl text-center flex flex-col justify-between min-h-[50px] shadow-2xs">
            <span className="text-[8px] sm:text-[8.5px] font-bold text-[#0369a1] dark:text-sky-300 uppercase tracking-tight truncate">
              {activeTypeCfg.code} BALANCE
            </span>
            <div className="text-xs sm:text-[13px] font-black text-[#0c4a6e] dark:text-sky-100 my-0.2">
              {currentStats.balance} <span className="text-[9px] font-normal text-slate-500">days</span>
            </div>
            <i className="ri-calendar-line text-[11px] text-[#0284c7] mx-auto" />
          </div>

          {/* Used */}
          <div className="p-1.5 py-1.5 bg-[#fef3c7] dark:bg-amber-950/40 rounded-xl text-center flex flex-col justify-between min-h-[50px] shadow-2xs">
            <span className="text-[8px] sm:text-[8.5px] font-bold text-[#b45309] dark:text-amber-300 uppercase tracking-tight truncate">
              {activeTypeCfg.code} USED
            </span>
            <div className="text-xs sm:text-[13px] font-black text-[#78350f] dark:text-amber-100 my-0.2">
              {currentStats.used} <span className="text-[9px] font-normal text-slate-500">days</span>
            </div>
            <i className="ri-time-line text-[11px] text-[#d97706] mx-auto" />
          </div>

          {/* Available */}
          <div className="p-1.5 py-1.5 bg-[#dcfce7] dark:bg-emerald-950/40 rounded-xl text-center flex flex-col justify-between min-h-[50px] shadow-2xs">
            <span className="text-[8px] sm:text-[8.5px] font-bold text-[#15803d] dark:text-emerald-300 uppercase tracking-tight truncate">
              {activeTypeCfg.code} AVAILABLE
            </span>
            <div className="text-xs sm:text-[13px] font-black text-[#14532d] dark:text-emerald-100 my-0.2">
              {currentStats.available} <span className="text-[9px] font-normal text-slate-500">days</span>
            </div>
            <i className="ri-checkbox-circle-line text-[11px] text-[#16a34a] mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
