import { memo } from "react";
import type { GeneralEmployeeSettings } from "../types";

interface GeneralSettingTabProps {
  settings: GeneralEmployeeSettings;
  onChange: <K extends keyof GeneralEmployeeSettings>(field: K, value: GeneralEmployeeSettings[K]) => void;
  onApply: () => void;
  saving: boolean;
}

export const GeneralSettingTab = memo(function GeneralSettingTab({
  settings,
  onChange,
  onApply,
  saving,
}: GeneralSettingTabProps) {
  return (
    <div className="space-y-8 pb-10">
      {/* 1. GENERAL */}
      <div className="space-y-4">
        <div className="text-xs font-black tracking-wider text-sky-600 uppercase border-b border-slate-100 pb-2">
          General
        </div>

        <div className="space-y-3.5 max-w-4xl">
          {/* Is show salary type */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5 border-b border-slate-50">
            <label className="text-xs font-bold text-slate-700">
              Is show salary type
            </label>
            <div className="w-full sm:w-44">
              <select
                value={settings.is_show_salary_type}
                onChange={(e) => onChange("is_show_salary_type", e.target.value as "show" | "hide")}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-xs"
              >
                <option value="show">Show</option>
                <option value="hide">Hide</option>
              </select>
            </div>
          </div>

          {/* Employee Restrict Age */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5">
            <div>
              <span className="text-xs font-bold text-slate-700">Employee Restrict Age </span>
              <span className="text-[11px] text-slate-400 font-normal">
                (Age of employee must be greater than this, otherwise system not allow.)
              </span>
            </div>
            <div className="w-full sm:w-44">
              <input
                type="number"
                min={0}
                value={settings.employee_restrict_age}
                onChange={(e) => onChange("employee_restrict_age", parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#253C7D] shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. IDENTIFICATION EXPIRATION ALERT */}
      <div className="space-y-4">
        <div className="text-xs font-black tracking-wider text-sky-600 uppercase border-b border-slate-100 pb-2">
          Identification Expiration Alert
        </div>

        <div className="space-y-3.5 max-w-4xl">
          {[
            { key: "alert_passport_days", label: "Passport" },
            { key: "alert_driver_license_days", label: "Driver License" },
            { key: "alert_visa_days", label: "Visa" },
            { key: "alert_work_permit_days", label: "Work Permit" },
            { key: "alert_national_id_days", label: "National Id" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0"
            >
              <div>
                <span className="text-xs font-bold text-slate-700">{item.label} </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Number of alert days before expiration date)
                </span>
              </div>
              <div className="w-full sm:w-44">
                <input
                  type="number"
                  min={0}
                  value={(settings as any)[item.key]}
                  onChange={(e) => onChange(item.key as any, parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#253C7D] shadow-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ANNIVERSARY ALERT */}
      <div className="space-y-4">
        <div className="text-xs font-black tracking-wider text-sky-600 uppercase border-b border-slate-100 pb-2">
          Anniversary Alert
        </div>

        <div className="space-y-4 max-w-4xl">
          {/* Joining Alert */}
          <div className="space-y-2 border-b border-slate-50 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-700">Joining Alert </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Number of alert days before date of anniversary)
                </span>
              </div>
              <div className="w-full sm:w-44">
                <input
                  type="number"
                  min={0}
                  value={settings.alert_joining_days}
                  onChange={(e) => onChange("alert_joining_days", parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#253C7D] shadow-xs"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={settings.alert_joining_recurring}
                onChange={(e) => onChange("alert_joining_recurring", e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              Recurring joining alert
            </label>
          </div>

          {/* Birthday Alert */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-700">Birthday Alert </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Number of alert days before birthdate)
                </span>
              </div>
              <div className="w-full sm:w-44">
                <input
                  type="number"
                  min={0}
                  value={settings.alert_birthday_days}
                  onChange={(e) => onChange("alert_birthday_days", parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:outline-none focus:border-[#253C7D] shadow-xs"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={settings.alert_birthday_send_message}
                onChange={(e) => onChange("alert_birthday_send_message", e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              Send message birthday to employee
            </label>
          </div>
        </div>
      </div>

      {/* 4. AUTO NUMBER */}
      <div className="space-y-4">
        <div className="text-xs font-black tracking-wider text-sky-600 uppercase border-b border-slate-100 pb-2">
          Auto Number
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-4xl py-1">
          <span className="text-xs font-bold text-slate-700">Auto Employee Code</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Prefix"
              value={settings.auto_employee_code_prefix}
              onChange={(e) => onChange("auto_employee_code_prefix", e.target.value)}
              className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-medium text-slate-800 focus:outline-none focus:border-[#253C7D]"
            />
            <input
              type="text"
              placeholder="Mid"
              value={settings.auto_employee_code_middle}
              onChange={(e) => onChange("auto_employee_code_middle", e.target.value)}
              className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-medium text-slate-800 focus:outline-none focus:border-[#253C7D]"
            />
            <input
              type="number"
              min={1}
              value={settings.auto_employee_code_sequence}
              onChange={(e) => onChange("auto_employee_code_sequence", parseInt(e.target.value, 10) || 0)}
              className="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-medium text-slate-800 focus:outline-none focus:border-[#253C7D]"
            />
            <div className="px-2 py-1.5 border border-slate-300 rounded bg-white flex items-center justify-center">
              <input
                type="checkbox"
                checked={settings.auto_employee_code_enabled}
                onChange={(e) => onChange("auto_employee_code_enabled", e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Apply Setting Button */}
      <div className="pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onApply}
          disabled={saving}
          className="px-5 py-2 text-xs font-bold text-white rounded-md shadow-sm transition-all cursor-pointer flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
          style={{ background: "#4A90E2" }}
        >
          {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Apply Setting
        </button>
      </div>
    </div>
  );
});
