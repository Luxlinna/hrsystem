import React, { useState, useEffect } from "react";
import { FormRow } from "../profile/FormRow";
import { CountryPhoneInput } from "../profile/CountryPhoneInput";
import { COUNTRIES } from "../profile/countriesData";
import { reverseGeocode } from "../../utils/reverseGeocode";
import type { WorkSite, WorkSiteFormState } from "../../types";

interface CreateOrEditSiteFormProps {
  branchId: string;
  companyName: string;
  editingSite: WorkSite | null;
  isReadOnly?: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: (form: WorkSiteFormState) => Promise<void>;
  onSwitchToEdit?: () => void;
}

const PRESET_SITE_TYPES = ["Head Office", "Store", "Warehouse", "Branch", "Processing Center"];

export function CreateOrEditSiteForm({
  branchId,
  companyName,
  editingSite,
  isReadOnly = false,
  saving,
  onBack,
  onSave,
  onSwitchToEdit,
}: CreateOrEditSiteFormProps) {
  const isCustomTypeInitial = Boolean(
    editingSite?.site_type && !PRESET_SITE_TYPES.includes(editingSite.site_type)
  );
  const [isCustomType, setIsCustomType] = useState(isCustomTypeInitial);
  const [customTypeText, setCustomTypeText] = useState(
    isCustomTypeInitial ? editingSite?.site_type || "" : ""
  );

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

    // Site Profile Fields
    site_type: editingSite?.site_type || "Head Office",
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
      const isCustom = Boolean(
        editingSite.site_type && !PRESET_SITE_TYPES.includes(editingSite.site_type)
      );
      setIsCustomType(isCustom);
      setCustomTypeText(isCustom ? editingSite.site_type || "" : "");

      setForm((prev) => ({
        ...prev,
        name: editingSite.name,
        description: editingSite.description || "",
        site_type: editingSite.site_type || "Head Office",
        address: editingSite.address || editingSite.description || "",
        city: editingSite.city || "Phnom Penh",
        province: editingSite.province || "",
        postal_code: editingSite.postal_code || "",
        country: editingSite.country || "Cambodia",
        phone_number: editingSite.phone_number || "",
        email: editingSite.email || "",
        website: editingSite.website || "",
        status: (editingSite.status as "active" | "disabled") || "active",
      }));
    }
  }, [editingSite]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const title = isReadOnly
    ? `View Site: ${editingSite?.name || "Site Details"}`
    : editingSite
    ? "Edit Site"
    : "Create Site";

  const [detectingGps, setDetectingGps] = useState(false);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);

        // Auto reverse geocode address
        const geocoded = await reverseGeocode(lat, lng);
        setDetectingGps(false);

        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: geocoded?.address || prev.address,
          city: geocoded?.city || prev.city,
          province: geocoded?.province || prev.province,
          postal_code: geocoded?.postal_code || prev.postal_code,
          country: geocoded?.country || prev.country,
        }));
      },
      () => {
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-medium text-slate-700 dark:text-slate-200">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {isReadOnly && onSwitchToEdit && (
            <button
              type="button"
              onClick={onSwitchToEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-medium rounded shadow-2xs cursor-pointer transition-colors"
            >
              <i className="ri-edit-line text-xs" />
              <span>Edit Site</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded shadow-2xs cursor-pointer transition-colors"
          >
            <i className="ri-arrow-left-line text-xs" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* 1. SITE INFO */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
            Site Info
          </h3>

          {/* Site Name */}
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

          {/* Company Name (Readonly) */}
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

          {/* Site Type */}
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

        {/* 2. ADDRESS INFO */}
        <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">
              Address Info
            </h3>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={detectingGps}
                title={
                  form.latitude && form.longitude
                    ? `GPS Coordinates: ${form.latitude}, ${form.longitude} (Click to recapture)`
                    : "Capture current GPS location"
                }
                className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-[#0088cc] hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {detectingGps ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    <span className="text-[11px]">Capturing GPS...</span>
                  </>
                ) : form.latitude ? (
                  <>
                    <i className="ri-map-pin-2-fill text-sm text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {form.latitude}, {form.longitude}
                    </span>
                  </>
                ) : (
                  <i className="ri-map-pin-line text-sm hover:scale-110 transition-transform" />
                )}
              </button>
            )}
          </div>

          {/* Address */}
          <FormRow label="Address" alignTop>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Address"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] resize-y disabled:bg-slate-50 dark:disabled:bg-slate-800/60"
            />
          </FormRow>

          {/* City */}
          <FormRow label="City">
            <input
              type="text"
              disabled={isReadOnly}
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="City"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
            />
          </FormRow>

          {/* Province */}
          <FormRow label="Province">
            <input
              type="text"
              disabled={isReadOnly}
              value={form.province}
              onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))}
              placeholder="Province"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
            />
          </FormRow>

          {/* Postal Code */}
          <FormRow label="Postal Code">
            <input
              type="text"
              disabled={isReadOnly}
              value={form.postal_code}
              onChange={(e) => setForm((prev) => ({ ...prev, postal_code: e.target.value }))}
              placeholder="Postal Code"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
            />
          </FormRow>

          {/* Country */}
          <FormRow label="Country">
            <select
              disabled={isReadOnly}
              value={form.country || "Cambodia"}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer disabled:cursor-not-allowed"
            >
              {COUNTRIES.map((c) => (
                <option key={`${c.code}-${c.name}`} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </FormRow>

          {/* GPS Coordinates & Geofence */}
          <FormRow label="GPS & Geofence" alignTop>
            <div className="space-y-1.5 w-full">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <i className="ri-information-line text-slate-400 text-xs" />
                <span>Usually building-accurate, but always double-check the result.</span>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={form.latitude}
                  onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                  placeholder="Latitude"
                  className="w-full sm:w-[150px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
                />
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={form.longitude}
                  onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                  placeholder="Longitude"
                  className="w-full sm:w-[150px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    disabled={isReadOnly}
                    value={form.geofence_radius_m || "100"}
                    onChange={(e) => setForm((prev) => ({ ...prev, geofence_radius_m: e.target.value }))}
                    placeholder="100"
                    className="w-20 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">meters radius</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Leave latitude/longitude blank to skip location checks for this site.
              </p>
            </div>
          </FormRow>
        </div>

        {/* 3. CONTACT INFO */}
        <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
            Contact Info
          </h3>

          {/* Phone Number */}
          <FormRow label="Phone Number">
            {isReadOnly ? (
              <input
                type="text"
                readOnly
                disabled
                value={form.phone_number || "—"}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100"
              />
            ) : (
              <CountryPhoneInput
                value={form.phone_number}
                onChange={(val) => setForm((prev) => ({ ...prev, phone_number: val }))}
                placeholder="+855987654321"
              />
            )}
          </FormRow>

          {/* Email */}
          <FormRow label="Email">
            <input
              type="email"
              disabled={isReadOnly}
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
            />
          </FormRow>

          {/* Website */}
          <FormRow label="Website">
            <input
              type="text"
              disabled={isReadOnly}
              value={form.website}
              onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="Website"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
            />
          </FormRow>
        </div>

        {/* Bottom Actions */}
        {!isReadOnly ? (
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="ri-save-line text-sm" />
                  <span>Save</span>
                  <i className="ri-arrow-down-s-line text-xs" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors"
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
