import React, { useState } from "react";
import { FormRow } from "./FormRow";
import type { BranchFormState } from "../../types";

interface PhysicalAddressSectionProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
}

const COUNTRY_OPTIONS = [
  "Cambodia",
  "Thailand",
  "Vietnam",
  "Singapore",
  "Malaysia",
  "Philippines",
  "Indonesia",
  "United States",
  "Other",
];

export function PhysicalAddressSection({
  form,
  setForm,
}: PhysicalAddressSectionProps) {
  const [sameAsMailing, setSameAsMailing] = useState(true);

  const handleSameAsMailingToggle = (checked: boolean) => {
    setSameAsMailing(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        mailing_address: prev.physical_address,
        mailing_city: prev.physical_city,
        mailing_province: prev.physical_province,
        mailing_postal_code: prev.physical_postal_code,
        mailing_country: prev.physical_country,
      }));
    }
  };

  const updatePhysicalAddress = (key: keyof BranchFormState, val: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (sameAsMailing) {
        if (key === "physical_address") next.mailing_address = val;
        if (key === "physical_city") next.mailing_city = val;
        if (key === "physical_province") next.mailing_province = val;
        if (key === "physical_postal_code") next.mailing_postal_code = val;
        if (key === "physical_country") next.mailing_country = val;
      }
      return next;
    });
  };

  return (
    <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
        Physical Address Info
      </h3>

      {/* Address */}
      <FormRow label="Address">
        <input
          type="text"
          value={form.physical_address}
          onChange={(e) => updatePhysicalAddress("physical_address", e.target.value)}
          placeholder="#City tower Building, 321, Mao Tse Toung Blvd..."
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* City */}
      <FormRow label="City">
        <input
          type="text"
          value={form.physical_city}
          onChange={(e) => updatePhysicalAddress("physical_city", e.target.value)}
          placeholder="Phnom Penh"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Province */}
      <FormRow label="Province">
        <input
          type="text"
          value={form.physical_province}
          onChange={(e) => updatePhysicalAddress("physical_province", e.target.value)}
          placeholder="Province"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Postal Code */}
      <FormRow label="Postal Code">
        <input
          type="text"
          value={form.physical_postal_code}
          onChange={(e) => updatePhysicalAddress("physical_postal_code", e.target.value)}
          placeholder="Postal Code"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Country */}
      <FormRow label="Country">
        <select
          value={form.physical_country || COUNTRY_OPTIONS[0]}
          onChange={(e) => updatePhysicalAddress("physical_country", e.target.value)}
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormRow>

      {/* Same as Mailing Address Checkbox */}
      <FormRow label="">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={sameAsMailing}
            onChange={(e) => handleSameAsMailingToggle(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#2b8de3] focus:ring-[#2b8de3] cursor-pointer"
          />
          <span>Same as Mailing Address</span>
        </label>
      </FormRow>
    </div>
  );
}
