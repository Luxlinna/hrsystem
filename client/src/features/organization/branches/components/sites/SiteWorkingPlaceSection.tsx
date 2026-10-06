import React, { useState, useEffect } from "react";
import type { WorkSiteFormState } from "../../types";
import { fetchBranchSchedule } from "../../services/branchWorkingHoursService";
import { SiteCustomScheduleFields } from "./SiteCustomScheduleFields";

interface Props {
  form: WorkSiteFormState;
  setForm: React.Dispatch<React.SetStateAction<WorkSiteFormState>>;
  branchId: string;
  isReadOnly?: boolean;
}

export function SiteWorkingPlaceSection({ form, setForm, branchId, isReadOnly = false }: Props) {
  const [buSchedule, setBuSchedule] = useState<any>(null);
  const isCustomMode = form.working_hours_mode === "custom";

  useEffect(() => {
    if (!branchId) return;
    (async () => {
      const bu = await fetchBranchSchedule(branchId);
      if (bu) setBuSchedule(bu);
    })();
  }, [branchId]);

  const handleSelectMode = (mode: "inherit" | "custom") => {
    if (mode === "inherit" && buSchedule) {
      setForm((p) => ({
        ...p,
        working_hours_mode: "inherit",
        work_start_time: buSchedule.work_start_time?.slice(0, 5) || "08:00",
        work_end_time: buSchedule.work_end_time?.slice(0, 5) || "17:00",
        break_start_time: buSchedule.break_start_time?.slice(0, 5) || "12:00",
        break_end_time: buSchedule.break_end_time?.slice(0, 5) || "13:00",
        is_four_punch_enabled: buSchedule.is_four_punch_enabled ?? true,
        late_grace_minutes: String(buSchedule.late_grace_minutes ?? 15),
        early_leave_grace_minutes: String(buSchedule.early_leave_grace_minutes ?? 15),
        auto_checkout_time: buSchedule.auto_checkout_time?.slice(0, 5) || "18:00",
        is_auto_checkout_enabled: buSchedule.is_auto_checkout_enabled ?? true,
      }));
    } else {
      setForm((p) => ({ ...p, working_hours_mode: "custom" }));
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">
            Site Working Place Settings
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Control working hours, 4-punch attendance, lunch break, and auto check-out for this site
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
            <button
              type="button"
              onClick={() => handleSelectMode("inherit")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                !isCustomMode
                  ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Inherit BU Policy
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode("custom")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isCustomMode
                  ? "bg-[#253C7D] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Custom Site Policy
            </button>
          </div>
        )}
      </div>

      {!isCustomMode ? (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Inheriting from Business Unit
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              Synced with BU
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Hours</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {form.work_start_time?.slice(0, 5) || "08:00"} – {form.work_end_time?.slice(0, 5) || "17:00"}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Punch Mode</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {form.is_four_punch_enabled ? "4 Punches / Day" : "2 Punches / Day"}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Lunch Break</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {form.break_start_time?.slice(0, 5) || "12:00"} – {form.break_end_time?.slice(0, 5) || "13:00"}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Auto Check-Out</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {form.is_auto_checkout_enabled ?? true ? (form.auto_checkout_time?.slice(0, 5) || "18:00") : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <SiteCustomScheduleFields form={form} setForm={setForm} isReadOnly={isReadOnly} />
      )}
    </div>
  );
}
