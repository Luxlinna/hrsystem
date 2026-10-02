import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalPermanentAddressSection = memo(function PersonalPermanentAddressSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleCurrentAddressChange = (val: string) => {
    onChange("current_address", val);
    if (form.same_as_present_address !== false) {
      onChange("permanent_address", val);
    }
  };

  const handleSameAsPresentToggle = (checked: boolean) => {
    onChange("same_as_present_address", checked);
    if (checked && form.current_address) {
      onChange("permanent_address", form.current_address);
    }
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full space-y-5">
      {/* 1. Current / Present Address */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
            <i className="ri-map-pin-line text-xs" />
          </span>
          <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
            Current Address Info
          </h3>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Current Address
          </label>
          <input
            type="text"
            value={form.current_address || ""}
            onChange={(e) => handleCurrentAddressChange(e.target.value)}
            placeholder="e.g. Street 271, Sangkat Boeng Tumpun, Phnom Penh"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* 2. Permanent Address */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
            <i className="ri-map-pin-user-line text-xs" />
          </span>
          <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
            Permanent Address Info
          </h3>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Permanent Address
          </label>
          <input
            type="text"
            value={form.permanent_address || ""}
            onChange={(e) => onChange("permanent_address", e.target.value)}
            placeholder="e.g. Street 271, Sangkat Boeng Tumpun, Phnom Penh"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>

        {/* Same as Present Address Toggle */}
        <div className="pt-1">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer select-none transition-colors shadow-2xs">
            <input
              type="checkbox"
              checked={form.same_as_present_address !== false}
              onChange={(e) => handleSameAsPresentToggle(e.target.checked)}
              className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
            />
            <span>Same as Current Address</span>
          </label>
        </div>
      </div>
    </div>
  );
});
