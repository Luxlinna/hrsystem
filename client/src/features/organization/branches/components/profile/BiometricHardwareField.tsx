import { useState } from "react";
import { FormRow } from "./FormRow";
import { useBiometricDevices } from "../../hooks/useBiometricDevices";
import { useWorkSites } from "../../hooks/useWorkSites";
import { BiometricDeviceModal } from "../BiometricDeviceModal";
import type { BranchFormState } from "../../types";

interface BiometricHardwareFieldProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
  branchId?: string;
  branchName?: string;
}

export function BiometricHardwareField({ form, setForm, branchId = "", branchName }: BiometricHardwareFieldProps) {
  const isEnabled = Boolean(form.is_biometrics_enabled);
  const { devices, modalOpen, editingDevice, saving, openAddModal, openEditModal, closeModal, handleSaveDevice, handleDeleteDevice } = useBiometricDevices(branchId);
  const { sites } = useWorkSites(branchId);

  const handleToggle = (checked: boolean) => {
    setForm((prev) => ({ ...prev, is_biometrics_enabled: checked }));
    if (checked && devices.length === 0) {
      openAddModal();
    }
  };

  return (
    <>
      <FormRow label="Biometric Machines" alignTop>
        <div className="space-y-3 pt-0.5">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => handleToggle(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#0088cc] focus:ring-[#0088cc] cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="ri-fingerprint-line text-sm text-[#0088cc]" />
              Enable Biometric Fingerprint / Facial Machines (ZKTeco)
            </span>
          </label>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal pl-6">
            {isEnabled
              ? "Biometric machines are enabled for this Business Unit. Configure ZKTeco IP or Cloud Push machines below."
              : "When disabled, biometric machine management is hidden from Sites. Enable this if this BU utilizes physical ZKTeco hardware."}
          </p>

          {/* Machine List & Add Button when enabled */}
          {isEnabled && (
            <div className="pl-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Configured Machines ({devices.length})
                </span>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="text-[11px] font-semibold text-[#0088cc] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <i className="ri-add-line" /> Add Machine
                </button>
              </div>

              {devices.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-center">
                  <p className="text-xs text-slate-400 italic">No biometric fingerprint machines registered yet.</p>
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-1.5 text-xs font-semibold text-[#0088cc] hover:underline cursor-pointer"
                  >
                    + Register ZKTeco Machine (IP / Cloud)
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {devices.map((dev) => {
                    const assignedSite = sites.find((s) => s.id === dev.work_location_id);
                    return (
                      <div
                        key={dev.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0088cc] flex items-center justify-center shrink-0">
                            <i className="ri-fingerprint-fill text-sm" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{dev.device_name}</p>
                            <p className="text-[10px] text-slate-400 truncate">
                              SN: {dev.device_serial} {dev.device_ip ? `• IP: ${dev.device_ip}` : "• Cloud ADMS"}
                              {assignedSite ? ` • ${assignedSite.name}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(dev)}
                            className="p-1 text-slate-400 hover:text-[#0088cc] rounded cursor-pointer"
                            title="Edit Device"
                          >
                            <i className="ri-edit-line text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDevice(dev)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Delete Device"
                          >
                            <i className="ri-delete-bin-line text-xs" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </FormRow>

      <BiometricDeviceModal
        isOpen={modalOpen}
        editingDevice={editingDevice}
        sites={sites}
        branchName={branchName}
        saving={saving}
        onClose={closeModal}
        onSubmit={(deviceForm) => {
          handleSaveDevice(deviceForm);
          setForm((prev) => ({ ...prev, is_biometrics_enabled: true }));
        }}
      />
    </>
  );
}
