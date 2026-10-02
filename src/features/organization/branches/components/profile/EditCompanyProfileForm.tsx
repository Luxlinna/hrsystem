import React, { useState } from "react";
import type { Branch, BranchFormState } from "../../types";
import { CompanyInfoSection } from "./CompanyInfoSection";
import { PhysicalAddressSection } from "./PhysicalAddressSection";
import { ContactAndTimezoneSection } from "./ContactAndTimezoneSection";
import { LegalInfoSection } from "./LegalInfoSection";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { optimizeLogoImage } from "@/features/system-admin/settings/components/brandingImageUtils";
import { toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { branchToFormState } from "../../utils/branchFormMapper";

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
  const [form, setForm] = useState<BranchFormState>(() => branchToFormState(branch));
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleUploadLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Invalid File", "Please select a valid image file.", "error");
      return;
    }
    setUploadingLogo(true);
    try {
      const s3Item = await uploadFileToS3(file, "bu-logos");
      if (s3Item?.url) {
        setForm((prev) => ({ ...prev, logo_url: s3Item.url }));
      } else {
        const optimized = await optimizeLogoImage(file);
        setForm((prev) => ({ ...prev, logo_url: optimized }));
      }
      toast("Logo Uploaded", "Logo updated successfully.", "success");
    } catch (err) {
      toast("Upload Failed", err instanceof Error ? err.message : "Failed to upload logo", "error");
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
        manager_name: form.manager_name || branch.manager_name || "Manager",
        status: form.status || branch.status || "active",
        location: form.physical_city || form.physical_address || form.location || branch.location || "Phnom Penh",
        registration_no: form.registration_no || null,
        vat_no: form.vat_no || null,
        industry: form.industry || null,
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
        legal_tax_number: form.legal_tax_number || null,
        legal_name: form.legal_name || null,
        legal_business_activity: form.legal_business_activity || null,
        legal_address: form.legal_address || null,
        legal_phone_number: form.legal_phone_number || null,
        legal_email: form.legal_email || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        geofence_radius_m: form.geofence_radius_m ? parseInt(form.geofence_radius_m, 10) : 100,
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
      <div className="px-4 sm:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-[15px] sm:text-[16px] font-normal text-slate-800 dark:text-slate-100 tracking-tight">
          Edit Company Profile
        </h2>
      </div>

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
