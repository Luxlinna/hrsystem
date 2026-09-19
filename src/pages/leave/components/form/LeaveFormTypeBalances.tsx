import React from "react";
import type { LeaveFormData, LeaveTypeBalanceStats } from "../../types";
import {
  SPECIAL_LEAVE_LABOUR_LAW_CATEGORIES,
  MATERNITY_LEAVE_LABOUR_LAW_CATEGORIES,
} from "../../constants";

interface LeaveFormTypeBalancesProps {
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  activeTypeCfg: { code: string; label: string };
  currentStats: LeaveTypeBalanceStats;
  handleSelectSpecialCategory: (catId: string) => void;
  handleSelectMaternityCategory: (catId: string) => void;
  handleApply90DaysMaternity: () => void;
}

export function LeaveFormTypeBalances({
  formData,
  setFormData,
  activeTypeCfg,
  currentStats,
  handleSelectSpecialCategory,
  handleSelectMaternityCategory,
  handleApply90DaysMaternity,
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700 dark:text-slate-300">
          Leave Type <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 relative">
          <select
            value={formData.leave_type}
            onChange={handleTypeChange}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 cursor-pointer appearance-none pr-10"
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
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-slate-500 flex items-center">
            <i className="ri-arrow-down-s-line text-base" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <div className="md:col-span-3 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider pt-1">
          {activeTypeCfg.code} Entitlements
        </div>
        <div className="md:col-span-9 space-y-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-center">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{activeTypeCfg.code} Balance</div>
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {currentStats.balance} <span className="text-xs font-medium text-slate-400">days</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-center">
              <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">{activeTypeCfg.code} Used</div>
              <div className="text-base font-extrabold text-amber-800 dark:text-amber-300 mt-0.5">
                {currentStats.used} <span className="text-xs font-medium text-amber-600 dark:text-amber-400">days</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl text-center">
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">{activeTypeCfg.code} Available</div>
              <div className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 mt-0.5">
                {currentStats.available} <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">days</span>
              </div>
            </div>
          </div>

          {formData.leave_type === "annual" && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <i className="ri-checkbox-circle-fill text-emerald-600 dark:text-emerald-400" />
              Standard Annual Leave deduction. Document upload is optional.
            </p>
          )}
          {formData.leave_type === "sick" && (
            <p className="text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-medium">
              <i className="ri-alert-fill text-rose-500 dark:text-rose-400" />
              Medical certificate / doctor report required for Sick Leave validation.
            </p>
          )}
          {formData.leave_type === "special" && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium">
              <i className="ri-scales-3-line text-amber-600 dark:text-amber-400" />
              Statutory Special Leave per Cambodia Labour Law Art. 171 (attach supporting proof).
            </p>
          )}
          {formData.leave_type === "maternity" && (
            <p className="text-[11px] text-pink-700 dark:text-pink-400 flex items-center gap-1.5 font-medium">
              <i className="ri-heart-pulse-fill text-pink-600 dark:text-pink-400" />
              Maternity Leave period: 90 continuous days per Labour Law Art. 182.
            </p>
          )}
        </div>
      </div>

      {formData.leave_type === "special" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1 border-t border-gray-100 dark:border-slate-800">
          <label className="md:col-span-3 text-xs font-bold text-gray-700 dark:text-slate-300">
            Labour Law Category <span className="text-rose-500">*</span>
          </label>
          <div className="md:col-span-9 relative">
            <select
              value={formData.category_law || ""}
              onChange={(e) => {
                const found = SPECIAL_LEAVE_LABOUR_LAW_CATEGORIES.find(
                  (c) => c.name.includes(e.target.value) || e.target.value.includes(c.name)
                );
                if (found) handleSelectSpecialCategory(found.id);
                else setFormData((prev) => ({ ...prev, category_law: e.target.value }));
              }}
              className="w-full px-3.5 py-2.5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400"
            >
              <option value="">Select Labour Law Statutory Reason...</option>
              {SPECIAL_LEAVE_LABOUR_LAW_CATEGORIES.map((cat) => (
                <option key={cat.id} value={`${cat.name} (${cat.lawRef})`}>{cat.name} — {cat.lawRef}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {formData.leave_type === "maternity" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1 border-t border-gray-100 dark:border-slate-800">
          <label className="md:col-span-3 text-xs font-bold text-gray-700 dark:text-slate-300">
            Maternity Category <span className="text-rose-500">*</span>
          </label>
          <div className="md:col-span-9 space-y-2">
            <select
              value={formData.category_law || ""}
              onChange={(e) => {
                const found = MATERNITY_LEAVE_LABOUR_LAW_CATEGORIES.find(
                  (c) => c.name.includes(e.target.value) || e.target.value.includes(c.name)
                );
                if (found) handleSelectMaternityCategory(found.id);
                else setFormData((prev) => ({ ...prev, category_law: e.target.value }));
              }}
              className="w-full px-3.5 py-2.5 bg-pink-50/50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/60 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400"
            >
              {MATERNITY_LEAVE_LABOUR_LAW_CATEGORIES.map((cat) => (
                <option key={cat.id} value={`${cat.name} (${cat.lawRef})`}>{cat.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleApply90DaysMaternity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 dark:bg-pink-950/50 hover:bg-pink-200 dark:hover:bg-pink-900/60 text-pink-800 dark:text-pink-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-calendar-check-line" />
              Auto-Set 90 Continuous Days from Start Date
            </button>
          </div>
        </div>
      )}
    </>
  );
}
