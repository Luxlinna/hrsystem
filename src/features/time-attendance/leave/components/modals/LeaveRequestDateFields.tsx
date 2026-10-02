import { memo } from "react";
import type { LeaveFormData } from "../../types";
import { toYMD } from "../../dateUtils";

interface LeaveRequestDateFieldsProps {
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  requestedDays: number;
  remainingDays: number | null;
  isOverBalance: boolean;
}

export const LeaveRequestDateFields = memo(function LeaveRequestDateFields({
  formData,
  setFormData,
  requestedDays,
  remainingDays,
  isOverBalance,
}: LeaveRequestDateFieldsProps) {
  const setDatePreset = (preset: "today" | "tomorrow" | "3days" | "thisWeek" | "nextWeek") => {
    const now = new Date();
    const s = new Date(now);
    const e = new Date(now);

    if (preset === "tomorrow") {
      s.setDate(s.getDate() + 1);
      e.setDate(e.getDate() + 1);
    } else if (preset === "3days") {
      e.setDate(e.getDate() + 2);
    } else if (preset === "thisWeek") {
      const day = s.getDay();
      const diff = s.getDate() - day + (day === 0 ? -6 : 1);
      s.setDate(diff);
      e.setDate(diff + 4);
    } else if (preset === "nextWeek") {
      const day = s.getDay();
      const diff = s.getDate() - day + (day === 0 ? 1 : 8);
      s.setDate(diff);
      e.setDate(diff + 4);
    }

    setFormData((prev) => ({
      ...prev,
      start_date: toYMD(s),
      end_date: toYMD(e),
    }));
  };

  return (
    <>
      <div>
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
          Quick Presets
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Today", val: "today" as const },
            { label: "Tomorrow", val: "tomorrow" as const },
            { label: "3 Days", val: "3days" as const },
            { label: "This Week (M-F)", val: "thisWeek" as const },
            { label: "Next Week (M-F)", val: "nextWeek" as const },
          ].map((p) => (
            <button
              key={p.val}
              type="button"
              onClick={() => setDatePreset(p.val)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Start Date *
          </label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            End Date *
          </label>
          <input
            type="date"
            required
            value={formData.end_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          />
        </div>
      </div>

      {formData.start_date && formData.end_date && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            isOverBalance
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-[#253C7D]/5 border-[#253C7D]/20 text-[#253C7D]"
          }`}
        >
          <span>Requested: {requestedDays} working day(s)</span>
          {remainingDays !== null && (
            <span>
              Remaining allowance: {remainingDays} day(s)
              {isOverBalance && " (Insufficient)"}
            </span>
          )}
        </div>
      )}
    </>
  );
});
