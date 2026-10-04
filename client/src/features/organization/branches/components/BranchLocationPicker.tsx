import React, { memo } from "react";
import type { BranchFormState } from "../types";

interface BranchLocationPickerProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
  addressLookup: string;
  setAddressLookup: (addr: string) => void;
  addressInputRef: React.RefObject<HTMLInputElement | null>;
  locating: boolean;
  geocoding: boolean;
  onUseCurrentLocation: () => void;
  onGeocodeAddress: () => void;
}

export const BranchLocationPicker = memo(function BranchLocationPicker({
  form,
  setForm,
  addressLookup,
  setAddressLookup,
  addressInputRef,
  locating,
  geocoding,
  onUseCurrentLocation,
  onGeocodeAddress,
}: BranchLocationPickerProps) {
  return (
    <div className="border-t border-gray-100 pt-5">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[12px] font-semibold text-gray-700">Check-In Geofence (optional)</label>
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={locating}
          className="text-[11px] font-semibold text-[#253C7D] hover:underline disabled:opacity-60 cursor-pointer"
        >
          <i className="ri-map-pin-user-line mr-1" />
          {locating ? "Locating..." : "Use my current location"}
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          ref={addressInputRef}
          type="text"
          value={typeof addressLookup === "string" ? addressLookup : ""}
          onChange={(e) => setAddressLookup(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onGeocodeAddress();
            }
          }}
          placeholder="Or type an address to look up..."
          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
        />
        <button
          type="button"
          onClick={onGeocodeAddress}
          disabled={geocoding || !(typeof addressLookup === "string" && addressLookup.trim())}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 cursor-pointer whitespace-nowrap"
        >
          {geocoding ? "Looking up..." : "Look up"}
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mb-2">
        <i className="ri-information-line mr-1" />
        Usually building-accurate, but always double-check the result.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <input
          type="number"
          step="any"
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
          placeholder="Latitude"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
        />
        <input
          type="number"
          step="any"
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
          placeholder="Longitude"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
        />
        <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
          <input
            type="number"
            min="10"
            value={form.geofence_radius_m}
            onChange={(e) => setForm({ ...form, geofence_radius_m: e.target.value })}
            placeholder="100"
            className="w-20 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
          />
          <span className="text-[11px] text-gray-500">meters radius</span>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5">
        Leave latitude/longitude blank to skip location checks for this branch.
      </p>
    </div>
  );
});
