import React, { memo, useState, useRef } from "react";
import type { BranchFormState } from "../types";
import { BranchLocationPicker } from "./BranchLocationPicker";
import { optimizeLogoImage } from "@/pages/settings/components/brandingImageUtils";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

interface BranchModalProps {
  isOpen: boolean;
  editingBranchId: string | null;
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
  addressLookup: string;
  setAddressLookup: (addr: string) => void;
  addressInputRef: React.RefObject<HTMLInputElement | null>;
  locating: boolean;
  geocoding: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onUseCurrentLocation: () => void;
  onGeocodeAddress: () => void;
}

export const BranchModal = memo(function BranchModal({
  isOpen,
  editingBranchId,
  form,
  setForm,
  addressLookup,
  setAddressLookup,
  addressInputRef,
  locating,
  geocoding,
  submitting,
  onClose,
  onSubmit,
  onUseCurrentLocation,
  onGeocodeAddress,
}: BranchModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "operations" | "location" | "schedule">("profile");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Invalid File", "Please select an image file (PNG, JPG, WebP, SVG).", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("File Too Large", "Please select an image under 10MB.", "error");
      return;
    }

    setUploadingLogo(true);
    try {
      // 1. Primary Upload: AWS S3 storage under branches/logos
      const s3Item = await uploadFileToS3(file, "branches/logos");
      setForm((prev) => ({ ...prev, logo_url: s3Item.url }));
      toast("Logo Uploaded", "Logo saved securely to AWS S3.", "success");
    } catch (s3Err) {
      console.warn("AWS S3 direct upload fallback:", s3Err);
      try {
        const optimized = await optimizeLogoImage(file, 600);
        setForm((prev) => ({ ...prev, logo_url: optimized }));
        toast("Logo Uploaded", "Logo saved to company profile.", "success");
      } catch (_err) {
        toast("Upload Failed", s3Err instanceof Error ? s3Err.message : "Failed to upload logo image to AWS S3", "error");
      }
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const copyPhysicalToMailing = () => {
    setForm((prev) => ({
      ...prev,
      mailing_address: prev.physical_address || prev.location,
      mailing_city: prev.physical_city || "Phnom Penh",
      mailing_province: prev.physical_province || "",
      mailing_postal_code: prev.physical_postal_code || "",
      mailing_country: prev.physical_country || "Cambodia",
    }));
    toast("Copied", "Physical address copied to mailing address.", "info");
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl my-0 sm:my-0 max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col shadow-2xl border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[15px] sm:text-[17px] font-bold text-gray-900">
              {editingBranchId ? "Edit Business Unit & Company Profile" : "Add New Business Unit (BU)"}
            </h2>
            <p className="text-[11px] sm:text-[12px] text-gray-500 mt-0.5">
              {editingBranchId ? "Update official company info, addresses, and operational settings" : "Create a new Business Unit location and company profile"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <i className="ri-close-line text-gray-500" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-slate-50/70 px-3 sm:px-6 shrink-0 gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "profile"
                ? "border-[#0088cc] text-[#0088cc]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-building-line text-sm" />
            Company Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("operations")}
            className={`py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "operations"
                ? "border-[#0088cc] text-[#0088cc]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-briefcase-line text-sm" />
            BU Operations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("location")}
            className={`py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "location"
                ? "border-[#0088cc] text-[#0088cc]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-map-pin-line text-sm" />
            Location & Geofence
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "schedule"
                ? "border-[#0088cc] text-[#0088cc]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-time-line text-sm" />
            Work Schedule
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
          {/* TAB 1: COMPANY PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* 1. Logo Section */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-center gap-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="w-28 h-20 bg-white rounded-lg border border-gray-200 shadow-2xs flex items-center justify-center p-2 shrink-0 overflow-hidden">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <i className="ri-image-add-line text-2xl block mb-0.5" />
                      <span className="text-[10px]">No Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <h4 className="text-xs font-bold text-gray-800">Official Company Logo</h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      <i className="ri-checkbox-circle-fill text-[11px]" /> AWS S3 Storage
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Images are stored securely on AWS S3 (PNG, SVG, JPG, WebP up to 10MB)
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {uploadingLogo ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
                          Uploading to AWS S3...
                        </>
                      ) : (
                        <>
                          <i className="ri-upload-2-line text-[#0088cc]" />
                          {form.logo_url ? "Replace Logo" : "Upload Logo"}
                        </>
                      )}
                    </button>
                    {form.logo_url && !uploadingLogo && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, logo_url: "" }))}
                        className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. COMPANY INFO */}
              <div>
                <h4 className="text-[11px] font-bold text-[#0088cc] uppercase tracking-wider mb-3">
                  Company Info
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      placeholder="Company Name"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Registration No.</label>
                    <input
                      type="text"
                      value={form.registration_no}
                      onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
                      placeholder="Registration Number"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">VAT No.</label>
                    <input
                      type="text"
                      value={form.vat_no}
                      onChange={(e) => setForm({ ...form, vat_no: e.target.value })}
                      placeholder="VAT Number"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      placeholder="e.g., Trading, Import & Export"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Corarl Domain</label>
                    <input
                      type="text"
                      value={form.domain}
                      onChange={(e) => setForm({ ...form, domain: e.target.value })}
                      placeholder="Domain / Subdomain"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Currency</label>
                    <select
                      value={form.currency || "USD"}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc] bg-white cursor-pointer"
                    >
                      <option value="USD">USD</option>
                      <option value="KHR">KHR</option>
                      <option value="THB">THB</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Rounding Digit</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={form.rounding_digit}
                      onChange={(e) => setForm({ ...form, rounding_digit: e.target.value })}
                      placeholder="2"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. PHYSICAL ADDRESS INFO */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[11px] font-bold text-[#0088cc] uppercase tracking-wider mb-3">
                  Physical Address Info
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={form.physical_address}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          physical_address: val,
                          location: form.location ? form.location : val,
                        });
                      }}
                      placeholder="Street address, building, unit..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={form.physical_city}
                        onChange={(e) => setForm({ ...form, physical_city: e.target.value })}
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-gray-700 mb-1">Province</label>
                      <input
                        type="text"
                        value={form.physical_province}
                        onChange={(e) => setForm({ ...form, physical_province: e.target.value })}
                        placeholder="Province"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={form.physical_postal_code}
                        onChange={(e) => setForm({ ...form, physical_postal_code: e.target.value })}
                        placeholder="Postal Code"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={form.physical_country}
                        onChange={(e) => setForm({ ...form, physical_country: e.target.value })}
                        placeholder="Country"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. MAILING ADDRESS INFO */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-bold text-[#0088cc] uppercase tracking-wider">
                    Mailing Address Info
                  </h4>
                  <button
                    type="button"
                    onClick={copyPhysicalToMailing}
                    className="text-[11px] font-semibold text-[#0088cc] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <i className="ri-file-copy-line" />
                    Same as Physical Address
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={form.mailing_address}
                      onChange={(e) => setForm({ ...form, mailing_address: e.target.value })}
                      placeholder="Mailing address, P.O. box..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={form.mailing_city}
                        onChange={(e) => setForm({ ...form, mailing_city: e.target.value })}
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-gray-700 mb-1">Province</label>
                      <input
                        type="text"
                        value={form.mailing_province}
                        onChange={(e) => setForm({ ...form, mailing_province: e.target.value })}
                        placeholder="Province"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={form.mailing_postal_code}
                        onChange={(e) => setForm({ ...form, mailing_postal_code: e.target.value })}
                        placeholder="Postal Code"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={form.mailing_country}
                        onChange={(e) => setForm({ ...form, mailing_country: e.target.value })}
                        placeholder="Country"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. CONTACT INFO */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[11px] font-bold text-[#0088cc] uppercase tracking-wider mb-3">
                  Contact Info
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={form.phone_number}
                      onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                      placeholder="Phone Number"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Email Address"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Website</label>
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="Website (e.g., example.com)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                </div>
              </div>

              {/* 5. TIMEZONE INFO */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[11px] font-bold text-[#0088cc] uppercase tracking-wider mb-3">
                  Timezone Info
                </h4>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Time Zone</label>
                  <input
                    type="text"
                    value={form.time_zone}
                    onChange={(e) => setForm({ ...form, time_zone: e.target.value })}
                    placeholder="SE Asia Standard Time"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                  />
                </div>
              </div>

              {/* 6. LEGAL INFO */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[11px] font-bold text-[#0088cc] uppercase tracking-wider mb-3">
                  Legal Info
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Tax Number</label>
                    <input
                      type="text"
                      value={form.legal_tax_number}
                      onChange={(e) => setForm({ ...form, legal_tax_number: e.target.value })}
                      placeholder="Tax Identification Number"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Legal Name</label>
                    <input
                      type="text"
                      value={form.legal_name}
                      onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                      placeholder="Registered Legal Entity Name"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Business Activity</label>
                    <input
                      type="text"
                      value={form.legal_business_activity}
                      onChange={(e) => setForm({ ...form, legal_business_activity: e.target.value })}
                      placeholder="Registered business activity description"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={form.legal_address}
                      onChange={(e) => setForm({ ...form, legal_address: e.target.value })}
                      placeholder="Registered legal address"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={form.legal_phone_number}
                      onChange={(e) => setForm({ ...form, legal_phone_number: e.target.value })}
                      placeholder="Official Contact Phone"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.legal_email}
                      onChange={(e) => setForm({ ...form, legal_email: e.target.value })}
                      placeholder="Official Legal / Tax Email"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPERATIONS */}
          {activeTab === "operations" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                    Business Unit (BU) Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({
                        ...form,
                        name: val,
                        company_name: form.company_name ? form.company_name : val,
                      });
                    }}
                    placeholder="e.g., Head Office or Business Unit Name"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Location / City *</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g., Phnom Penh, Cambodia"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">BU Manager *</label>
                  <input
                    type="text"
                    required
                    value={form.manager_name}
                    onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                    placeholder="Manager Name"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Operational Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc] cursor-pointer bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOCATION & GEOFENCE */}
          {activeTab === "location" && (
            <BranchLocationPicker
              form={form}
              setForm={setForm}
              addressLookup={addressLookup}
              setAddressLookup={setAddressLookup}
              addressInputRef={addressInputRef}
              locating={locating}
              geocoding={geocoding}
              onUseCurrentLocation={onUseCurrentLocation}
              onGeocodeAddress={onGeocodeAddress}
            />
          )}

          {/* TAB 4: SCHEDULE & ATTENDANCE */}
          {activeTab === "schedule" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-800">
                  Work Schedule & Grace Policy
                </label>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Configure shift hours and the chance given to branch employees for late arrivals and early timeouts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Check-In Start Time</label>
                  <input
                    type="time"
                    value={form.work_start_time}
                    onChange={(e) => setForm({ ...form, work_start_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Check-ins after this time calculate late minutes</p>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Check-Out End Time</label>
                  <input
                    type="time"
                    value={form.work_end_time}
                    onChange={(e) => setForm({ ...form, work_end_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Check-outs before this time count as early leave</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0088cc]/5 p-3.5 rounded-xl border border-[#0088cc]/15">
                <div>
                  <label className="block text-[11px] text-[#0088cc] mb-1 font-bold">
                    Late Arrival Grace (Minutes Chance)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={form.late_grace_minutes}
                      onChange={(e) => setForm({ ...form, late_grace_minutes: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0088cc]"
                      placeholder="15"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-gray-400">mins chance</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Chance given for arriving late. Within this window, employee is marked On Time.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] text-[#0088cc] mb-1 font-bold">
                    Early Departure Grace (Minutes Chance)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={form.early_leave_grace_minutes}
                      onChange={(e) => setForm({ ...form, early_leave_grace_minutes: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0088cc]"
                      placeholder="15"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-gray-400">mins chance</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Employees leaving within this window of shift end are not flagged with early penalty.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] text-white text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Saving..." : editingBranchId ? "Save Changes" : "Create BU"}
          </button>
        </div>
      </form>
    </div>
  );
});
