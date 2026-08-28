import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import { logActivity } from "@/lib/audit";
import { toast } from "@/components/Toast";
import { getCurrentPosition } from "@/lib/geo";
import { geocodeAddress, loadGoogleMaps, reverseGeocode } from "@/lib/geocode";
import type { Branch, Employee, BranchFormState } from "../types";
import { INITIAL_BRANCH_FORM } from "../constants";

export function useBranches() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, userBranchId } = useBranchScope();
  const canCreateBranch = isSuperAdmin || isAdmin;
  const canManage = isSuperAdmin || isAdmin || isBranchAdmin;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchEmployees, setBranchEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [addressLookup, setAddressLookup] = useState("");
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const placesAutocompleteRef = useRef<any>(null);
  const [form, setForm] = useState<BranchFormState>(INITIAL_BRANCH_FORM);
  const detailRequestId = useRef(0);

  const loadBranches = useCallback(async () => {
    const { data } = await supabase
      .from("branches")
      .select(
        "id, name, location, manager_name, employee_count, status, created_at, latitude, longitude, geofence_radius_m, work_start_time, work_end_time, deleted_at, deleted_by"
      )
      .is("deleted_at", null)
      .order("employee_count", { ascending: false });
    setBranches(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBranches();
    const channel = supabase
      .channel("branches-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, () => loadBranches())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBranches]);

  useEffect(() => {
    if (!showAddModal || !addressInputRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !addressInputRef.current || placesAutocompleteRef.current) return;
        const autocomplete = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
          types: ["geocode", "establishment"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const loc = place?.geometry?.location;
          if (!loc) {
            toast("Error", "That place doesn't include coordinates. Try a more specific address.", "error");
            return;
          }
          const formattedAddress = place.formatted_address || place.name || addressInputRef.current?.value || "";
          setAddressLookup(formattedAddress);
          setForm((f) => ({
            ...f,
            location: f.location || formattedAddress,
            latitude: loc.lat().toFixed(6),
            longitude: loc.lng().toFixed(6),
          }));
          toast("Location selected", "Coordinates added to the branch form.", "success");
        });
        placesAutocompleteRef.current = autocomplete;
      })
      .catch(() => {
        // Manual lookup will surface a user-facing configuration/load error.
      });

    return () => {
      cancelled = true;
      if (placesAutocompleteRef.current) {
        (window as any).google?.maps?.event?.clearInstanceListeners(placesAutocompleteRef.current);
        placesAutocompleteRef.current = null;
      }
    };
  }, [showAddModal]);

  const openDetail = useCallback(async (branch: Branch) => {
    setSelectedBranch(branch);
    setEmpLoading(true);
    const requestId = ++detailRequestId.current;
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, status, email")
      .eq("branch_id", branch.id)
      .order("department");
    if (requestId !== detailRequestId.current) return;
    setBranchEmployees(data || []);
    setEmpLoading(false);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedBranch(null);
    setBranchEmployees([]);
  }, []);

  const handleAddBranch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name || !form.location || !form.manager_name) return;
      if (!editingBranchId && !canCreateBranch) {
        toast("Access Denied", "Only Super Admin can create new branches.", "error");
        return;
      }
      if (editingBranchId && isBranchAdmin && userBranchId && editingBranchId !== userBranchId) {
        toast("Access Denied", "You can only manage your own branch.", "error");
        return;
      }
      setSubmitting(true);
      const latitude = form.latitude.trim() ? Number(form.latitude) : null;
      const longitude = form.longitude.trim() ? Number(form.longitude) : null;
      if (
        (latitude != null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
        (longitude != null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
      ) {
        setSubmitting(false);
        toast("Error", "Enter valid latitude and longitude values before saving.", "error");
        return;
      }
      const geofence_radius_m = form.geofence_radius_m.trim() ? Number(form.geofence_radius_m) : 100;
      const work_start_time = form.work_start_time.trim() || null;
      const work_end_time = form.work_end_time.trim() || null;
      let entityId: string | null = editingBranchId;

      if (editingBranchId) {
        const { error } = await supabase
          .from("branches")
          .update({
            name: form.name,
            location: form.location,
            manager_name: form.manager_name,
            status: form.status,
            latitude,
            longitude,
            geofence_radius_m,
            work_start_time,
            work_end_time,
          })
          .eq("id", editingBranchId);
        if (error) {
          setSubmitting(false);
          toast("Error", "Failed to save branch", "error");
          return;
        }
        if (selectedBranch?.id === editingBranchId) {
          setSelectedBranch({
            ...selectedBranch,
            name: form.name,
            location: form.location,
            manager_name: form.manager_name,
            status: form.status,
            latitude,
            longitude,
            geofence_radius_m,
            work_start_time,
            work_end_time,
          });
        }
      } else {
        const { data, error } = await supabase
          .from("branches")
          .insert({
            name: form.name,
            location: form.location,
            manager_name: form.manager_name,
            status: form.status,
            employee_count: 0,
            latitude,
            longitude,
            geofence_radius_m,
            work_start_time,
            work_end_time,
          })
          .select()
          .single();
        if (error) {
          setSubmitting(false);
          toast("Error", "Failed to create branch", "error");
          return;
        }
        entityId = data?.id ?? null;
      }

      logActivity({
        module: "branches",
        action: editingBranchId ? "updated" : "created",
        entityType: "branch",
        entityId,
        actorName,
        actorRole: role?.name || "Unknown",
        description: editingBranchId
          ? `Branch "${form.name}" details updated`
          : `New branch "${form.name}" created`,
      });
      setForm(INITIAL_BRANCH_FORM);
      setAddressLookup("");
      setEditingBranchId(null);
      setShowAddModal(false);
      setSubmitting(false);
      loadBranches();
    },
    [form, canCreateBranch, isBranchAdmin, userBranchId, editingBranchId, selectedBranch, actorName, role?.name, loadBranches]
  );

  const openEditModal = useCallback(
    (branch: Branch) => {
      if (isBranchAdmin && userBranchId && branch.id !== userBranchId) {
        toast("Access Denied", "You can only manage your own assigned branch.", "error");
        return;
      }
      if (!canManage) return;
      setForm({
        name: branch.name,
        location: branch.location,
        manager_name: branch.manager_name,
        status: branch.status,
        latitude: branch.latitude != null ? String(branch.latitude) : "",
        longitude: branch.longitude != null ? String(branch.longitude) : "",
        geofence_radius_m: branch.geofence_radius_m != null ? String(branch.geofence_radius_m) : "100",
        work_start_time: branch.work_start_time ? branch.work_start_time.slice(0, 5) : "",
        work_end_time: branch.work_end_time ? branch.work_end_time.slice(0, 5) : "",
      });
      setAddressLookup(branch.location || "");
      setEditingBranchId(branch.id);
      setShowAddModal(true);
    },
    [canManage, isBranchAdmin, userBranchId]
  );

  const openAddModal = useCallback(() => {
    if (!canCreateBranch) {
      toast("Access Denied", "Only Super Admin can create new branches.", "error");
      return;
    }
    setForm(INITIAL_BRANCH_FORM);
    setAddressLookup("");
    setEditingBranchId(null);
    setShowAddModal(true);
  }, [canCreateBranch]);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setEditingBranchId(null);
  }, []);

  const useCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      let location = "";
      try {
        const result = await reverseGeocode(latitude, longitude);
        location = result.formattedAddress;
        setAddressLookup(result.formattedAddress);
      } catch {
        setAddressLookup("");
      }
      setForm((f) => ({
        ...f,
        location: location || f.location,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
      }));
      toast("Location captured", `Accurate to about ±${Math.round(pos.coords.accuracy)}m`, "success");
    } catch (err: any) {
      toast(
        "Error",
        err?.code === 1
          ? "Location access was denied for this site — check your browser's site permissions."
          : "Couldn't get your location. On a laptop/desktop this is usually the OS-level Location Services toggle, not the browser — check your system settings and try again.",
        "error"
      );
    }
    setLocating(false);
  }, []);

  const handleGeocodeAddress = useCallback(async () => {
    if (!addressLookup.trim()) return;
    setGeocoding(true);
    try {
      const result = await geocodeAddress(addressLookup.trim());
      setAddressLookup(result.formattedAddress);
      setForm((f) => ({
        ...f,
        location: f.location || result.formattedAddress,
        latitude: result.lat.toFixed(6),
        longitude: result.lng.toFixed(6),
      }));
      toast(
        result.precise ? "Exact match found" : "Approximate match — please verify",
        result.formattedAddress,
        result.precise ? "success" : "warning"
      );
    } catch (err: any) {
      toast("Error", err?.message || "Couldn't look up that address.", "error");
    }
    setGeocoding(false);
  }, [addressLookup]);

  const toggleBranchStatus = useCallback(
    async (branch: Branch) => {
      if (!canManage) return;
      const newStatus = branch.status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("branches").update({ status: newStatus }).eq("id", branch.id);
      if (error) {
        toast("Error", "Failed to update branch status", "error");
        return;
      }
      setSelectedBranch((prev) => (prev && prev.id === branch.id ? { ...prev, status: newStatus } : prev));
      logActivity({
        module: "branches",
        action: "updated",
        entityType: "branch",
        entityId: branch.id,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `Branch "${branch.name}" ${newStatus === "active" ? "reactivated" : "deactivated"}`,
      });
      loadBranches();
    },
    [canManage, actorName, role?.name, loadBranches]
  );

  const handleDeleteBranch = useCallback(
    async (branch: Branch) => {
      if (!canCreateBranch) {
        toast("Access Denied", "Only Super Admin can delete branches.", "error");
        return;
      }
      if (!confirm(`Move "${branch.name}" to the Recycle Bin? The branch can be restored later.`)) return;
      const { error } = await supabase
        .from("branches")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", branch.id);
      if (error) {
        toast("Error", "Failed to delete branch", "error");
        return;
      }
      logActivity({
        module: "branches",
        action: "deleted",
        entityType: "branch",
        entityId: branch.id,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `Branch "${branch.name}" moved to the Recycle Bin`,
      });
      toast("Branch deleted", `"${branch.name}" moved to the Recycle Bin.`, "success");
      setSelectedBranch(null);
      setBranchEmployees([]);
      loadBranches();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAdmin, actorName, role?.name, loadBranches]
  );

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.manager_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [branches, searchTerm, filterStatus]);

  const totalEmployees = useMemo(
    () => branches.reduce((s, b) => s + (b.employee_count || 0), 0),
    [branches]
  );
  const activeBranches = useMemo(
    () => branches.filter((b) => b.status === "active").length,
    [branches]
  );

  const deptGroups = useMemo(() => {
    return branchEmployees.reduce((acc: Record<string, Employee[]>, emp) => {
      const d = emp.department || "Other";
      if (!acc[d]) acc[d] = [];
      acc[d].push(emp);
      return acc;
    }, {});
  }, [branchEmployees]);

  return {
    canManage,
    isAdmin,
    branches,
    loading,
    selectedBranch,
    branchEmployees,
    empLoading,
    showAddModal,
    editingBranchId,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    submitting,
    locating,
    geocoding,
    addressLookup,
    setAddressLookup,
    addressInputRef,
    form,
    setForm,
    filtered,
    totalEmployees,
    activeBranches,
    deptGroups,
    openDetail,
    closeDetail,
    openAddModal,
    openEditModal,
    closeModal,
    handleAddBranch,
    useCurrentLocation,
    handleGeocodeAddress,
    toggleBranchStatus,
    handleDeleteBranch,
  };
}
