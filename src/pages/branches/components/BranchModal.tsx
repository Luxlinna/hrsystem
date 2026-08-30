import React, { memo } from "react";
import type { BranchFormState } from "../types";
import { BranchLocationPicker } from "./BranchLocationPicker";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl w-full max-w-2xl my-8 sm:my-0 max-h-[calc(100vh-4rem)] flex flex-col shadow-2xl border border-gray-100"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">
              {editingBranchId ? "Edit Branch" : "Add New Branch"}
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {editingBranchId ? "Update this branch's details" : "Create a new office or branch location"}
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
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Branch Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., West Branch - Los Angeles"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Location / City *</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Los Angeles, CA"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Branch Manager *</label>
              <input
                type="text"
                required
                value={form.manager_name}
                onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                placeholder="e.g., John Smith"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

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

          <div className="border-t border-gray-100 pt-5">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Work Schedule (optional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="time"
                  value={form.work_start_time}
                  onChange={(e) => setForm({ ...form, work_start_time: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
                />
                <p className="text-[11px] text-gray-400 mt-1">Start time — check-ins after this count as late</p>
              </div>
              <div>
                <input
                  type="time"
                  value={form.work_end_time}
                  onChange={(e) => setForm({ ...form, work_end_time: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
                />
                <p className="text-[11px] text-gray-400 mt-1">End time — check-outs before this count as early</p>
              </div>
            </div>
          </div>
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
            disabled={submitting}
            className="flex-1 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Saving..." : editingBranchId ? "Save Changes" : "Create Branch"}
          </button>
        </div>
      </form>
    </div>
  );
});
