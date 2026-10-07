import React, { useState, useEffect } from "react";
import { FormRow } from "../profile/FormRow";
import { supabase } from "@/lib/supabase";
import type { WorkSiteFormState } from "../../types";

interface BranchOption {
  id: string;
  name: string;
  company_name?: string | null;
}

interface Props {
  form: WorkSiteFormState;
  setForm: React.Dispatch<React.SetStateAction<WorkSiteFormState>>;
  companyName: string;
  branches?: BranchOption[];
  isReadOnly?: boolean;
}

const PRESET_SITE_TYPES = ["Head Office", "Store", "Warehouse", "Branch", "Processing Center"];

export function SiteInfoFields({
  form,
  setForm,
  companyName,
  branches = [],
  isReadOnly = false,
}: Props) {
  const [buList, setBuList] = useState<BranchOption[]>(branches);
  const [showMultiBu, setShowMultiBu] = useState(Boolean(form.additional_branch_ids?.length));
  const isCustomTypeInitial = Boolean(form.site_type && !PRESET_SITE_TYPES.includes(form.site_type));
  const [isCustomType, setIsCustomType] = useState(isCustomTypeInitial);
  const [customTypeText, setCustomTypeText] = useState(isCustomTypeInitial ? form.site_type || "" : "");

  useEffect(() => {
    if (branches.length > 0) return setBuList(branches);
    supabase.from("branches").select("id, name, company_name").is("deleted_at", null).order("name")
      .then(({ data }) => { if (data?.length) setBuList(data as BranchOption[]); });
  }, [branches]);

  useEffect(() => {
    const isCustom = Boolean(form.site_type && !PRESET_SITE_TYPES.includes(form.site_type));
    setIsCustomType(isCustom);
    if (isCustom) setCustomTypeText(form.site_type || "");
  }, [form.site_type]);

  const handleBuChange = (branchId: string) => {
    const matched = buList.find((b) => b.id === branchId);
    setForm((prev) => ({ ...prev, branch_id: branchId, company_name: matched ? (matched.company_name || matched.name) : "" }));
  };

  const toggleAdditionalBu = (bId: string) => {
    const cur = form.additional_branch_ids || [];
    const updated = cur.includes(bId) ? cur.filter((id) => id !== bId) : [...cur, bId];
    setForm((prev) => ({ ...prev, additional_branch_ids: updated }));
  };

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">Site Info</h3>

      <FormRow label="Site Name" required>
        <input
          type="text" required disabled={isReadOnly} value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Site Name"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50 dark:disabled:bg-slate-800/60"
        />
      </FormRow>

      <FormRow label="Company Name (BU)" required>
        <div className="space-y-2">
          <div className="relative">
            <select
              disabled={isReadOnly}
              value={form.branch_id || ""}
              onChange={(e) => handleBuChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer disabled:cursor-not-allowed appearance-none"
            >
              <option value="">{companyName ? `Default: ${companyName}` : "Select Business Unit (BU)"}</option>
              {buList.map((b) => (<option key={b.id} value={b.id}>{b.company_name || b.name}</option>))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
          </div>

          {!isReadOnly && buList.length > 1 && (
            <div className="pt-1">
              <button
                type="button" onClick={() => setShowMultiBu((prev) => !prev)}
                className="text-[11px] text-[#0088cc] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <i className={showMultiBu ? "ri-checkbox-fill" : "ri-checkbox-blank-line"} />
                <span>Apply this Site to multiple Business Units (BUs)</span>
              </button>

              {showMultiBu && (
                <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md max-h-36 overflow-y-auto space-y-1.5">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Select additional BUs that share this physical site:
                  </div>
                  {buList.filter((b) => b.id !== form.branch_id).map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox" checked={(form.additional_branch_ids || []).includes(b.id)}
                        onChange={() => toggleAdditionalBu(b.id)} className="rounded text-[#0088cc] focus:ring-0 cursor-pointer"
                      />
                      <span>{b.company_name || b.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </FormRow>

      <FormRow label="Site Type">
        <div className="space-y-2">
          <select
            disabled={isReadOnly}
            value={isCustomType ? "Other" : form.site_type || PRESET_SITE_TYPES[0]}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "Other") {
                setIsCustomType(true); setForm((prev) => ({ ...prev, site_type: customTypeText || "" }));
              } else {
                setIsCustomType(false); setForm((prev) => ({ ...prev, site_type: val }));
              }
            }}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer disabled:cursor-not-allowed"
          >
            {PRESET_SITE_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
            <option value="Other">Other</option>
          </select>

          {isCustomType && (
            <input
              type="text" required disabled={isReadOnly} value={customTypeText}
              onChange={(e) => { const val = e.target.value; setCustomTypeText(val); setForm((prev) => ({ ...prev, site_type: val })); }}
              placeholder="Specify site type (e.g. Kiosk, Booth, Farm, Lab)"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
          )}
        </div>
      </FormRow>
    </div>
  );
}
