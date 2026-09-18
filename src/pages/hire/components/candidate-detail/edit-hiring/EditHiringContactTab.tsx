import { memo } from "react";
import type { EditHiringFormData } from "./types";

interface EditHiringContactTabProps {
  formData: EditHiringFormData;
  onChange: (field: keyof EditHiringFormData, value: string) => void;
}

export const EditHiringContactTab = memo(function EditHiringContactTab({
  formData,
  onChange,
}: EditHiringContactTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/90 via-pink-50/40 to-white border border-purple-200/80 flex items-start gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <i className="ri-contacts-book-2-line text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black text-slate-900 tracking-wide">
              Contact &amp; Emergency Information
            </h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200/60">
              Step 5 of 5
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
            Candidate direct contact channels, current residential address, and emergency point-of-contact details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="candidate@company.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="e.g. +855 12 345 678"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Current Address */}
        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Current Residential Address
          </label>
          <textarea
            rows={2}
            value={formData.current_address}
            onChange={(e) => onChange("current_address", e.target.value)}
            placeholder="Candidate residential address"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Emergency Contact Name */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Emergency Contact Name &amp; Relationship
          </label>
          <input
            type="text"
            value={formData.emergency_contact_name}
            onChange={(e) => onChange("emergency_contact_name", e.target.value)}
            placeholder="e.g. Sok Chenda (Spouse / Parent)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Emergency Phone Number */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Emergency Phone Number
          </label>
          <input
            type="tel"
            value={formData.emergency_phone_number}
            onChange={(e) => onChange("emergency_phone_number", e.target.value)}
            placeholder="e.g. +855 16 999 888"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>
    </div>
  );
});
