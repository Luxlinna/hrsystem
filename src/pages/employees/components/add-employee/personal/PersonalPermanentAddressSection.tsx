import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalPermanentAddressSection = memo(function PersonalPermanentAddressSection({
  form,
  onChange,
}: PersonalSectionProps) {
  return (
    <div className="pt-6 border-t border-slate-200 w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
            <i className="ri-map-pin-user-line text-xs" />
          </span>
          <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
            Permanent Address Info
          </h3>
        </div>

        {/* Same as Present Address Toggle */}
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer select-none transition-colors shadow-2xs">
          <input
            type="checkbox"
            checked={form.same_as_present_address !== false}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange("same_as_present_address", checked);
              if (checked && form.current_address) {
                onChange("permanent_address", form.current_address);
              }
            }}
            className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
          />
          <span>Same as Present Address</span>
        </label>
      </div>

      {/* Grid of Address Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Address */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Address
          </label>
          <input
            type="text"
            value={form.permanent_address || ""}
            onChange={(e) => onChange("permanent_address", e.target.value)}
            placeholder="e.g. Street 271, Sangkat Boeng Tumpun"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            City
          </label>
          <input
            type="text"
            value={form.permanent_city || ""}
            onChange={(e) => onChange("permanent_city", e.target.value)}
            placeholder="e.g. Phnom Penh"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>

        {/* Province */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Province
          </label>
          <input
            type="text"
            value={form.permanent_province || ""}
            onChange={(e) => onChange("permanent_province", e.target.value)}
            placeholder="e.g. Kandal"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>

        {/* Postal Code */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Postal Code
          </label>
          <input
            type="text"
            value={form.permanent_postal_code || ""}
            onChange={(e) => onChange("permanent_postal_code", e.target.value)}
            placeholder="e.g. 12000"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Country <span className="text-rose-500">*</span>
          </label>
          <select
            value={form.permanent_country || "Cambodia"}
            onChange={(e) => onChange("permanent_country", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer transition-all shadow-2xs"
          >
            <option value="Cambodia">Cambodia</option>
            <option value="Thailand">Thailand</option>
            <option value="Vietnam">Vietnam</option>
            <option value="China">China</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="France">France</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
});
