import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalPermanentAddressSection = memo(function PersonalPermanentAddressSection({
  form,
  onChange,
}: PersonalSectionProps) {
  return (
    <div className="pt-6 border-t border-slate-200 max-w-4xl mx-auto space-y-4">
      <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider mb-2">
        Permanent Address Info
      </h3>

      {/* Address */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4 pt-2">
          Address
        </label>
        <div className="sm:col-span-2">
          <textarea
            rows={2}
            value={form.permanent_address}
            onChange={(e) => onChange("permanent_address", e.target.value)}
            placeholder="Address"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* City */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          City
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={form.permanent_city}
            onChange={(e) => onChange("permanent_city", e.target.value)}
            placeholder="City"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* Province */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Province
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={form.permanent_province}
            onChange={(e) => onChange("permanent_province", e.target.value)}
            placeholder="Province"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* Postal Code */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Postal Code
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={form.permanent_postal_code}
            onChange={(e) => onChange("permanent_postal_code", e.target.value)}
            placeholder="Postal Code"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* Country */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Country <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.permanent_country || "Cambodia"}
            onChange={(e) => onChange("permanent_country", e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
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

      {/* Same as Present Address Checkbox */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <div className="sm:text-right sm:pr-4" />
        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
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
      </div>
    </div>
  );
});
