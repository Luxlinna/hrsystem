import { memo, useState, useEffect, useCallback } from "react";
import type { Branch, Employee } from "../types";
import { statusColors, deptColors } from "../constants";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface WorkSite {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
}

interface BranchDetailDrawerProps {
  branch: Branch | null;
  employees: Employee[];
  deptGroups: Record<string, Employee[]>;
  empLoading: boolean;
  canManage: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  userBranchId?: string | null;
  onClose: () => void;
  onOpenEditModal: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch) => void;
  onToggleStatus: (branch: Branch) => void;
}

// ── Outer wrapper: handles null branch without touching hooks ──────────────
export const BranchDetailDrawer = memo(function BranchDetailDrawer(props: BranchDetailDrawerProps) {
  if (!props.branch) return null;
  return <BranchDetailDrawerInner {...props} branch={props.branch} />;
});

// ── Inner component: branch is guaranteed non-null, hooks are always called ─
function BranchDetailDrawerInner({
  branch,
  employees,
  deptGroups,
  empLoading,
  canManage,
  isAdmin,
  isSuperAdmin = false,
  userBranchId = null,
  onClose,
  onOpenEditModal,
  onDeleteBranch,
  onToggleStatus,
}: BranchDetailDrawerProps & { branch: Branch }) {
  // Branch Admins can only manage work sites and branch details for their own branch.
  // Super Admins / full Admins can manage all branches.
  const canManageThisBranch = isSuperAdmin || isAdmin || (canManage && (!userBranchId || branch.id === userBranchId));
  // ── Work Sites state ────────────────────────────────────────────────────
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
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
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
      .eq("branch_id", branch.id)
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name");
    setSites((data as WorkSite[]) || []);
    setSitesLoading(false);
  }, [branch.id]);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  const handleAddSite = async () => {
    const name = newSiteName.trim();
    const address = newSiteAddress.trim();
    if (!name) { toast("Required", "Please enter a site name", "error"); return; }
    if (!address) { toast("Required", "Please enter the site location or use current location", "error"); return; }
    if (savingSite) return;
    setSavingSite(true);
    const isFirst = sites.length === 0;
    const { error } = await supabase.from("work_locations").insert({
      branch_id: branch.id,
      name,
      description: address,
      is_default: isFirst,
    });
    setSavingSite(false);
    if (error) {
      console.error("Failed to add work site:", error);
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
    const { error: err1 } = await supabase.from("work_locations").update({ is_default: false }).eq("branch_id", branch.id);
    const { error: err2 } = await supabase.from("work_locations").update({ is_default: true }).eq("id", site.id);
    if (err1 || err2) {
      console.error("Failed to set default site:", err1 || err2);
      toast("Error", (err1 || err2)?.message || "Could not set default site", "error");
      return;
    }
    toast("Updated", `"${site.name}" is now the default work site`, "success");
    fetchSites();
  };

  const handleSaveEdit = async (site: WorkSite) => {
    const name = editingSiteName.trim();
    const address = editingSiteAddress.trim();
    if (!name) { toast("Required", "Please enter a site name", "error"); return; }
    if (!address) { toast("Required", "Please enter the site location", "error"); return; }
    if (savingSite) return;
    setSavingSite(true);
    const { error } = await supabase.from("work_locations").update({
      name,
      description: address,
    }).eq("id", site.id);
    setSavingSite(false);
    if (error) {
      console.error("Failed to update work site:", error);
      toast("Error", error.message || "Could not update site", "error");
      return;
    }
    setEditingSiteId(null);
    fetchSites();
  };

  const handleDeleteSite = async (site: WorkSite) => {
    if (!confirm(`Remove "${site.name}" from this branch?`)) return;
    const { error } = await supabase
      .from("work_locations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", site.id);
    if (error) {
      console.error("Failed to remove work site:", error);
      toast("Error", error.message || "Could not remove site", "error");
      return;
    }
    toast("Removed", `"${site.name}" removed`, "success");
    fetchSites();
  };

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white border-l border-gray-100 overflow-y-auto z-40 flex flex-col shadow-2xl">
      {/* Panel Header */}
      <div className="bg-gradient-to-br from-[#253C7D] to-[#29ABE2] p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 capitalize">
              {branch.status}
            </span>
            <h2 className="text-lg font-bold mt-2 leading-tight">{branch.name}</h2>
            <p className="text-white/70 text-[13px] mt-1 flex items-center gap-1.5">
              <i className="ri-map-pin-line" />
              {branch.location}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManageThisBranch && (
              <button
                onClick={() => onOpenEditModal(branch)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                title="Edit branch"
              >
                <i className="ri-edit-line text-white text-sm" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onDeleteBranch(branch)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-red-500/80 transition-colors cursor-pointer"
                title="Delete branch"
              >
                <i className="ri-delete-bin-line text-white text-sm" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-white" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-xl font-bold">{branch.employee_count}</p>
            <p className="text-[10px] text-white/70 mt-0.5">Employees</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-xl font-bold">{Object.keys(deptGroups).length}</p>
            <p className="text-[10px] text-white/70 mt-0.5">Departments</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-[13px] font-bold leading-tight">
              {new Date(branch.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">Est.</p>
          </div>
        </div>
      </div>

      {/* Branch Info */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Branch Info</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#253C7D]/10">
              <i className="ri-user-star-line text-[#253C7D] text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Branch Manager</p>
              <p className="text-[13px] font-semibold text-gray-800">{branch.manager_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50">
              <i className="ri-map-pin-2-line text-amber-600 text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Location</p>
              <p className="text-[13px] font-semibold text-gray-800">{branch.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50">
              <i className="ri-checkbox-circle-line text-violet-600 text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Status</p>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[branch.status] || ""}`}>
                {branch.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-50">
              <i className="ri-fingerprint-line text-sky-600 text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Check-In Geofence</p>
              {branch.latitude != null && branch.longitude != null ? (
                <p className="text-[13px] font-semibold text-gray-800">
                  {branch.geofence_radius_m || 100}m radius
                  <span className="text-[11px] font-normal text-gray-400 ml-1">
                    ({branch.latitude.toFixed(5)}, {branch.longitude.toFixed(5)})
                  </span>
                </p>
              ) : (
                <p className="text-[13px] font-semibold text-gray-400">Not set — check-in allowed from anywhere</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50">
              <i className="ri-time-line text-emerald-600 text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Work Schedule</p>
              {branch.work_start_time || branch.work_end_time ? (
                <p className="text-[13px] font-semibold text-gray-800">
                  {branch.work_start_time
                    ? new Date(`2000-01-01T${branch.work_start_time}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : "Company default"}
                  {" – "}
                  {branch.work_end_time
                    ? new Date(`2000-01-01T${branch.work_end_time}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : "no end time set"}
                </p>
              ) : (
                <p className="text-[13px] font-semibold text-gray-400">Using company default start time, no early-leave check</p>
              )}
            </div>
          </div>
        </div>
        {canManageThisBranch && (
          <button
            onClick={() => onToggleStatus(branch)}
            className={`w-full mt-4 py-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
              branch.status === "active"
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <i className={branch.status === "active" ? "ri-close-circle-line mr-1" : "ri-checkbox-circle-line mr-1"} />
            {branch.status === "active" ? "Deactivate Branch" : "Reactivate Branch"}
          </button>
        )}
      </div>

      {/* ── Work Sites Section ──────────────────────────────────────────── */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <i className="ri-building-2-line" /> Work Sites
            {sites.length > 0 && (
              <span className="bg-[#253C7D]/10 text-[#253C7D] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {sites.length}
              </span>
            )}
          </h3>
          {canManageThisBranch && !addingMode && (
            <button
              onClick={() => setAddingMode(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#253C7D] hover:bg-[#253C7D]/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-add-line" /> Add Site
            </button>
          )}
        </div>

        {sitesLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {sites.length === 0 && !addingMode && (
              <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <i className="ri-building-2-line text-2xl text-gray-300" />
                <p className="text-[12px] text-gray-400 mt-1">No work sites yet</p>
                {canManageThisBranch && (
                  <button
                    onClick={() => setAddingMode(true)}
                    className="mt-2 text-[11px] font-semibold text-[#253C7D] hover:underline cursor-pointer"
                  >
                    + Add first site
                  </button>
                )}
              </div>
            )}

            {sites.map((site) => (
              <div
                key={site.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                  site.is_default
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  site.is_default ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"
                }`}>
                  <i className="ri-building-2-line text-xs" />
                </div>

                {editingSiteId === site.id ? (
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      autoFocus
                      value={editingSiteName}
                      onChange={(e) => setEditingSiteName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(site);
                        if (e.key === "Escape") setEditingSiteId(null);
                      }}
                      placeholder="Site name"
                      className="text-[12px] font-semibold bg-white border border-[#253C7D] rounded-lg px-2 py-1 outline-none w-full"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        value={editingSiteAddress}
                        onChange={(e) => setEditingSiteAddress(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(site);
                          if (e.key === "Escape") setEditingSiteId(null);
                        }}
                        placeholder="Location / address *"
                        className="flex-1 text-[11px] bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#253C7D] w-full"
                      />
                      <button
                        type="button"
                        onClick={() => handleUseCurrentLocation(setEditingSiteAddress, setLocatingEdit)}
                        disabled={locatingEdit}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-sky-100 text-sky-600 hover:bg-sky-200 disabled:opacity-60 cursor-pointer shrink-0"
                        title="Use my current location"
                      >
                        {locatingEdit
                          ? <div className="w-3 h-3 border border-sky-600 border-t-transparent rounded-full animate-spin" />
                          : <i className="ri-map-pin-user-line text-xs" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-bold truncate ${site.is_default ? "text-emerald-800" : "text-gray-800"}`}>
                      {site.name}
                    </p>
                    {site.description && (
                      <p className={`text-[10px] truncate mt-0.5 flex items-center gap-1 ${
                        site.is_default ? "text-emerald-600/80" : "text-gray-400"
                      }`}>
                        <i className="ri-map-pin-line shrink-0" />{site.description}
                      </p>
                    )}
                    {site.is_default && (
                      <p className="text-[10px] text-emerald-600 font-medium">Default site</p>
                    )}
                  </div>
                )}

                {canManageThisBranch && (
                  <div className="flex items-center gap-1 shrink-0">
                    {editingSiteId === site.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(site)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                          title="Save"
                        >
                          <i className="ri-check-line text-xs" />
                        </button>
                        <button
                          onClick={() => setEditingSiteId(null)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                          title="Cancel"
                        >
                          <i className="ri-close-line text-xs" />
                        </button>
                      </>
                    ) : (
                      <>
                        {!site.is_default && (
                          <button
                            onClick={() => handleSetDefault(site)}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600 cursor-pointer"
                            title="Set as default site"
                          >
                            <i className="ri-star-line text-xs" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingSiteId(site.id);
                            setEditingSiteName(site.name);
                            setEditingSiteAddress(site.description || "");
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600 cursor-pointer"
                          title="Edit site"
                        >
                          <i className="ri-edit-line text-xs" />
                        </button>
                        <button
                          onClick={() => handleDeleteSite(site)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-gray-400 hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
                          title="Remove site"
                        >
                          <i className="ri-delete-bin-line text-xs" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Inline add form */}
            {addingMode && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl border border-dashed border-[#253C7D]/40 bg-[#253C7D]/5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#253C7D]/10 text-[#253C7D] mt-0.5">
                  <i className="ri-building-2-line text-xs" />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <input
                    autoFocus
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSite();
                      if (e.key === "Escape") { setAddingMode(false); setNewSiteName(""); setNewSiteAddress(""); }
                    }}
                    placeholder="Site name * (e.g. Kandal Factory)"
                    className="text-[12px] font-semibold bg-white border border-[#253C7D]/30 rounded-lg px-2 py-1.5 outline-none focus:border-[#253C7D] placeholder:font-normal placeholder:text-gray-400"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      value={newSiteAddress}
                      onChange={(e) => setNewSiteAddress(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSite();
                        if (e.key === "Escape") { setAddingMode(false); setNewSiteName(""); setNewSiteAddress(""); }
                      }}
                      placeholder="Location / address *"
                      className="flex-1 text-[11px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#253C7D] placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleUseCurrentLocation(setNewSiteAddress, setLocatingNew)}
                      disabled={locatingNew}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-100 text-sky-600 hover:bg-sky-200 disabled:opacity-60 cursor-pointer shrink-0"
                      title="Use my current location"
                    >
                      {locatingNew
                        ? <div className="w-3 h-3 border border-sky-600 border-t-transparent rounded-full animate-spin" />
                        : <i className="ri-map-pin-user-line text-sm" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={handleAddSite}
                    disabled={!newSiteName.trim() || savingSite}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-[#253C7D] text-white hover:bg-[#1e3166] disabled:opacity-40 cursor-pointer"
                    title="Add site"
                  >
                    {savingSite
                      ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      : <i className="ri-check-line text-xs" />
                    }
                  </button>
                  <button
                    onClick={() => { setAddingMode(false); setNewSiteName(""); setNewSiteAddress(""); }}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                    title="Cancel"
                  >
                    <i className="ri-close-line text-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Department Breakdown */}
      {Object.keys(deptGroups).length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Departments</h3>
          <div className="space-y-2">
            {Object.entries(deptGroups).map(([dept, emps], i) => (
              <div key={dept} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${deptColors[i % deptColors.length]}`}>
                    {dept}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#253C7D] rounded-full"
                      style={{ width: `${Math.min((emps.length / employees.length) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-gray-600 font-medium w-6 text-right">{emps.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="p-5 flex-1">
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Employees {employees.length > 0 && `(${employees.length})`}
        </h3>
        {empLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-10">
            <i className="ri-user-3-line text-3xl text-gray-200" />
            <p className="text-[13px] text-gray-400 mt-2">No employees assigned to this branch</p>
          </div>
        ) : (
          <div className="space-y-2">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] font-bold text-xs shrink-0">
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {emp.role} &middot; {emp.department}
                  </p>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                  emp.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {emp.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
