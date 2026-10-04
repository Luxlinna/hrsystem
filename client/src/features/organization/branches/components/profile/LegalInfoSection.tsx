import React, { useState, useEffect } from "react";
import { FormRow } from "./FormRow";
import { CountryPhoneInput } from "./CountryPhoneInput";
import type { BranchFormState } from "../../types";
import { parseLegalAddress, formatLegalAddress } from "../../utils/legalAddressUtils";

interface LegalInfoSectionProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
}

export function LegalInfoSection({
  form,
  setForm,
}: LegalInfoSectionProps) {
  const [addrParts, setAddrParts] = useState(() => parseLegalAddress(form.legal_address));

  useEffect(() => {
    setAddrParts(parseLegalAddress(form.legal_address));
  }, [form.legal_address]);

  const handleAddrPartChange = (field: keyof typeof addrParts, val: string) => {
    const updated = { ...addrParts, [field]: val };
    setAddrParts(updated);
    setForm((prev) => ({
      ...prev,
      legal_address: formatLegalAddress(updated),
    }));
  };

  return (
    <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
        Legal Info
      </h3>

      {/* Tax Number */}
      <FormRow label="Tax Number">
        <input
          type="text"
          value={form.legal_tax_number}
          onChange={(e) => setForm((prev) => ({ ...prev, legal_tax_number: e.target.value }))}
          placeholder="Tax Number"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Legal Name */}
      <FormRow label="Legal Name">
        <input
          type="text"
          value={form.legal_name}
          onChange={(e) => setForm((prev) => ({ ...prev, legal_name: e.target.value }))}
          placeholder="Legal Name"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Business Activity */}
      <FormRow label="Business Activity" alignTop>
        <textarea
          rows={4}
          value={form.legal_business_activity}
          onChange={(e) => setForm((prev) => ({ ...prev, legal_business_activity: e.target.value }))}
          placeholder="Business Activity"
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] resize-y"
        />
      </FormRow>

      {/* Address (Structured) */}
      <FormRow label="Address" alignTop>
        <div className="space-y-2">
          {/* Row 1: No, Street, Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={addrParts.no}
              onChange={(e) => handleAddrPartChange("no", e.target.value)}
              placeholder="No"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
            <input
              type="text"
              value={addrParts.street}
              onChange={(e) => handleAddrPartChange("street", e.target.value)}
              placeholder="Street"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
            <input
              type="text"
              value={addrParts.group}
              onChange={(e) => handleAddrPartChange("group", e.target.value)}
              placeholder="Group"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
          </div>

          {/* Row 2: Village, Sangkat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={addrParts.village}
              onChange={(e) => handleAddrPartChange("village", e.target.value)}
              placeholder="Village"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
            <input
              type="text"
              value={addrParts.sangkat}
              onChange={(e) => handleAddrPartChange("sangkat", e.target.value)}
              placeholder="Sangkat"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
          </div>

          {/* Row 3: District, Municipality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={addrParts.district}
              onChange={(e) => handleAddrPartChange("district", e.target.value)}
              placeholder="District"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
            <input
              type="text"
              value={addrParts.municipality}
              onChange={(e) => handleAddrPartChange("municipality", e.target.value)}
              placeholder="Municipality"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
          </div>
        </div>
      </FormRow>

      {/* Phone Number */}
      <FormRow label="Phone Number">
        <CountryPhoneInput
          value={form.legal_phone_number}
          onChange={(val) => setForm((prev) => ({ ...prev, legal_phone_number: val }))}
          placeholder="+855987654321"
        />
      </FormRow>

      {/* Email */}
      <FormRow label="Email">
        <input
          type="email"
          value={form.legal_email}
          onChange={(e) => setForm((prev) => ({ ...prev, legal_email: e.target.value }))}
          placeholder="Email"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>
    </div>
  );
}
