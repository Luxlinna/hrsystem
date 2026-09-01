import React, { memo, useState, useEffect } from "react";
import { toast } from "@/components/Toast";
import type { WorkSite, WorkSiteFormState } from "../types";
export type { WorkSiteFormState };
import { useWorkSiteLocation } from "../hooks/useWorkSiteLocation";
import { WorkSiteGeofenceSection } from "./WorkSiteGeofenceSection";
import { WorkSiteScheduleSection } from "./WorkSiteScheduleSection";

interface WorkSiteModalProps {
  isOpen: boolean;
  editingSite: WorkSite | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: WorkSiteFormState) => void;
}

export const WorkSiteModal = memo(function WorkSiteModal({
  isOpen,
  editingSite,
  saving,
  onClose,
  onSubmit,
}: WorkSiteModalProps) {
  const [form, setForm] = useState<WorkSiteFormState>({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    geofence_radius_m: "100",
    work_start_time: "07:30",
    work_end_time: "17:00",
    break_start_time: "11:30",
    break_end_time: "13:00",
    is_four_punch_enabled: true,
  });

  const {
    locating,
    geocoding,
    addressLookup,
    setAddressLookup,
    addressInputRef,
    useCurrentLocation,
    handleGeocodeAddress,
  } = useWorkSiteLocation({ isOpen, setForm });

  useEffect(() => {
    if (editingSite) {
      setForm({
        name: editingSite.name || "",
        description: editingSite.description || "",
        latitude: editingSite.latitude != null ? String(editingSite.latitude) : "",
        longitude: editingSite.longitude != null ? String(editingSite.longitude) : "",
        geofence_radius_m: String(editingSite.geofence_radius_m || 100),
        work_start_time: editingSite.work_start_time?.slice(0, 5) || "07:30",
        work_end_time: editingSite.work_end_time?.slice(0, 5) || "17:00",
        break_start_time: editingSite.break_start_time?.slice(0, 5) || "11:30",
        break_end_time: editingSite.break_end_time?.slice(0, 5) || "13:00",
        is_four_punch_enabled: editingSite.is_four_punch_enabled ?? true,
      });
      setAddressLookup(editingSite.description || "");
    } else {
      setForm({
        name: "",
        description: "",
        latitude: "",
        longitude: "",
        geofence_radius_m: "100",
        work_start_time: "07:30",
        work_end_time: "17:00",
        break_start_time: "11:30",
        break_end_time: "13:00",
        is_four_punch_enabled: true,
      });
      setAddressLookup("");
    }
  }, [editingSite, isOpen, setAddressLookup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Name required", "Please provide a site name.", "error");
      return;
    }
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-2xl my-8 sm:my-0 max-h-[calc(100vh-4rem)] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">
              {editingSite ? "Edit Work Site" : "Add New Work Site"}
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {editingSite ? "Update site location, geofence and attendance rules" : "Create a new branch site, farm, or factory"}
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

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Site Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Kampong Thom Site"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Location / City *</label>
              <input
                type="text"
                required
                value={form.description}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value });
                  setAddressLookup(e.target.value);
                }}
                placeholder="e.g., National Road 62, Kampong Thom, Cambodia"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <WorkSiteGeofenceSection
            form={form}
            setForm={setForm}
            addressLookup={addressLookup}
            setAddressLookup={setAddressLookup}
            addressInputRef={addressInputRef}
            locating={locating}
            geocoding={geocoding}
            onUseCurrentLocation={useCurrentLocation}
            onGeocodeAddress={handleGeocodeAddress}
          />

          <WorkSiteScheduleSection form={form} setForm={setForm} />
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving..." : editingSite ? "Save Changes" : "Create Work Site"}
          </button>
        </div>
      </form>
    </div>
  );
});
