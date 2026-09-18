import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalContactSection = memo(function PersonalContactSection({
  form,
  onChange,
}: PersonalSectionProps) {
  return (
    <div className="pt-6 border-t border-slate-200 w-full space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
          <i className="ri-contacts-book-2-line text-xs" />
        </span>
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Contact Info
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Phone Number */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
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
              className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Home Phone Number */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Home Phone Number
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 flex items-center gap-1 text-slate-500 pointer-events-none select-none text-xs">
              <span className="text-base leading-none">🇰🇭</span>
              <i className="ri-arrow-down-s-line text-[10px] text-slate-400" />
            </div>
            <input
              type="tel"
              value={form.home_phone || ""}
              onChange={(e) => onChange("home_phone", e.target.value)}
              placeholder="091 234 567"
              className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Office Phone Number */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Office Phone Number
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3 flex items-center gap-1 text-slate-500 pointer-events-none select-none text-xs">
              <span className="text-base leading-none">🇰🇭</span>
              <i className="ri-arrow-down-s-line text-[10px] text-slate-400" />
            </div>
            <input
              type="tel"
              value={form.office_phone || ""}
              onChange={(e) => onChange("office_phone", e.target.value)}
              placeholder="091 234 567"
              className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="e.g. employee@company.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
});
