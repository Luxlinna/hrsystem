import React from "react";
import { FormRow } from "./FormRow";
import { CountryPhoneInput } from "./CountryPhoneInput";
import type { BranchFormState } from "../../types";

interface ContactAndTimezoneSectionProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
}

export function ContactAndTimezoneSection({
  form,
  setForm,
}: ContactAndTimezoneSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* CONTACT INFO */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
          Contact Info
        </h3>

        {/* Phone Number */}
        <FormRow label="Phone Number">
          <CountryPhoneInput
            value={form.phone_number}
            onChange={(val) => setForm((prev) => ({ ...prev, phone_number: val }))}
            placeholder="+855987654321"
          />
        </FormRow>

        {/* Email */}
        <FormRow label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
          />
        </FormRow>

        {/* Website */}
        <FormRow label="Website">
          <input
            type="text"
            value={form.website}
            onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
            placeholder="Website"
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
          />
        </FormRow>
      </div>
    </div>
  );
}
