import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

export interface WorkSite {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
}

export function useWorkSites(branchId: string) {
  const [sites, setSites] = useState<WorkSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteAddress, setNewSiteAddress] = useState("");
  const [addingMode, setAddingMode] = useState(false);
  const [savingSite, setSavingSite] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editingSiteName, setEditingSiteName] = useState("");
  const [editingSiteAddress, setEditingSiteAddress] = useState("");
  const [locatingNew, setLocatingNew] = useState(false);
  const [locatingEdit, setLocatingEdit] = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
      const json = await res.json();
      return json.results?.[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  const handleUseCurrentLocation = useCallback(async (
    setter: (v: string) => void,
    setLocating: (v: boolean) => void
  ) => {
    if (!navigator.geolocation) {
      toast("Not supported", "Geolocation is not supported by your browser", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setter(address);
        setLocating(false);
        toast("Location detected", "Address filled from your current location", "success");
      },
      () => {
        setLocating(false);
        toast("Location denied", "Please allow location access or type the address manually", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode]);

  const fetchSites = useCallback(async () => {
    setSitesLoading(true);
    const { data } = await supabase
      .from("work_locations")
      .select("id, name, description, is_default")
      .eq("branch_id", branchId)
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name");
    setSites((data as WorkSite[]) || []);
    setSitesLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleAddSite = async () => {
    const name = newSiteName.trim();
    const address = newSiteAddress.trim();
    if (!name || !address || savingSite) return;
    setSavingSite(true);
    const isFirst = sites.length === 0;
    const { error } = await supabase.from("work_locations").insert({
      branch_id: branchId,
      name,
      description: address,
      is_default: isFirst,
    });
    setSavingSite(false);
    if (error) {
      toast("Error", error.message || "Could not add work site", "error");
      return;
    }
    setNewSiteName("");
    setNewSiteAddress("");
    setAddingMode(false);
    toast("Success", `"${name}" added${isFirst ? " as default site" : ""}`, "success");
    fetchSites();
  };

  const handleSetDefault = async (site: WorkSite) => {
    if (site.is_default) return;
    await supabase.from("work_locations").update({ is_default: false }).eq("branch_id", branchId);
    await supabase.from("work_locations").update({ is_default: true }).eq("id", site.id);
    toast("Updated", `"${site.name}" is now the default work site`, "success");
    fetchSites();
  };

  const handleSaveEdit = async (site: WorkSite) => {
    const name = editingSiteName.trim();
    const address = editingSiteAddress.trim();
    if (!name || !address || savingSite) return;
    setSavingSite(true);
    const { error } = await supabase.from("work_locations").update({ name, description: address }).eq("id", site.id);
    setSavingSite(false);
    if (error) {
      toast("Error", error.message || "Could not update site", "error");
      return;
    }
    setEditingSiteId(null);
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
    newSiteName,
    setNewSiteName,
    newSiteAddress,
    setNewSiteAddress,
    addingMode,
    setAddingMode,
    savingSite,
    editingSiteId,
    setEditingSiteId,
    editingSiteName,
    setEditingSiteName,
    editingSiteAddress,
    setEditingSiteAddress,
    locatingNew,
    setLocatingNew,
    locatingEdit,
    setLocatingEdit,
    handleUseCurrentLocation,
    handleAddSite,
    handleSetDefault,
    handleSaveEdit,
    handleDeleteSite,
  };
}
