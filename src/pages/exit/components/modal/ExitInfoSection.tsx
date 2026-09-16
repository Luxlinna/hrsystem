import { memo } from "react";
import type { ExitFormState, ExitType, ReasonType } from "../../types";
import { EXIT_TYPE_CONFIG, EXIT_TYPE_ORDER, REASON_TYPE_CONFIG, REASON_TYPE_ORDER } from "../../constants";

interface ExitInfoSectionProps {
  form: ExitFormState;
  onChange: (field: keyof ExitFormState, value: any) => void;
}

export const ExitInfoSection = memo(function ExitInfoSection({
  form,
  onChange,
}: ExitInfoSectionProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="text-xs font-black tracking-wider text-sky-600 uppercase border-b border-slate-100 pb-1.5">
        Exit Info
      </div>

      {/* Exit Type */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
        <label className="text-xs font-bold text-slate-700">
          Exit Type <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-3 relative">
          <select
            required
            value={form.exit_type}
            onChange={(e) => onChange("exit_type", e.target.value as ExitType)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] cursor-pointer appearance-none pr-8"
          >
            <option value="">Search...</option>
            {EXIT_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {EXIT_TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
        </div>
      </div>

      {/* Effective Date */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
        <label className="text-xs font-bold text-slate-700">
          Effective Date <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-3 relative">
          <input
            type="date"
            required
            value={form.last_working_day}
            onChange={(e) => onChange("last_working_day", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all"
          />
        </div>
      </div>

      {/* Reason Type */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
        <label className="text-xs font-bold text-slate-700">
          Reason Type
        </label>
        <div className="md:col-span-3 relative">
          <select
            value={form.reason_type}
            onChange={(e) => onChange("reason_type", e.target.value as ReasonType)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] cursor-pointer appearance-none pr-8"
          >
            <option value="">Reason Type</option>
            {REASON_TYPE_ORDER.map((rt) => (
              <option key={rt} value={rt}>
                {REASON_TYPE_CONFIG[rt]?.label || rt}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
        </div>
      </div>

      {/* Reason */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-start">
        <label className="text-xs font-bold text-slate-700 md:pt-2.5">
          Reason <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-3">
          <textarea
            required
            rows={4}
            value={form.reason_description}
            onChange={(e) => onChange("reason_description", e.target.value)}
            placeholder="Reason"
            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all resize-y"
          />
        </div>
      </div>

      {/* Black List Checkbox */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
        <div className="hidden md:block" />
        <div className="md:col-span-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="exit-blacklist-checkbox"
            checked={form.is_blacklisted}
            onChange={(e) => onChange("is_blacklisted", e.target.checked)}
            className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
          />
          <label htmlFor="exit-blacklist-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
            Black List
          </label>
          {form.is_blacklisted && (
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-in fade-in">
              Flagged for no re-hire
            </span>
          )}
        </div>
      </div>

      {/* Remark */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-start">
        <label className="text-xs font-bold text-slate-700 md:pt-2.5">
          Remark
        </label>
        <div className="md:col-span-3">
          <textarea
            rows={3}
            value={form.remark}
            onChange={(e) => onChange("remark", e.target.value)}
            placeholder="Remark"
            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all resize-y"
          />
        </div>
      </div>
    </div>
  );
});
