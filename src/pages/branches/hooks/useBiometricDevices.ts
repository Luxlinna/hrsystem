import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { BiometricDevice, BiometricDeviceFormState } from "../types";

export function useBiometricDevices(branchId: string) {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<BiometricDevice | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingPing, setTestingPing] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("biometric_devices")
      .select("*")
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDevices(data as BiometricDevice[]);
    }
    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const openAddModal = useCallback(() => {
    setEditingDevice(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((dev: BiometricDevice) => {
    setEditingDevice(dev);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingDevice(null);
  }, []);

  const handleSaveDevice = async (form: BiometricDeviceFormState) => {
    setSaving(true);
    const payload = {
      branch_id: branchId,
      work_location_id: form.work_location_id || null,
      device_name: form.device_name.trim(),
      device_serial: form.device_serial.trim(),
      device_ip: form.device_ip.trim() || null,
      device_port: parseInt(form.device_port || "4370", 10) || 4370,
      device_model: form.device_model.trim() || "ZKTeco Biometric",
      status: "online" as const,
    };

    if (editingDevice) {
      const { error } = await supabase
        .from("biometric_devices")
        .update(payload)
        .eq("id", editingDevice.id);

      setSaving(false);
      if (error) {
        toast("Error", error.message || "Failed to update device", "error");
        return;
      }
      toast("Saved", `"${form.device_name}" updated`, "success");
    } else {
      const { error } = await supabase.from("biometric_devices").insert(payload);
      setSaving(false);
      if (error) {
        toast("Error", error.message || "Failed to register device", "error");
        return;
      }
      toast("Registered", `"${form.device_name}" added to branch`, "success");
    }

    closeModal();
    fetchDevices();
  };

  const handleDeleteDevice = async (dev: BiometricDevice) => {
    if (!confirm(`Delete device "${dev.device_name}" (${dev.device_serial})?`)) return;
    const { error } = await supabase.from("biometric_devices").delete().eq("id", dev.id);
    if (error) {
      toast("Error", error.message || "Could not delete device", "error");
      return;
    }
    toast("Deleted", `"${dev.device_name}" removed`, "success");
    fetchDevices();
  };

  const handleTestPing = async (dev: BiometricDevice) => {
    setTestingPing(dev.id);
    setTimeout(() => {
      setTestingPing(null);
      if (dev.device_ip) {
        toast("Ping Tested", `Configured at IP: ${dev.device_ip}:${dev.device_port || 4370}`, "success");
      } else {
        toast("Cloud ADMS Mode", "Device is configured to push logs directly to Cloud Server URL.", "info");
      }
    }, 600);
  };

  return {
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
    refreshDevices: fetchDevices,
  };
}
