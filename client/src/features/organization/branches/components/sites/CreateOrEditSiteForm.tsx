import React, { useState, useEffect } from "react";
import type { WorkSite, WorkSiteFormState } from "../../types";
import { SiteInfoFields } from "./SiteInfoFields";
import { SiteAddressFields } from "./SiteAddressFields";
import { SiteWorkingPlaceSection } from "./SiteWorkingPlaceSection";
import { SiteContactFields } from "./SiteContactFields";

interface CreateOrEditSiteFormProps {
  branchId: string;
  companyName: string;
  editingSite: WorkSite | null;
  branches?: Array<{ id: string; name: string; company_name?: string | null }>;
  isReadOnly?: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: (form: WorkSiteFormState) => Promise<void>;
  onSwitchToEdit?: () => void;
}

export function CreateOrEditSiteForm({
  branchId,
  companyName,
  editingSite,
  branches = [],
  isReadOnly = false,
  saving,
  onBack,
  onSave,
  onSwitchToEdit,
}: CreateOrEditSiteFormProps) {
  const [form, setForm] = useState<WorkSiteFormState>(() => ({
    name: editingSite?.name || "",
    description: editingSite?.description || "",
    latitude: editingSite?.latitude != null ? String(editingSite.latitude) : "",
    longitude: editingSite?.longitude != null ? String(editingSite.longitude) : "",
    geofence_radius_m: editingSite?.geofence_radius_m != null ? String(editingSite.geofence_radius_m) : "100",
    work_start_time: editingSite?.work_start_time ? editingSite.work_start_time.slice(0, 5) : "08:00",
    work_end_time: editingSite?.work_end_time ? editingSite.work_end_time.slice(0, 5) : "17:00",
    break_start_time: editingSite?.break_start_time ? editingSite.break_start_time.slice(0, 5) : "12:00",
    break_end_time: editingSite?.break_end_time ? editingSite.break_end_time.slice(0, 5) : "13:00",
    late_grace_minutes: editingSite?.late_grace_minutes != null ? String(editingSite.late_grace_minutes) : "15",
    early_leave_grace_minutes: editingSite?.early_leave_grace_minutes != null ? String(editingSite.early_leave_grace_minutes) : "15",
    morning_check_in_start: editingSite?.morning_check_in_start ? editingSite.morning_check_in_start.slice(0, 5) : "06:00",
    morning_check_in_end: editingSite?.morning_check_in_end ? editingSite.morning_check_in_end.slice(0, 5) : "09:00",
    morning_check_out_start: editingSite?.morning_check_out_start ? editingSite.morning_check_out_start.slice(0, 5) : "10:00",
    morning_check_out_end: editingSite?.morning_check_out_end ? editingSite.morning_check_out_end.slice(0, 5) : "12:00",
    afternoon_check_in_start: editingSite?.afternoon_check_in_start ? editingSite.afternoon_check_in_start.slice(0, 5) : "12:00",
    afternoon_check_in_end: editingSite?.afternoon_check_in_end ? editingSite.afternoon_check_in_end.slice(0, 5) : "14:00",
    afternoon_check_out_start: editingSite?.afternoon_check_out_start ? editingSite.afternoon_check_out_start.slice(0, 5) : "16:00",
    afternoon_check_out_end: editingSite?.afternoon_check_out_end ? editingSite.afternoon_check_out_end.slice(0, 5) : "18:00",
    is_four_punch_enabled: editingSite?.is_four_punch_enabled ?? false,
    auto_checkout_time: editingSite?.auto_checkout_time ? editingSite.auto_checkout_time.slice(0, 5) : "18:00",
    is_auto_checkout_enabled: editingSite?.is_auto_checkout_enabled ?? true,
    working_hours_mode: (editingSite?.working_hours_mode as "inherit" | "custom") || "inherit",
    site_type: editingSite?.site_type || "Head Office",
    branch_id: editingSite?.branch_id || branchId,
    company_name: companyName,
    address: editingSite?.address || editingSite?.description || "",
    city: editingSite?.city || "Phnom Penh",
    province: editingSite?.province || "",
    postal_code: editingSite?.postal_code || "",
    country: editingSite?.country || "Cambodia",
    phone_number: editingSite?.phone_number || "",
    email: editingSite?.email || "",
    website: editingSite?.website || "",
    status: (editingSite?.status as "active" | "disabled") || "active",
  }));

  useEffect(() => {
    if (editingSite) {
      setForm((prev) => ({
        ...prev,
        name: editingSite.name,
        description: editingSite.description || "",
        site_type: editingSite.site_type || "Head Office",
        branch_id: editingSite.branch_id || branchId,
        address: editingSite.address || editingSite.description || "",
        city: editingSite.city || "Phnom Penh",
        province: editingSite.province || "",
        postal_code: editingSite.postal_code || "",
        country: editingSite.country || "Cambodia",
        phone_number: editingSite.phone_number || "",
        email: editingSite.email || "",
        website: editingSite.website || "",
        status: (editingSite.status as "active" | "disabled") || "active",
        working_hours_mode: (editingSite.working_hours_mode as "inherit" | "custom") || "inherit",
        auto_checkout_time: editingSite.auto_checkout_time ? editingSite.auto_checkout_time.slice(0, 5) : "18:00",
        is_auto_checkout_enabled: editingSite.is_auto_checkout_enabled ?? true,
      }));
    }
  }, [editingSite, branchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const title = isReadOnly ? `View Site: ${editingSite?.name || "Site Details"}` : editingSite ? "Edit Site" : "Create Site";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-medium text-slate-700 dark:text-slate-200">{title}</h2>
        <div className="flex items-center gap-2">
          {isReadOnly && onSwitchToEdit && (
            <button
              type="button"
              onClick={onSwitchToEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-medium rounded shadow-2xs cursor-pointer"
            >
              <i className="ri-edit-line text-xs" />
              <span>Edit Site</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded shadow-2xs cursor-pointer"
          >
            <i className="ri-arrow-left-line text-xs" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        <SiteInfoFields form={form} setForm={setForm} companyName={companyName} branches={branches} isReadOnly={isReadOnly} />
        <SiteAddressFields form={form} setForm={setForm} isReadOnly={isReadOnly} />
        <SiteWorkingPlaceSection form={form} setForm={setForm} branchId={form.branch_id || branchId} isReadOnly={isReadOnly} />
        <SiteContactFields form={form} setForm={setForm} isReadOnly={isReadOnly} />

        {!isReadOnly ? (
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer disabled:opacity-60"
            >
              {saving ? "Saving..." : <><i className="ri-save-line text-sm" /><span>Save Site</span></>}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded shadow-2xs cursor-pointer"
            >
              <i className="ri-close-line text-sm" />
              <span>Discard</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xs" />
              <span>Back to Sites</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
