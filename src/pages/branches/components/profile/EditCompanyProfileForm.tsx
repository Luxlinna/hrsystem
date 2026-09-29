import React, { useState } from "react";
import type { Branch, BranchFormState } from "../../types";
import { CompanyInfoSection } from "./CompanyInfoSection";
import { PhysicalAddressSection } from "./PhysicalAddressSection";
import { ContactAndTimezoneSection } from "./ContactAndTimezoneSection";
import { LegalInfoSection } from "./LegalInfoSection";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { optimizeLogoImage } from "@/pages/settings/components/brandingImageUtils";
import { toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

interface EditCompanyProfileFormProps {
  branch: Branch;
  onSaveSuccess: (updatedBranch: Branch) => void;
  onDiscard: () => void;
}

export function EditCompanyProfileForm({
  branch,
  onSaveSuccess,
  onDiscard,
}: EditCompanyProfileFormProps) {
  const [form, setForm] = useState<BranchFormState>(() => ({
    name: branch.name || "",
    location: branch.location || "",
    manager_name: branch.manager_name || "",
    status: branch.status || "active",
    latitude: branch.latitude ? String(branch.latitude) : "",
    longitude: branch.longitude ? String(branch.longitude) : "",
    geofence_radius_m: branch.geofence_radius_m ? String(branch.geofence_radius_m) : "200",
    work_start_time: branch.work_start_time ? branch.work_start_time.slice(0, 5) : "08:00",
    work_end_time: branch.work_end_time ? branch.work_end_time.slice(0, 5) : "17:00",
    late_grace_minutes: branch.late_grace_minutes ? String(branch.late_grace_minutes) : "15",
    early_leave_grace_minutes: branch.early_leave_grace_minutes ? String(branch.early_leave_grace_minutes) : "15",
    morning_check_in_start: branch.morning_check_in_start ? branch.morning_check_in_start.slice(0, 5) : "06:00",
    morning_check_in_end: branch.morning_check_in_end ? branch.morning_check_in_end.slice(0, 5) : "09:00",
    morning_check_out_start: branch.morning_check_out_start ? branch.morning_check_out_start.slice(0, 5) : "10:00",
    morning_check_out_end: branch.morning_check_out_end ? branch.morning_check_out_end.slice(0, 5) : "12:00",
    afternoon_check_in_start: branch.afternoon_check_in_start ? branch.afternoon_check_in_start.slice(0, 5) : "12:00",
    afternoon_check_in_end: branch.afternoon_check_in_end ? branch.afternoon_check_in_end.slice(0, 5) : "14:00",
    afternoon_check_out_start: branch.afternoon_check_out_start ? branch.afternoon_check_out_start.slice(0, 5) : "16:00",
    afternoon_check_out_end: branch.afternoon_check_out_end ? branch.afternoon_check_out_end.slice(0, 5) : "18:00",

    // 1. Company Info
    logo_url: branch.logo_url || "",
    company_name: branch.company_name || branch.name || "",
    registration_no: branch.registration_no || "",
    vat_no: branch.vat_no || "",
    industry: branch.industry || "Trading, Import & Export",
    domain: branch.domain || "",
    currency: branch.currency || "USD",
    rounding_digit: branch.rounding_digit != null ? String(branch.rounding_digit) : "2",

    // 2. Physical Address Info
    physical_address: branch.physical_address || branch.location || "",
    physical_city: branch.physical_city || "Phnom Penh",
    physical_province: branch.physical_province || "",
    physical_postal_code: branch.physical_postal_code || "",
    physical_country: branch.physical_country || "Cambodia",

    // 3. Mailing Address Info
    mailing_address: branch.mailing_address || branch.physical_address || branch.location || "",
    mailing_city: branch.mailing_city || "Phnom Penh",
    mailing_province: branch.mailing_province || "",
    mailing_postal_code: branch.mailing_postal_code || "",
    mailing_country: branch.mailing_country || "Cambodia",

    // 4. Contact Info
    phone_number: branch.phone_number || "",
    email: branch.email || "",
    website: branch.website || "",

    // 5. Timezone Info
    time_zone: branch.time_zone || "(UTC+07:00) Bangkok, Hanoi, Jakarta",

    // 6. Legal Info
    legal_tax_number: branch.legal_tax_number || "",
    legal_name: branch.legal_name || "",
    legal_business_activity: branch.legal_business_activity || "",
    legal_address: branch.legal_address || "",
    legal_phone_number: branch.legal_phone_number || "",
    legal_email: branch.legal_email || "",
  }));

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleUploadLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Invalid File", "Please select an image file.", "error");
      return;
    }
    setUploadingLogo(true);
    try {
      const s3Item = await uploadFileToS3(file, "branches/logos");
      setForm((prev) => ({ ...prev, logo_url: s3Item.url }));
      toast("Logo Uploaded", "Logo saved securely to AWS S3.", "success");
    } catch {
      try {
        const optimized = await optimizeLogoImage(file, 600);
        setForm((prev) => ({ ...prev, logo_url: optimized }));
        toast("Logo Uploaded", "Logo saved to company profile.", "success");
      } catch (err) {
        toast("Upload Failed", err instanceof Error ? err.message : "Failed to upload logo", "error");
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.company_name || form.name || branch.name,
        company_name: form.company_name,
        registration_no: form.registration_no || null,
        vat_no: form.vat_no || null,
        industry: form.industry || null,
        domain: form.domain || null,
        currency: form.currency || "USD",
        rounding_digit: form.rounding_digit ? parseInt(form.rounding_digit, 10) : 2,
        logo_url: form.logo_url || null,
        physical_address: form.physical_address || null,
        physical_city: form.physical_city || null,
        physical_province: form.physical_province || null,
        physical_postal_code: form.physical_postal_code || null,
        physical_country: form.physical_country || null,
        mailing_address: form.mailing_address || null,
        mailing_city: form.mailing_city || null,
        mailing_province: form.mailing_province || null,
        mailing_postal_code: form.mailing_postal_code || null,
        mailing_country: form.mailing_country || null,
        phone_number: form.phone_number || null,
        email: form.email || null,
        website: form.website || null,
        time_zone: form.time_zone || null,
        legal_tax_number: form.legal_tax_number || null,
        legal_name: form.legal_name || null,
        legal_business_activity: form.legal_business_activity || null,
        legal_address: form.legal_address || null,
        legal_phone_number: form.legal_phone_number || null,
        legal_email: form.legal_email || null,
      };

      const { data, error } = await supabase
        .from("branches")
        .update(payload)
        .eq("id", branch.id)
        .select()
        .single();

      if (error) throw error;
      toast("Saved", "Company Profile updated successfully.", "success");
      onSaveSuccess(data as Branch);
    } catch (err) {
      toast("Save Failed", err instanceof Error ? err.message : "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="px-4 sm:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-[15px] sm:text-[16px] font-normal text-slate-800 dark:text-slate-100 tracking-tight">
          Edit Company Profile
        </h2>
      </div>

      {/* Main Form Body */}
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-7">
        <CompanyInfoSection
          form={form}
          setForm={setForm}
          uploadingLogo={uploadingLogo}
          onUploadLogo={handleUploadLogo}
        />

        <PhysicalAddressSection form={form} setForm={setForm} />

        <ContactAndTimezoneSection form={form} setForm={setForm} />

        <LegalInfoSection form={form} setForm={setForm} />

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors disabled:opacity-60"
          >
            <i className="ri-save-3-line text-sm" />
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            <i className="ri-close-line text-sm" />
            <span>Discard</span>
          </button>
        </div>
      </div>
    </form>
  );
}
