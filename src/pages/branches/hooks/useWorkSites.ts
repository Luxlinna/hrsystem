import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { WorkSite, WorkSiteFormState } from "../types";
export type { WorkSite };

export function useWorkSites(branchId: string) {
  const [sites, setSites] = useState<WorkSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<WorkSite | null>(null);
  const [savingSite, setSavingSite] = useState(false);

  const fetchSites = useCallback(async () => {
    setSitesLoading(true);
    const { data, error } = await supabase
      .from("work_locations")
      .select(`
        id, branch_id, name, description, is_default,
        latitude, longitude, geofence_radius_m,
        work_start_time, work_end_time, break_start_time, break_end_time,
        late_grace_minutes, early_leave_grace_minutes,
        is_four_punch_enabled
      `)
      .eq("branch_id", branchId)
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name");

    if (!error && data) {
      setSites(data as WorkSite[]);
    }
    setSitesLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const openAddModal = useCallback(() => {
    setEditingSite(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((site: WorkSite) => {
    setEditingSite(site);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingSite(null);
  }, []);

  const handleSubmitSite = async (formData: WorkSiteFormState) => {
    setSavingSite(true);

    const formatTimeSeconds = (t?: string, defaultVal = "08:00:00") => {
      if (!t || !t.trim()) return defaultVal;
      const parts = t.trim().split(":");
      const h = (parts[0] || "00").padStart(2, "0");
      const m = (parts[1] || "00").padStart(2, "0");
      const s = (parts[2] || "00").padStart(2, "0");
      return `${h}:${m}:${s}`;
    };

    const payload = {
      branch_id: branchId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      latitude: formData.latitude.trim() ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude.trim() ? parseFloat(formData.longitude) : null,
      geofence_radius_m: parseInt(formData.geofence_radius_m || "100", 10) || 100,
      work_start_time: formatTimeSeconds(formData.work_start_time, "07:30:00"),
      work_end_time: formatTimeSeconds(formData.work_end_time, "17:00:00"),
      break_start_time: formatTimeSeconds(formData.break_start_time, "11:30:00"),
      break_end_time: formatTimeSeconds(formData.break_end_time, "13:00:00"),
      late_grace_minutes: formData.late_grace_minutes?.trim() ? parseInt(formData.late_grace_minutes, 10) || 15 : 15,
      early_leave_grace_minutes: formData.early_leave_grace_minutes?.trim() ? parseInt(formData.early_leave_grace_minutes, 10) || 15 : 15,
      is_four_punch_enabled: formData.is_four_punch_enabled,
    };

    if (editingSite) {
      const { error } = await supabase
        .from("work_locations")
        .update(payload)
        .eq("id", editingSite.id);

      setSavingSite(false);
      if (error) {
        toast("Error", error.message || "Could not update work site", "error");
        return;
      }
      toast("Saved", `"${formData.name}" updated successfully`, "success");
    } else {
      const isFirst = sites.length === 0;
      const { error } = await supabase
        .from("work_locations")
        .insert({ ...payload, is_default: isFirst });

      setSavingSite(false);
      if (error) {
        toast("Error", error.message || "Could not add work site", "error");
        return;
      }
      toast("Created", `"${formData.name}" added${isFirst ? " as default site" : ""}`, "success");
    }

    closeModal();
    fetchSites();
  };

  const handleSetDefault = async (site: WorkSite) => {
    if (site.is_default) return;
    await supabase.from("work_locations").update({ is_default: false }).eq("branch_id", branchId);
    await supabase.from("work_locations").update({ is_default: true }).eq("id", site.id);
    toast("Updated", `"${site.name}" is now the default work site`, "success");
    fetchSites();
  };

  const handleDeleteSite = async (site: WorkSite) => {
    if (!confirm(`Remove "${site.name}" from this branch?`)) return;
    await supabase.from("work_locations").update({ deleted_at: new Date().toISOString() }).eq("id", site.id);
    toast("Removed", `"${site.name}" removed`, "success");
    fetchSites();
  };

  return {
    sites,
    sitesLoading,
    modalOpen,
    editingSite,
    savingSite,
    openAddModal,
    openEditModal,
    closeModal,
    handleSubmitSite,
    handleSetDefault,
    handleDeleteSite,
  };
}
