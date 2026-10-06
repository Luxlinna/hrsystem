import React, { useState, useEffect } from "react";
import { FormRow } from "../profile/FormRow";
import type { WorkSiteFormState } from "../../types";

interface Props {
  form: WorkSiteFormState;
  setForm: React.Dispatch<React.SetStateAction<WorkSiteFormState>>;
  companyName: string;
  isReadOnly?: boolean;
}

const PRESET_SITE_TYPES = ["Head Office", "Store", "Warehouse", "Branch", "Processing Center"];

export function SiteInfoFields({ form, setForm, companyName, isReadOnly = false }: Props) {
  const isCustomTypeInitial = Boolean(
    form.site_type && !PRESET_SITE_TYPES.includes(form.site_type)
  );
  const [isCustomType, setIsCustomType] = useState(isCustomTypeInitial);
  const [customTypeText, setCustomTypeText] = useState(isCustomTypeInitial ? form.site_type || "" : "");

  useEffect(() => {
    const isCustom = Boolean(form.site_type && !PRESET_SITE_TYPES.includes(form.site_type));
    setIsCustomType(isCustom);
    if (isCustom) setCustomTypeText(form.site_type || "");
  }, [form.site_type]);

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
        Site Info
      </h3>

      <FormRow label="Site Name" required>
        <input
          type="text"
          required
          disabled={isReadOnly}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Site Name"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50 dark:disabled:bg-slate-800/60"
        />
      </FormRow>

      <FormRow label="Company Name">
        <input
          type="text"
          readOnly
          disabled
          value={companyName}
          placeholder="Company Name"
          className="w-full px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-600 dark:text-slate-300 cursor-not-allowed select-none"
        />
      </FormRow>

      <FormRow label="Site Type">
        <div className="space-y-2">
          <select
            disabled={isReadOnly}
            value={isCustomType ? "Other" : form.site_type || PRESET_SITE_TYPES[0]}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "Other") {
                setIsCustomType(true);
                setForm((prev) => ({ ...prev, site_type: customTypeText || "" }));
              } else {
                setIsCustomType(false);
                setForm((prev) => ({ ...prev, site_type: val }));
              }
            }}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer disabled:cursor-not-allowed"
          >
            {PRESET_SITE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>

          {isCustomType && (
            <input
              type="text"
              required
              disabled={isReadOnly}
              value={customTypeText}
              onChange={(e) => {
                const val = e.target.value;
                setCustomTypeText(val);
                setForm((prev) => ({ ...prev, site_type: val }));
              }}
              placeholder="Specify site type (e.g. Kiosk, Booth, Farm, Lab)"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
          )}
        </div>
      </FormRow>
    </div>
  );
}
