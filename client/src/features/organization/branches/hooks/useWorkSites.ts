import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { WorkSite, WorkSiteFormState } from "../types";
export type { WorkSite };

const formatTimeSec = (t?: string, def = "08:00:00") => {
  if (!t || !t.trim()) return def;
  const [h = "00", m = "00", s = "00"] = t.trim().split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
};

export function useWorkSites(branchId: string) {
  const [sites, setSites] = useState<WorkSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [currentView, setCurrentView] = useState<"table" | "create" | "edit" | "view">("table");
  const [selectedSite, setSelectedSite] = useState<WorkSite | null>(null);
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
        morning_check_in_start, morning_check_in_end,
        morning_check_out_start, morning_check_out_end,
        afternoon_check_in_start, afternoon_check_in_end,
        afternoon_check_out_start, afternoon_check_out_end,
        is_four_punch_enabled,
        site_type, address, city, province, postal_code, country,
        phone_number, email, website, status
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

  useEffect(() => { fetchSites(); }, [fetchSites]);

  const openCreate = useCallback(() => { setSelectedSite(null); setCurrentView("create"); }, []);
  const openEdit = useCallback((site: WorkSite) => { setSelectedSite(site); setCurrentView("edit"); }, []);
  const openView = useCallback((site: WorkSite) => { setSelectedSite(site); setCurrentView("view"); }, []);
  const closeForm = useCallback(() => { setCurrentView("table"); setSelectedSite(null); }, []);

  const handleSubmitSite = async (formData: WorkSiteFormState) => {
    setSavingSite(true);

    const basePayload = {
      branch_id: branchId,
      name: formData.name.trim(),
      description: formData.address?.trim() || formData.description?.trim() || null,
      site_type: formData.site_type || "Store",
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || "Phnom Penh",
      province: formData.province?.trim() || null,
      postal_code: formData.postal_code?.trim() || null,
      country: formData.country?.trim() || "Cambodia",
      phone_number: formData.phone_number?.trim() || null,
      email: formData.email?.trim() || null,
      website: formData.website?.trim() || null,
      status: formData.status || "active",
      latitude: formData.latitude?.trim() ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude?.trim() ? parseFloat(formData.longitude) : null,
      geofence_radius_m: parseInt(formData.geofence_radius_m || "100", 10) || 100,
      work_start_time: formatTimeSec(formData.work_start_time, "07:30:00"),
      work_end_time: formatTimeSec(formData.work_end_time, "17:00:00"),
      break_start_time: formatTimeSec(formData.break_start_time, "11:30:00"),
      break_end_time: formatTimeSec(formData.break_end_time, "13:00:00"),
      late_grace_minutes: formData.late_grace_minutes?.trim() ? parseInt(formData.late_grace_minutes, 10) || 15 : 15,
      early_leave_grace_minutes: formData.early_leave_grace_minutes?.trim() ? parseInt(formData.early_leave_grace_minutes, 10) || 15 : 15,
      morning_check_in_start: formatTimeSec(formData.morning_check_in_start, "06:00:00"),
      morning_check_in_end: formatTimeSec(formData.morning_check_in_end, "09:00:00"),
      morning_check_out_start: formatTimeSec(formData.morning_check_out_start, "10:00:00"),
      morning_check_out_end: formatTimeSec(formData.morning_check_out_end, "12:00:00"),
      afternoon_check_in_start: formatTimeSec(formData.afternoon_check_in_start, "12:00:00"),
      afternoon_check_in_end: formatTimeSec(formData.afternoon_check_in_end, "14:00:00"),
      afternoon_check_out_start: formatTimeSec(formData.afternoon_check_out_start, "16:00:00"),
      afternoon_check_out_end: formatTimeSec(formData.afternoon_check_out_end, "18:00:00"),
      is_four_punch_enabled: formData.is_four_punch_enabled ?? false,
    };

    const fullPayload = {
      ...basePayload,
      auto_checkout_time: formatTimeSec(formData.auto_checkout_time, "18:00:00"),
      is_auto_checkout_enabled: formData.is_auto_checkout_enabled ?? true,
    };

    let targetSiteId = selectedSite?.id;
    if (selectedSite && (currentView === "edit" || currentView === "create")) {
      let res = await supabase.from("work_locations").update(fullPayload).eq("id", selectedSite.id);
      if (res.error) {
        // Fallback without extended column
        res = await supabase.from("work_locations").update(basePayload).eq("id", selectedSite.id);
      }
      setSavingSite(false);
      if (res.error) return toast("Error", res.error.message || "Could not update site", "error");
      toast("Saved", `"${formData.name}" updated successfully`, "success");
    } else {
      const isFirst = sites.length === 0;
      let res = await supabase.from("work_locations").insert({ ...fullPayload, is_default: isFirst }).select("id").single();
      if (res.error) {
        res = await supabase.from("work_locations").insert({ ...basePayload, is_default: isFirst }).select("id").single();
      }
      setSavingSite(false);
      if (res.error) return toast("Error", res.error.message || "Could not create site", "error");
      targetSiteId = res.data?.id;
      toast("Created", `"${formData.name}" created successfully`, "success");
    }

    if (targetSiteId) {
      await supabase.from("system_settings").upsert([
        { key: `site_auto_checkout_time_${targetSiteId}`, value: formData.auto_checkout_time || "18:00", updated_at: new Date().toISOString() },
        { key: `site_auto_checkout_enabled_${targetSiteId}`, value: String(formData.is_auto_checkout_enabled ?? true), updated_at: new Date().toISOString() },
      ], { onConflict: "key" });
    }

    closeForm();
    fetchSites();
  };

  const handleToggleStatus = async (site: WorkSite) => {
    const nextStatus = site.status === "disabled" ? "active" : "disabled";
    const { error } = await supabase.from("work_locations").update({ status: nextStatus }).eq("id", site.id);
    if (error) return toast("Error", error.message || "Failed to update status", "error");
    toast("Status Updated", `"${site.name}" is now ${nextStatus}`, "success");
    fetchSites();
  };

  const handleSetDefault = async (site: WorkSite) => {
    if (site.is_default) return;
    await supabase.from("work_locations").update({ is_default: false }).eq("branch_id", branchId);
    await supabase.from("work_locations").update({ is_default: true }).eq("id", site.id);
    toast("Updated", `"${site.name}" is now the default site`, "success");
    fetchSites();
  };

  const handleDeleteSite = async (site: WorkSite) => {
    if (!confirm(`Delete site "${site.name}" from this branch?`)) return;
    const { error } = await supabase.from("work_locations").update({ deleted_at: new Date().toISOString() }).eq("id", site.id);
    if (error) return toast("Error", error.message || "Could not delete site", "error");
    toast("Deleted", `"${site.name}" has been deleted`, "success");
    fetchSites();
  };

  return {
    sites, sitesLoading, currentView, selectedSite, savingSite,
    openCreate, openEdit, openView, closeForm,
    handleSubmitSite, handleToggleStatus, handleSetDefault, handleDeleteSite,
  };
}
