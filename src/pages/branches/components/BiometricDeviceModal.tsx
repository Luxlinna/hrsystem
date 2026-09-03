import React, { memo, useState, useEffect } from "react";
import { toast } from "@/components/Toast";
import type { BiometricDevice, BiometricDeviceFormState, WorkSite } from "../types";

interface BiometricDeviceModalProps {
  isOpen: boolean;
  editingDevice: BiometricDevice | null;
  sites: WorkSite[];
  branchName?: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: BiometricDeviceFormState) => void;
}

export const BiometricDeviceModal = memo(function BiometricDeviceModal({
  isOpen,
  editingDevice,
  sites,
  branchName,
  saving,
  onClose,
  onSubmit,
}: BiometricDeviceModalProps) {
  const [form, setForm] = useState<BiometricDeviceFormState>({
    device_name: "",
    device_serial: "",
    device_ip: "192.168.1.201",
    device_port: "4370",
    device_model: "ZKTeco K40 / SilkBio",
    work_location_id: "",
  });

  const cloudServerHost = "hrsystem-quit.onrender.com";

  useEffect(() => {
    if (editingDevice) {
      setForm({
        device_name: editingDevice.device_name || "",
        device_serial: editingDevice.device_serial || "",
        device_ip: editingDevice.device_ip || "192.168.1.201",
        device_port: String(editingDevice.device_port || 4370),
        device_model: editingDevice.device_model || "ZKTeco K40 / SilkBio",
        work_location_id: editingDevice.work_location_id || "",
      });
    } else {
      setForm({
        device_name: "",
        device_serial: "",
        device_ip: "192.168.1.201",
        device_port: "4370",
        device_model: "ZKTeco K40 / SilkBio",
        work_location_id: sites[0]?.id || "",
      });
    }
  }, [editingDevice, isOpen, sites]);

  const handleCopyCloudUrl = () => {
    navigator.clipboard.writeText(cloudServerHost);
    toast("Copied", "ZKTeco Cloud ADMS Server Address copied to clipboard", "success");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.device_name.trim() || !form.device_serial.trim()) {
      toast("Required fields", "Please enter device name and serial number.", "error");
      return;
    }
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl w-full max-w-lg my-8 sm:my-0 max-h-[calc(100vh-4rem)] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-fingerprint-line text-lg" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">
                {editingDevice ? "Edit Fingerprint Machine" : "Register Fingerprint Machine"}
              </h2>
              <p className="text-[11px] text-gray-400">Configure ZKTeco IP or Cloud Push for this branch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <i className="ri-close-line text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Device Name & Serial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Device Name *</label>
              <input
                type="text"
                required
                value={form.device_name}
                onChange={(e) => setForm({ ...form, device_name: e.target.value })}
                placeholder="e.g. Kampong Thom Scanner"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Device Serial (SN) *</label>
              <input
                type="text"
                required
                value={form.device_serial}
                onChange={(e) => setForm({ ...form, device_serial: e.target.value })}
                placeholder="e.g. BKT98327401"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Assigned Work Site */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Assigned Work Site</label>
            <select
              value={form.work_location_id}
              onChange={(e) => setForm({ ...form, work_location_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">{branchName || "Main Branch Location"}</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* IP Address & Port */}
          <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Local IP Address (Wi-Fi / Ethernet)
              </label>
              <input
                type="text"
                value={form.device_ip}
                onChange={(e) => setForm({ ...form, device_ip: e.target.value })}
                placeholder="e.g. 192.168.1.201"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">TCP Port</label>
              <input
                type="number"
                value={form.device_port}
                onChange={(e) => setForm({ ...form, device_port: e.target.value })}
                placeholder="4370"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Hardware Model / Brand</label>
            <input
              type="text"
              value={form.device_model}
              onChange={(e) => setForm({ ...form, device_model: e.target.value })}
              placeholder="e.g. ZKTeco K40 / SilkBio-101TC"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Cloud Push ADMS Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <i className="ri-cloud-line text-[#253C7D]" />
                Remote Cloud Server (ADMS / Push)
              </p>
              <button
                type="button"
                onClick={handleCopyCloudUrl}
                className="text-[10px] font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <i className="ri-file-copy-line" /> Copy Domain
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              In ZKTeco Menu: <strong>Comm. ➔ Cloud Server</strong>. Set <strong>Enable Domain Name: ON</strong>, enter this domain in <strong>Server Address</strong>, and turn <strong>Enable Proxy: OFF</strong>.
            </p>
            <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 font-mono select-all truncate">
              {cloudServerHost}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 p-5 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-[#253C7D] text-white text-xs font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving..." : editingDevice ? "Save Changes" : "Register Machine"}
          </button>
        </div>
      </form>
    </div>
  );
});
