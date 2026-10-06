import React, { useState } from "react";
import { FormRow } from "./FormRow";
import { reverseGeocode } from "../../utils/reverseGeocode";
import { SiteSearchSelector, SelectedSiteData } from "./SiteSearchSelector";
import type { BranchFormState } from "../../types";

interface PhysicalAddressSectionProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
}

const COUNTRY_OPTIONS = ["Cambodia", "Thailand", "Vietnam", "Singapore", "Malaysia", "Philippines", "Indonesia", "United States", "Other"];

export function PhysicalAddressSection({ form, setForm }: PhysicalAddressSectionProps) {
  const [sameAsMailing, setSameAsMailing] = useState(true);
  const [detectingGps, setDetectingGps] = useState(false);
  const [selectedSiteName, setSelectedSiteName] = useState<string | null>(null);

  const handleSelectSite = (site: SelectedSiteData) => {
    setSelectedSiteName(site.name);
    setForm((prev) => {
      const next = {
        ...prev,
        physical_address: site.address || prev.physical_address,
        physical_city: site.city || prev.physical_city,
        physical_province: site.province || prev.physical_province,
        physical_postal_code: site.postal_code || prev.physical_postal_code,
        physical_country: site.country || prev.physical_country,
        latitude: site.latitude != null ? String(site.latitude) : prev.latitude,
        longitude: site.longitude != null ? String(site.longitude) : prev.longitude,
        geofence_radius_m: site.geofence_radius_m != null ? String(site.geofence_radius_m) : prev.geofence_radius_m,
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
  };

  const handleClearSite = () => {
    setSelectedSiteName(null);
  };

  const updateField = (key: keyof BranchFormState, val: string) => {
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

  const handleCaptureGps = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
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
      () => setDetectingGps(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">Physical Address Info</h3>
        <button
          type="button"
          onClick={handleCaptureGps}
          disabled={detectingGps}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-[#0088cc] hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-50"
        >
          {detectingGps ? (
            <span className="text-[11px]"><i className="ri-loader-4-line animate-spin text-sm" /> Capturing...</span>
          ) : form.latitude ? (
            <span className="text-[11px] text-emerald-600 font-medium"><i className="ri-map-pin-2-fill text-sm" /> {form.latitude}, {form.longitude}</span>
          ) : (
            <span className="text-[11px] flex items-center gap-1"><i className="ri-map-pin-line text-sm" /> Capture GPS</span>
          )}
        </button>
      </div>

      <SiteSearchSelector onSelectSite={handleSelectSite} selectedSiteName={selectedSiteName} onClearSite={handleClearSite} />

      <FormRow label="Address">
        <input
          type="text"
          value={form.physical_address}
          onChange={(e) => updateField("physical_address", e.target.value)}
          placeholder="Address"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3]"
        />
      </FormRow>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FormRow label="City">
          <input type="text" value={form.physical_city} onChange={(e) => updateField("physical_city", e.target.value)} placeholder="City" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3]" />
        </FormRow>
        <FormRow label="Province">
          <input type="text" value={form.physical_province} onChange={(e) => updateField("physical_province", e.target.value)} placeholder="Province" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3]" />
        </FormRow>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FormRow label="Postal Code">
          <input type="text" value={form.physical_postal_code} onChange={(e) => updateField("physical_postal_code", e.target.value)} placeholder="Postal Code" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3]" />
        </FormRow>
        <FormRow label="Country">
          <select value={form.physical_country || COUNTRY_OPTIONS[0]} onChange={(e) => updateField("physical_country", e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer">
            {COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormRow>
      </div>

      <FormRow label="GPS & Geofence" alignTop>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <input type="text" value={form.latitude} onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))} placeholder="Latitude" className="w-full sm:w-[140px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3]" />
          <input type="text" value={form.longitude} onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))} placeholder="Longitude" className="w-full sm:w-[140px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3]" />
          <div className="flex items-center gap-1.5">
            <input type="number" min="10" max="5000" value={form.geofence_radius_m || "100"} onChange={(e) => setForm((p) => ({ ...p, geofence_radius_m: e.target.value }))} className="w-20 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3]" />
            <span className="text-xs text-slate-500 whitespace-nowrap">m radius</span>
          </div>
        </div>
      </FormRow>

      <FormRow label="">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={sameAsMailing} onChange={(e) => setSameAsMailing(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#2b8de3] focus:ring-[#2b8de3] cursor-pointer" />
          <span>Same as Mailing Address</span>
        </label>
      </FormRow>
    </div>
  );
}
