import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalContactSection = memo(function PersonalContactSection({
  form,
  onChange,
}: PersonalSectionProps) {
  return (
    <div className="pt-6 border-t border-slate-200 max-w-4xl mx-auto space-y-4">
      <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider mb-2">
        Contact Info
      </h3>

      {/* Phone Number */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Phone Number <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2 relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1 text-slate-500 pointer-events-none select-none text-xs">
            <span className="text-base leading-none">🇰🇭</span>
            <i className="ri-arrow-down-s-line text-[10px] text-slate-400" />
          </div>
          <input
            type="tel"
            required
            value={form.phone || ""}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="091 234 567"
            className="w-full pl-12 pr-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* Home Phone Number */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Home Phone Number
        </label>
        <div className="sm:col-span-2 relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1 text-slate-500 pointer-events-none select-none text-xs">
            <span className="text-base leading-none">🇰🇭</span>
            <i className="ri-arrow-down-s-line text-[10px] text-slate-400" />
          </div>
          <input
            type="tel"
            value={form.home_phone || ""}
            onChange={(e) => onChange("home_phone", e.target.value)}
            placeholder="091 234 567"
            className="w-full pl-12 pr-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* Office Phone Number */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Office Phone Number
        </label>
        <div className="sm:col-span-2 relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1 text-slate-500 pointer-events-none select-none text-xs">
            <span className="text-base leading-none">🇰🇭</span>
            <i className="ri-arrow-down-s-line text-[10px] text-slate-400" />
          </div>
          <input
            type="tel"
            value={form.office_phone || ""}
            onChange={(e) => onChange("office_phone", e.target.value)}
            placeholder="091 234 567"
            className="w-full pl-12 pr-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* Email */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Email
        </label>
        <div className="sm:col-span-2">
          <input
            type="email"
            value={form.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="Email"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>
    </div>
  );
});
