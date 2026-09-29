import React, { useState } from "react";
import { FormRow } from "./FormRow";
import { reverseGeocode } from "../../utils/reverseGeocode";
import type { BranchFormState } from "../../types";

interface PhysicalAddressSectionProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
}

const COUNTRY_OPTIONS = [
  "Cambodia",
  "Thailand",
  "Vietnam",
  "Singapore",
  "Malaysia",
  "Philippines",
  "Indonesia",
  "United States",
  "Other",
];

export function PhysicalAddressSection({
  form,
  setForm,
}: PhysicalAddressSectionProps) {
  const [sameAsMailing, setSameAsMailing] = useState(true);

  const handleSameAsMailingToggle = (checked: boolean) => {
    setSameAsMailing(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        mailing_address: prev.physical_address,
        mailing_city: prev.physical_city,
        mailing_province: prev.physical_province,
        mailing_postal_code: prev.physical_postal_code,
        mailing_country: prev.physical_country,
      }));
    }
  };

  const updatePhysicalAddress = (key: keyof BranchFormState, val: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (sameAsMailing) {
        if (key === "physical_address") next.mailing_address = val;
        if (key === "physical_city") next.mailing_city = val;
        if (key === "physical_province") next.mailing_province = val;
        if (key === "physical_postal_code") next.mailing_postal_code = val;
        if (key === "physical_country") next.mailing_country = val;
      }
      return next;
    });
  };

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

        setForm((prev) => {
          const next = {
            ...prev,
            latitude: lat,
            longitude: lng,
            physical_address: geocoded?.address || prev.physical_address,
            physical_city: geocoded?.city || prev.physical_city,
            physical_province: geocoded?.province || prev.physical_province,
            physical_postal_code: geocoded?.postal_code || prev.physical_postal_code,
            physical_country: geocoded?.country || prev.physical_country,
          };

          if (sameAsMailing) {
            next.mailing_address = next.physical_address;
            next.mailing_city = next.physical_city;
            next.mailing_province = next.physical_province;
            next.mailing_postal_code = next.physical_postal_code;
            next.mailing_country = next.physical_country;
          }

          return next;
        });
      },
      () => {
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">
          Physical Address Info
        </h3>
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
      </div>

      {/* Address */}
      <FormRow label="Address">
        <input
          type="text"
          value={form.physical_address}
          onChange={(e) => updatePhysicalAddress("physical_address", e.target.value)}
          placeholder="#City tower Building, 321, Mao Tse Toung Blvd..."
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* City */}
      <FormRow label="City">
        <input
          type="text"
          value={form.physical_city}
          onChange={(e) => updatePhysicalAddress("physical_city", e.target.value)}
          placeholder="Phnom Penh"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Province */}
      <FormRow label="Province">
        <input
          type="text"
          value={form.physical_province}
          onChange={(e) => updatePhysicalAddress("physical_province", e.target.value)}
          placeholder="Province"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Postal Code */}
      <FormRow label="Postal Code">
        <input
          type="text"
          value={form.physical_postal_code}
          onChange={(e) => updatePhysicalAddress("physical_postal_code", e.target.value)}
          placeholder="Postal Code"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      {/* Country */}
      <FormRow label="Country">
        <select
          value={form.physical_country || COUNTRY_OPTIONS[0]}
          onChange={(e) => updatePhysicalAddress("physical_country", e.target.value)}
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
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
              value={form.latitude}
              onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
              placeholder="Latitude"
              className="w-full sm:w-[150px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
            <input
              type="text"
              value={form.longitude}
              onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
              placeholder="Longitude"
              className="w-full sm:w-[150px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="5000"
                value={form.geofence_radius_m || "100"}
                onChange={(e) => setForm((prev) => ({ ...prev, geofence_radius_m: e.target.value }))}
                placeholder="100"
                className="w-20 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">meters radius</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Leave latitude/longitude blank to skip location checks for this branch.
          </p>
        </div>
      </FormRow>

      {/* Same as Mailing Address Checkbox */}
      <FormRow label="">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={sameAsMailing}
            onChange={(e) => handleSameAsMailingToggle(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#2b8de3] focus:ring-[#2b8de3] cursor-pointer"
          />
          <span>Same as Mailing Address</span>
        </label>
      </FormRow>
    </div>
  );
}
