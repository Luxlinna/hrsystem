import { Link } from "react-router-dom";
import { BranchInfo } from "@/context/branchTypes";
import {
  keyLabels,
  currencyOptions,
  timezoneOptions,
} from "../constants";
import { SettingField } from "./SettingField";
import { ToggleField } from "./SettingField";
import { AttendanceScheduleCard } from "./AttendanceScheduleCard";

interface GeneralSettingsProps {
  getVal: (key: string) => string;
  updateValue: (key: string, value: string) => void;
  saveSetting: (key: string) => Promise<void>;
  hasChanges: (keys: string[]) => boolean;
  saveAllGeneral: () => Promise<void>;
  saving: boolean;
  edited: Record<string, string>;
  settingsScope?: string;
  setSettingsScope?: (scope: string) => void;
  visibleBranches?: BranchInfo[];
  currentBranchOrSite?: BranchInfo;
}

export function GeneralSettings({
  getVal,
  updateValue,
  saveSetting,
  hasChanges,
  saveAllGeneral,
  saving,
  edited,
  settingsScope = "all",
  setSettingsScope,
  visibleBranches = [],
  currentBranchOrSite,
}: GeneralSettingsProps) {
  const isSiteOrBranch = settingsScope !== "all" && currentBranchOrSite;

  const formatClock = (t?: string | null) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = (h || 0) >= 12 ? "PM" : "AM";
    const h12 = (h || 0) % 12 || 12;
    return `${h12}:${String(m || 0).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="w-full max-w-none space-y-5">
      {/* Active Branch Site Schedule Notice & Scope Switcher */}
      {currentBranchOrSite && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shrink-0 shadow-xs">
                <i className="ri-building-2-line text-lg" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-extrabold text-gray-900">
                    {currentBranchOrSite.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#253C7D] border border-blue-200">
                    {currentBranchOrSite.is_site ? "Work Site Override" : "Branch Location"}
                  </span>
                  {currentBranchOrSite.is_four_punch_enabled && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      4-Punch Mode Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-1.5 flex-wrap font-medium">
                  {currentBranchOrSite.work_start_time && (
                    <span className="flex items-center gap-1.5">
                      <i className="ri-time-line text-[#253C7D]" />
                      Work Hours:{" "}
                      <strong className="text-gray-900 font-bold">
                        {formatClock(currentBranchOrSite.work_start_time)}
                        {currentBranchOrSite.work_end_time ? ` – ${formatClock(currentBranchOrSite.work_end_time)}` : ""}
                      </strong>
                    </span>
                  )}
                  {currentBranchOrSite.break_start_time && (
                    <span className="flex items-center gap-1.5">
                      <i className="ri-restaurant-line text-amber-600" />
                      Lunch Break:{" "}
                      <strong className="text-gray-900 font-bold">
                        {formatClock(currentBranchOrSite.break_start_time)}
                        {currentBranchOrSite.break_end_time ? ` – ${formatClock(currentBranchOrSite.break_end_time)}` : ""}
                      </strong>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                  Employees at this location follow these site-specific hours. You can adjust them directly in the <strong>Attendance Schedule</strong> card below.
                </p>
              </div>
            </div>

            <Link
              to="/branches"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-[#253C7D] border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-center cursor-pointer"
            >
              <i className="ri-settings-4-line" /> Manage Branch Sites
            </Link>
          </div>
        </div>
      )}
      <SettingField
        label="Company Name"
        inputType="text"
        settingKey="company_name"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <SettingField
        label="Default Currency"
        inputType="select"
        options={currencyOptions}
        settingKey="default_currency"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <SettingField
        label="Timezone"
        description={`Company time used for all check in/out records, late/early calculations and "today" — independent of each device's own clock. Default: Cambodia (Asia/Phnom_Penh).`}
        inputType="select"
        options={timezoneOptions}
        settingKey="timezone"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <SettingField
        label="Fiscal Year Start"
        inputType="date"
        settingKey="fiscal_year_start"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <SettingField
        label="Week Start Day"
        inputType="select"
        options={["Monday", "Sunday", "Saturday"]}
        settingKey="week_start_day"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <SettingField
        label={isSiteOrBranch ? `Work Start Time (${currentBranchOrSite.name})` : "Work Start Time"}
        description={
          isSiteOrBranch
            ? `Used by Check In to mark arrivals late for ${currentBranchOrSite.name}.`
            : "Used by Check In to mark arrivals late — e.g. 08:00 for an 8am start, every workday."
        }
        inputType="time"
        settingKey="work_start_time"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <AttendanceScheduleCard
        getVal={getVal}
        updateValue={updateValue}
        settingsScope={settingsScope}
        setSettingsScope={setSettingsScope}
        visibleBranches={visibleBranches}
        currentBranchOrSite={currentBranchOrSite}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <SettingField
        label="Default Work Hours / Week"
        inputType="number"
        settingKey="default_work_hours"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <SettingField
        label="Overtime Threshold (hours)"
        inputType="number"
        settingKey="overtime_threshold"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <ToggleField
        id="leave_approval"
        label="Leave approval required for all leave requests"
        settingKey="leave_approval_required"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <ToggleField
        id="payroll_reminder"
        label="Auto send payroll reminders before processing"
        settingKey="auto_payroll_reminder"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      {hasChanges(Object.keys(keyLabels)) && (
        <button
          onClick={saveAllGeneral}
          disabled={saving}
          className="px-6 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      )}
    </div>
  );
}
