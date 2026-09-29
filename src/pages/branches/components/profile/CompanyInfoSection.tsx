import React, { useRef } from "react";
import { FormRow } from "./FormRow";
import type { BranchFormState } from "../../types";

interface CompanyInfoSectionProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
  uploadingLogo: boolean;
  onUploadLogo: (file: File) => void;
}

const INDUSTRY_OPTIONS = [
  "Trading, Import & Export",
  "Information Technology & Services",
  "Retail & Supermarkets",
  "Manufacturing & Production",
  "Food & Beverage (F&B)",
  "Hospitality & Tourism",
  "Banking & Financial Services",
  "Construction & Real Estate",
  "Healthcare & Pharmaceuticals",
  "Education & Training",
  "Logistics & Transportation",
  "Other",
];

const CURRENCY_OPTIONS = ["USD", "KHR", "THB", "EUR", "SGD", "VND"];
const ROUNDING_OPTIONS = ["0", "1", "2", "3", "4"];

export function CompanyInfoSection({
  form,
  setForm,
  uploadingLogo,
  onUploadLogo,
}: CompanyInfoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDomainChange = (val: string) => {
    // Strip http:// or https:// or domain endings if user types full URL
    const clean = val
      .replace(/^https?:\/\//i, "")
      .replace(/\.corarlhr\.com$/i, "")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase();
    setForm((prev) => ({ ...prev, domain: clean }));
  };

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
        Company Info
      </h3>

      {/* 1. Logo Row */}
      <FormRow label="Logo" alignTop>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadLogo(file);
              e.target.value = "";
            }}
            className="hidden"
          />

          {/* Logo Display Card */}
          <div className="w-48 h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-center shadow-2xs overflow-hidden">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="Company Logo"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center text-slate-400">
                <i className="ri-image-line text-2xl block" />
                <span className="text-[10px]">No Logo Selected</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploadingLogo}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-medium rounded shadow-2xs cursor-pointer transition-colors disabled:opacity-60"
            >
              {uploadingLogo ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <i className="ri-camera-fill text-xs" />
                  <span>UploadLogo</span>
                </>
              )}
            </button>

            {form.logo_url && !uploadingLogo && (
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, logo_url: "" }))}
                className="text-xs text-rose-500 hover:underline cursor-pointer px-2 py-1"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </FormRow>

      {/* 2. Company Name */}
      <FormRow label="Company Name" required>
        <input
          type="text"
          value={form.company_name}
          onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
          placeholder="Company Name"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* 3. Registration No. */}
      <FormRow label="Registration No.">
        <input
          type="text"
          value={form.registration_no}
          onChange={(e) => setForm((prev) => ({ ...prev, registration_no: e.target.value }))}
          placeholder="Registration No."
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* 4. VAT No. */}
      <FormRow label="VAT No.">
        <input
          type="text"
          value={form.vat_no}
          onChange={(e) => setForm((prev) => ({ ...prev, vat_no: e.target.value }))}
          placeholder="VAT No."
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* 5. Industry */}
      <FormRow label="Industry">
        <select
          value={form.industry || INDUSTRY_OPTIONS[0]}
          onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
        >
          {INDUSTRY_OPTIONS.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </FormRow>

      {/* 6. Corarl Domain */}
      <FormRow label="Corarl Domain" required>
        <div className="flex items-center rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden text-xs">
          <span className="px-3 py-1.5 text-slate-500 bg-slate-100 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 select-none">
            https://
          </span>
          <input
            type="text"
            value={form.domain}
            onChange={(e) => handleDomainChange(e.target.value)}
            placeholder="circlekcambodia"
            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="px-3 py-1.5 text-slate-500 bg-slate-100 dark:bg-slate-900 border-l border-slate-300 dark:border-slate-700 select-none">
            .corarlhr.com
          </span>
        </div>
      </FormRow>

      {/* 7. Currency */}
      <FormRow label="Currency" required>
        <select
          value={form.currency || "USD"}
          onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormRow>

      {/* 8. Rounding Digit */}
      <FormRow label="Rounding Digit" required>
        <select
          value={form.rounding_digit != null ? String(form.rounding_digit) : "2"}
          onChange={(e) => setForm((prev) => ({ ...prev, rounding_digit: e.target.value }))}
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
        >
          {ROUNDING_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </FormRow>
    </div>
  );
}
