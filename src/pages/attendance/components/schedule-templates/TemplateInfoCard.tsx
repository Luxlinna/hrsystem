import { memo } from "react";
import { useBranchScope } from "@/context/BranchContext";
import type { ManagedShift } from "../shifts-manager/types";
import type { ScheduleTemplateDayAssignment } from "./types";

interface TemplateInfoCardProps {
  title: string;
  setTitle: (v: string) => void;
  siteName: string;
  setSiteName: (name: string) => void;
  setSiteId: (id: string) => void;
  days: ScheduleTemplateDayAssignment;
  setDays: React.Dispatch<React.SetStateAction<ScheduleTemplateDayAssignment>>;
  remark: string;
  setRemark: (v: string) => void;
  availableShifts: ManagedShift[];
  onCopyMonToWeekdays: () => void;
  onSetWeekendOff: () => void;
}

const DAY_FIELDS: Array<{ key: keyof ScheduleTemplateDayAssignment; label: string }> = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export const TemplateInfoCard = memo(function TemplateInfoCard({
  title,
  setTitle,
  siteName,
  setSiteName,
  setSiteId,
  days,
  setDays,
  remark,
  setRemark,
  availableShifts,
  onCopyMonToWeekdays,
  onSetWeekendOff,
}: TemplateInfoCardProps) {
  const { visibleBranches } = useBranchScope();

  const updateDay = (dayKey: keyof ScheduleTemplateDayAssignment, value: string) => {
    setDays((prev) => ({ ...prev, [dayKey]: value }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <i className="ri-calendar-schedule-line text-base text-[#253C7D] dark:text-sky-400" />
          Schedule Template Info
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopyMonToWeekdays}
            className="text-[11px] font-bold text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer"
          >
            Copy Mon &rarr; Fri
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={onSetWeekendOff}
            className="text-[11px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Set Sat &amp; Sun OFF
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Audit Shift HQ10 - 07:00PM - 04:00AM (26 Days)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Site / Business Unit (BU)
          </label>
          <div className="relative flex items-center gap-2">
            <select
              value={siteName}
              onChange={(e) => {
                const sel = e.target.value;
                setSiteName(sel);
                const match = visibleBranches.find((b) => b.name === sel);
                setSiteId(match?.id || "");
              }}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer appearance-none pr-8 shadow-2xs"
            >
              <option value="All">All Sites / BUs</option>
              {visibleBranches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.is_site ? `\u00A0\u00A0↳ ${b.name} (Site)` : b.name}
                </option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-2">
          {DAY_FIELDS.map((day) => {
            const val = days[day.key] || "";
            return (
              <div key={day.key}>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  {day.label} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={val}
                    onChange={(e) => updateDay(day.key, e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer appearance-none pr-7 shadow-2xs"
                  >
                    <option value="">Select</option>
                    <option value="OFF">OFF</option>
                    {availableShifts.map((s) => (
                      <option key={s.id} value={s.code || s.name}>
                        {s.code ? `${s.code} - ${s.name}` : s.name}
                      </option>
                    ))}
                    {val && val !== "OFF" && !availableShifts.some((s) => (s.code || s.name) === val) && (
                      <option value={val}>{val}</option>
                    )}
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Remark
          </label>
          <textarea
            rows={2}
            placeholder="Enter optional remark or shift scan rules (e.g. Schedule Scan Break 4 times per day)..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] shadow-2xs resize-none"
          />
        </div>
      </div>
    </div>
  );
});
