import React, { useRef } from "react";
import { FormRow } from "./FormRow";
import { BiometricHardwareField } from "./BiometricHardwareField";
import type { BranchFormState } from "../../types";

interface CompanyInfoSectionProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
  uploadingLogo: boolean;
  onUploadLogo: (file: File) => void;
  branchId?: string;
  branchName?: string;
}

const INDUSTRY_OPTIONS = [
  "Trading, Import & Export", "Information Technology & Services", "Retail & Supermarkets",
  "Manufacturing & Production", "Food & Beverage (F&B)", "Hospitality & Tourism",
  "Banking & Financial Services", "Construction & Real Estate", "Healthcare & Pharmaceuticals",
  "Education & Training", "Logistics & Transportation", "Other",
];
const CURRENCIES = ["USD", "KHR", "THB", "EUR", "SGD", "VND"];
const ROUNDINGS = ["0", "1", "2", "3", "4"];

export function CompanyInfoSection({ form, setForm, uploadingLogo, onUploadLogo, branchId, branchName }: CompanyInfoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">Company Info</h3>

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

          <div className="w-64 h-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex items-center justify-center shadow-2xs overflow-hidden">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Company Logo" className="max-h-full max-w-full object-contain" />
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
                  <span>Upload Logo</span>
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

      {/* 2. Company / BU Name */}
      <FormRow label="Company Name" required>
        <input
          type="text"
          required
          value={form.company_name}
          onChange={(e) => {
            const val = e.target.value;
            setForm((prev) => ({ ...prev, company_name: val, name: prev.name ? prev.name : val }));
          }}
          placeholder="Company Name / BU Display Name"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* BU Manager */}
      <FormRow label="BU Manager" required>
        <input
          type="text"
          required
          value={form.manager_name}
          onChange={(e) => setForm((prev) => ({ ...prev, manager_name: e.target.value }))}
          placeholder="Manager Name"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Status */}
      <FormRow label="Status">
        <select
          value={form.status || "active"}
          onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </FormRow>

      {/* Registration & VAT */}
      <FormRow label="Registration No.">
        <input
          type="text"
          value={form.registration_no}
          onChange={(e) => setForm((prev) => ({ ...prev, registration_no: e.target.value }))}
          placeholder="Registration No."
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      <FormRow label="VAT No.">
        <input
          type="text"
          value={form.vat_no}
          onChange={(e) => setForm((prev) => ({ ...prev, vat_no: e.target.value }))}
          placeholder="VAT No."
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Industry */}
      <FormRow label="Industry">
        <div className="space-y-2">
          <select
            value={form.industry && !INDUSTRY_OPTIONS.slice(0, -1).includes(form.industry) ? "Other" : form.industry || INDUSTRY_OPTIONS[0]}
            onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
          >
            {INDUSTRY_OPTIONS.map((ind) => (<option key={ind} value={ind}>{ind}</option>))}
          </select>
          {form.industry === "Other" && (
            <input
              type="text"
              value={form.industry === "Other" ? "" : form.industry}
              onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
              placeholder="Specify industry"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
          )}
        </div>
      </FormRow>

      {/* Currency */}
      <FormRow label="Currency" required>
        <select
          value={form.currency || "USD"}
          onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
        >
          {CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </FormRow>

      {/* Rounding */}
      <FormRow label="Rounding Digit" required>
        <select
          value={form.rounding_digit != null ? String(form.rounding_digit) : "2"}
          onChange={(e) => setForm((prev) => ({ ...prev, rounding_digit: e.target.value }))}
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
        >
          {ROUNDINGS.map((d) => (<option key={d} value={d}>{d}</option>))}
        </select>
      </FormRow>

      {/* Biometric Machines Configuration */}
      <BiometricHardwareField form={form} setForm={setForm} branchId={branchId} branchName={branchName} />
    </div>
  );
}
