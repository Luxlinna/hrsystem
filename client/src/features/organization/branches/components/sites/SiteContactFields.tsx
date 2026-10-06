import React from "react";
import { FormRow } from "../profile/FormRow";
import { CountryPhoneInput } from "../profile/CountryPhoneInput";
import type { WorkSiteFormState } from "../../types";

interface Props {
  form: WorkSiteFormState;
  setForm: React.Dispatch<React.SetStateAction<WorkSiteFormState>>;
  isReadOnly?: boolean;
}

export function SiteContactFields({ form, setForm, isReadOnly = false }: Props) {
  return (
    <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
        Contact Info
      </h3>

      <FormRow label="Phone Number">
        {isReadOnly ? (
          <input
            type="text"
            readOnly
            disabled
            value={form.phone_number || "—"}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100"
          />
        ) : (
          <CountryPhoneInput
            value={form.phone_number}
            onChange={(val) => setForm((prev) => ({ ...prev, phone_number: val }))}
            placeholder="+855987654321"
          />
        )}
      </FormRow>

      <FormRow label="Email">
        <input
          type="email"
          disabled={isReadOnly}
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
        />
      </FormRow>

      <FormRow label="Website">
        <input
          type="text"
          disabled={isReadOnly}
          value={form.website}
          onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
          placeholder="Website"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
        />
      </FormRow>
    </div>
  );
}
