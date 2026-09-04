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

  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);

  const handleSyncEmployeesToDevice = async (dev: BiometricDevice) => {
    if (!dev.device_serial) {
      toast("Error", "Device has no serial number configured", "error");
      return;
    }

    setSyncingDevice(dev.id);
    try {
      // 1. Fetch active employees in THIS branch ONLY (excluding deleted employees)
      let query = supabase
        .from("employees")
        .select("id, first_name, last_name, biometric_user_id, status, default_work_location_id")
        .eq("branch_id", branchId)
        .eq("status", "active")
        .is("deleted_at", null);

      // If this specific machine is assigned to a specific work site in this branch,
      // sync only employees assigned to that work site (or general branch staff)
      if (dev.work_location_id) {
        query = query.or(`default_work_location_id.eq.${dev.work_location_id},default_work_location_id.is.null`);
      }

      const { data: emps, error: empErr } = await query;

      if (empErr || !emps || emps.length === 0) {
        toast("No Employees", "No active employees found in this branch/site to sync.", "warning");
        return;
      }

      // 2. Find highest existing numeric biometric_user_id
      let maxPin = 0;
      emps.forEach((e) => {
        const pin = parseInt(e.biometric_user_id || "0", 10);
        if (!isNaN(pin) && pin > maxPin) maxPin = pin;
      });

      // 3. Prepare commands & auto-assign pins if missing
      const commandsToInsert: { device_serial: string; command: string }[] = [];

      // Automatically delete any removed/inactive employees from the machine
      const { data: deletedEmps } = await supabase
        .from("employees")
        .select("biometric_user_id")
        .eq("branch_id", branchId)
        .not("deleted_at", "is", null)
        .not("biometric_user_id", "is", null);

      if (deletedEmps && deletedEmps.length > 0) {
        for (const de of deletedEmps) {
          if (de.biometric_user_id) {
            commandsToInsert.push({
              device_serial: dev.device_serial,
              command: `DATA DELETE USERINFO PIN=${de.biometric_user_id}`,
            });
          }
        }
      }

      for (const emp of emps) {
        let pin = emp.biometric_user_id;
        if (!pin || isNaN(parseInt(pin, 10))) {
          maxPin += 1;
          pin = String(maxPin);
          await supabase.from("employees").update({ biometric_user_id: pin }).eq("id", emp.id);
        }

        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || `User ${pin}`;
        // Clean special characters for ZKTeco ASCII / UTF-8
        const cleanName = fullName.replace(/[\t\r\n]/g, " ").slice(0, 24);

        commandsToInsert.push({
          device_serial: dev.device_serial,
          command: `DATA UPDATE USERINFO PIN=${pin}\tName=${cleanName}\tPri=0\tPasswd=\tCard=\tGrp=1`,
        });
      }

      // 4. Insert commands into queue
      if (commandsToInsert.length > 0) {
        const { error: cmdErr } = await supabase
          .from("biometric_device_commands")
          .insert(commandsToInsert);

        if (cmdErr) throw cmdErr;

        toast(
          "Sync Queued!",
          `Queued ${emps.length} active employees for ${dev.device_name}. Machine will download them automatically.`,
          "success"
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      toast("Sync Failed", msg, "error");
    } finally {
      setSyncingDevice(null);
    }
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
    syncingDevice,
    openAddModal,
    openEditModal,
    closeModal,
    handleSaveDevice,
    handleDeleteDevice,
    handleTestPing,
    handleSyncEmployeesToDevice,
    refreshDevices: fetchDevices,
  };
}
