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
}

export function GeneralSettings({
  getVal,
  updateValue,
  saveSetting,
  hasChanges,
  saveAllGeneral,
  saving,
  edited,
}: GeneralSettingsProps) {
  return (
    <div className="w-full max-w-none space-y-5">
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
        label="Work Start Time"
        description="Used by Check In to mark arrivals late — e.g. 08:00 for an 8am start, every workday."
        inputType="time"
        settingKey="work_start_time"
        getVal={getVal}
        updateValue={updateValue}
        saveSetting={saveSetting}
        saving={saving}
        edited={edited}
      />

      <AttendanceScheduleCard getVal={getVal} updateValue={updateValue} />

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
