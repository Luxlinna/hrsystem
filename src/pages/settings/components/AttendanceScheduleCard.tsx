import { BranchInfo } from "@/context/branchTypes";
import { keyLabels, ATTENDANCE_SCHEDULE_KEYS } from "../constants";

interface AttendanceScheduleCardProps {
  getVal: (key: string) => string;
  updateValue: (key: string, value: string) => void;
  settingsScope?: string;
  setSettingsScope?: (scope: string) => void;
  visibleBranches?: BranchInfo[];
  currentBranchOrSite?: BranchInfo;
  saveSetting?: (key: string) => Promise<void>;
  saving?: boolean;
  edited?: Record<string, string>;
}

export function AttendanceScheduleCard({
  getVal,
  updateValue,
  settingsScope = "all",
  setSettingsScope,
  visibleBranches = [],
  currentBranchOrSite,
  saveSetting,
  saving = false,
  edited = {},
}: AttendanceScheduleCardProps) {
  const isSiteOrBranch = settingsScope !== "all" && currentBranchOrSite;

  return (
    <div className="w-full border border-[#253C7D]/30 bg-white rounded-2xl overflow-hidden shadow-xs transition-all">
      {/* Header with Scope Switcher */}
      <div className="bg-[#253C7D] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#253C7D] flex items-center justify-center shrink-0 shadow-xs font-bold">
            <i className="ri-calendar-schedule-line text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-bold">
                {isSiteOrBranch
                  ? `${currentBranchOrSite.name} Schedule`
                  : "Company-Wide Attendance Schedule Defaults"}
              </h3>
              {isSiteOrBranch && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {currentBranchOrSite.is_site ? "Work Site Override" : "Branch Override"}
                </span>
              )}
            </div>
            <p className="text-[12px] text-white/80 mt-0.5">
              {isSiteOrBranch
                ? `Custom working hours and lunch break for ${currentBranchOrSite.name}. Overrides company defaults.`
                : "Default working days, shift hours, lunch break, and grace periods for the whole company."}
            </p>
          </div>
        </div>

        {/* Location / Branch Selector Dropdown */}
        {setSettingsScope && visibleBranches.length > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <label className="text-[11px] text-white/70 font-semibold uppercase tracking-wider hidden md:block">
              Schedule Scope:
            </label>
            <select
              value={settingsScope}
              onChange={(e) => setSettingsScope(e.target.value)}
              className="px-3.5 py-2 bg-white text-[#253C7D] rounded-xl text-xs font-bold border border-white/20 shadow-xs focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
            >
              <option value="all">🏢 Company-Wide Defaults</option>
              {visibleBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.is_site ? `📍 Site: ${b.name}` : `🏢 Branch: ${b.name}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* If editing a site, highlight 4-punch mode toggle */}
        {isSiteOrBranch && currentBranchOrSite.is_site && (
          <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
            <div className="flex items-center gap-2.5">
              <i className="ri-fingerprint-line text-indigo-700 text-base" />
              <div>
                <span className="text-xs font-bold text-gray-900">4-Punch Attendance Mode</span>
                <p className="text-[11px] text-gray-500">Requires 4 daily scans: Morning In, Lunch Out, Lunch In, Evening Out</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={getVal("is_four_punch_enabled") === "true"}
                onChange={(e) => updateValue("is_four_punch_enabled", String(e.target.checked))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#253C7D]"></div>
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ATTENDANCE_SCHEDULE_KEYS.map((key) => {
            const isSiteEditable = ["work_start_time", "work_end_time", "break_start_time", "break_end_time", "late_grace_minutes", "early_leave_grace_minutes"].includes(key);
            const isBranchEditable = ["work_start_time", "work_end_time", "late_grace_minutes", "early_leave_grace_minutes"].includes(key);
            const isCustomField = isSiteOrBranch && (currentBranchOrSite.is_site ? isSiteEditable : isBranchEditable);

            return (
              <div key={key} className={`min-w-0 p-3 rounded-xl border ${isCustomField ? "border-blue-200 bg-blue-50/30" : "border-gray-100 bg-white"}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-bold text-gray-800">
                    {keyLabels[key]}
                  </label>
                  {isCustomField && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#253C7D]">
                      {currentBranchOrSite.is_site ? "Site Custom" : "Branch Custom"}
                    </span>
                  )}
                  {isSiteOrBranch && !isCustomField && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                      Company Default
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-1">
                  <input
                    type={
                      key.includes("time")
                        ? "time"
                        : key === "working_days"
                          ? "text"
                          : "number"
                    }
                    value={getVal(key)}
                    onChange={(e) => updateValue(key, e.target.value)}
                    className="min-w-0 flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#253C7D]"
                  />
                  {edited[key] !== undefined && saveSetting && (
                    <button
                      onClick={() => saveSetting(key)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-[#253C7D] text-white text-xs font-bold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-gray-500 border-t border-gray-100 pt-4 leading-relaxed">
          {isSiteOrBranch ? (
            <>
              ✨ You are currently configuring working hours specifically for <strong>{currentBranchOrSite.name}</strong>. All employees assigned to this location will follow these exact schedule and break rules.
            </>
          ) : (
            <>
              Working days use day numbers: Sunday 0, Monday 1 through Saturday 6. Example:{" "}
              <strong className="text-gray-800 font-bold">1,2,3,4,5</strong> for Monday–Friday, or{" "}
              <strong className="text-gray-800 font-bold">1,2,3,4,5,6</strong> to add Saturday half-day. Break hours are deducted from worked hours calculation.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
