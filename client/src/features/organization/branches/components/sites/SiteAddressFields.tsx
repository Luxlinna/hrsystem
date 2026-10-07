import React, { useState } from "react";
import { FormRow } from "../profile/FormRow";
import { COUNTRIES } from "../profile/countriesData";
import { reverseGeocode } from "../../utils/reverseGeocode";
import type { WorkSiteFormState } from "../../types";

interface Props {
  form: WorkSiteFormState;
  setForm: React.Dispatch<React.SetStateAction<WorkSiteFormState>>;
  isReadOnly?: boolean;
}

export function SiteAddressFields({ form, setForm, isReadOnly = false }: Props) {
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
      () => setDetectingGps(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
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
              <span className="text-[11px] flex items-center gap-1">
                <i className="ri-map-pin-line text-sm" />
                Capture GPS
              </span>
            )}
          </button>
        )}
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FormRow label="City">
          <input
            type="text"
            disabled={isReadOnly}
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="City"
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
          />
        </FormRow>
        <FormRow label="Province">
          <input
            type="text"
            disabled={isReadOnly}
            value={form.province}
            onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))}
            placeholder="Province"
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
          />
        </FormRow>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FormRow label="Postal Code">
          <input
            type="text"
            disabled={isReadOnly}
            value={form.postal_code}
            onChange={(e) => setForm((prev) => ({ ...prev, postal_code: e.target.value }))}
            placeholder="Postal Code"
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
          />
        </FormRow>
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
      </div>

      <FormRow label="GPS & Geofence" alignTop>
        <div className="space-y-1.5 w-full">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <input
              type="text"
              disabled={isReadOnly}
              value={form.latitude}
              onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
              placeholder="Latitude"
              className="w-full sm:w-[140px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
            />
            <input
              type="text"
              disabled={isReadOnly}
              value={form.longitude}
              onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
              placeholder="Longitude"
              className="w-full sm:w-[140px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
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
                className="w-20 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] disabled:bg-slate-50"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">meters radius</span>
            </div>
          </div>
        </div>
      </FormRow>
    </div>
  );
}
