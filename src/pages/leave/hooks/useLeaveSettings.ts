import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchLeaveSettings,
  upsertLeaveSetting,
  deleteLeaveSetting,
  type LeaveTypeSetting,
} from "../services/leaveSettingsService";

export const AVAILABLE_CONTRACT_TYPES = [
  "UDC (Permanent)",
  "FDC (Fixed Duration)",
  "Probation",
  "Internship",
  "Part-time",
  "Apprentice",
];

export function useLeaveSettings() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingType, setEditingType] = useState<LeaveTypeSetting | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaveSettings();
    setLeaveTypes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return leaveTypes;
    const q = searchQuery.toLowerCase();
    return leaveTypes.filter(
      (t) => t.code.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
  }, [leaveTypes, searchQuery]);

  const handleSave = useCallback(
    async (data: Omit<LeaveTypeSetting, "id"> & { id?: string }) => {
      setSaving(true);
      try {
        const saved = await upsertLeaveSetting(data);
        setLeaveTypes((prev) => {
          const exists = prev.some((x) => x.id === saved.id);
          if (exists) return prev.map((x) => (x.id === saved.id ? saved : x));
          return [...prev, saved];
        });
        showToast("success", `Leave type "${saved.name}" saved successfully!`);
        setEditingType(null);
        return true;
      } catch (err: any) {
        showToast("error", err?.message || "Failed to save leave type.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [showToast]
  );

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Are you sure you want to delete leave type "${name}"?`)) return;
      await deleteLeaveSetting(id);
      setLeaveTypes((prev) => prev.filter((x) => x.id !== id));
      showToast("success", `Leave type "${name}" removed.`);
    },
    [showToast]
  );

  const handleToggleActive = useCallback(
    async (item: LeaveTypeSetting) => {
      const updated = { ...item, is_active: !item.is_active };
      await upsertLeaveSetting(updated);
      setLeaveTypes((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
      showToast("success", `Leave type "${item.code}" ${updated.is_active ? "enabled" : "disabled"}.`);
    },
    [showToast]
  );

  return {
    leaveTypes: filteredTypes,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    editingType,
    setEditingType,
    toast,
    handleSave,
    handleDelete,
    handleToggleActive,
    refresh: loadData,
  };
}
