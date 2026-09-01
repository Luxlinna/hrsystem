import { memo } from "react";
import { useBiometricDevices } from "../hooks/useBiometricDevices";
import { useWorkSites } from "../hooks/useWorkSites";
import { BiometricDeviceModal } from "./BiometricDeviceModal";

interface BranchBiometricsSectionProps {
  branchId: string;
  canManage: boolean;
}

export const BranchBiometricsSection = memo(function BranchBiometricsSection({
  branchId,
  canManage,
}: BranchBiometricsSectionProps) {
  const {
    devices,
    loading,
    modalOpen,
    editingDevice,
    saving,
    testingPing,
    openAddModal,
    openEditModal,
    closeModal,
    handleSaveDevice,
    handleDeleteDevice,
    handleTestPing,
  } = useBiometricDevices(branchId);

  const { sites } = useWorkSites(branchId);

  return (
    <div className="p-5 border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <i className="ri-fingerprint-line" /> Biometric Machines
          {devices.length > 0 && (
            <span className="bg-[#253C7D]/10 text-[#253C7D] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {devices.length}
            </span>
          )}
        </h3>
        {canManage && (
          <button
            type="button"
            onClick={openAddModal}
            className="text-[11px] font-semibold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <i className="ri-add-line" /> Add Machine
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-2">Loading fingerprint machines...</p>
      ) : devices.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center">
          <p className="text-xs text-gray-400 italic">No biometric fingerprint machines registered.</p>
          {canManage && (
            <button
              type="button"
              onClick={openAddModal}
              className="mt-2 text-xs font-semibold text-[#253C7D] hover:underline cursor-pointer"
            >
              + Register ZKTeco Machine (IP / Cloud)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((dev) => {
            const assignedSite = sites.find((s) => s.id === dev.work_location_id);
            const isPinging = testingPing === dev.id;

            return (
              <div
                key={dev.id}
                className="p-3.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center shrink-0">
                      <i className="ri-fingerprint-fill text-sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{dev.device_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">SN: {dev.device_serial}</p>
                    </div>
                  </div>

                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-50 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px]">
                    <i className="ri-router-line text-gray-400" />
                    {dev.device_ip ? `${dev.device_ip}:${dev.device_port || 4370}` : "Cloud ADMS Push"}
                    {assignedSite && (
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-sans text-[10px]">
                        {assignedSite.name}
                      </span>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTestPing(dev)}
                        disabled={isPinging}
                        title="Test connection"
                        className="px-2 py-0.5 text-[10px] font-semibold text-[#253C7D] hover:bg-blue-50 rounded border border-blue-100 cursor-pointer disabled:opacity-50"
                      >
                        <i className={isPinging ? "ri-loader-4-line animate-spin mr-1" : "ri-wifi-line mr-1"} />
                        {isPinging ? "Testing..." : "Test"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(dev)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-[#253C7D] rounded cursor-pointer"
                      >
                        <i className="ri-edit-line text-xs" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDevice(dev)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-xs" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BiometricDeviceModal
        isOpen={modalOpen}
        editingDevice={editingDevice}
        sites={sites}
        saving={saving}
        onClose={closeModal}
        onSubmit={handleSaveDevice}
      />
    </div>
  );
});
