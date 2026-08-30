import { useState, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import type { Branch, Employee, BranchFormState } from "../types";
import { INITIAL_BRANCH_FORM } from "../constants";
import { useBranchesData } from "./useBranchesData";
import { useBranchLocation } from "./useBranchLocation";
import { useBranchMutations } from "./useBranchMutations";

export function useBranches() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const roleName = role?.name || "Staff";
  const { isSuperAdmin, isBranchAdmin, userBranchId } = useBranchScope();
  const canCreateBranch = isSuperAdmin || isAdmin;
  const canManage = isSuperAdmin || isAdmin || isBranchAdmin;

  const { branches, loading, loadBranches } = useBranchesData();

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchEmployees, setBranchEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState<BranchFormState>(INITIAL_BRANCH_FORM);
  const detailRequestId = useRef(0);

  const location = useBranchLocation({ showAddModal, form, setForm });

  const mutations = useBranchMutations({
    canCreateBranch,
    isBranchAdmin,
    userBranchId,
    actorName,
    roleName,
    editingBranchId,
    loadBranches,
    setShowAddModal,
    setEditingBranchId,
    selectedBranch,
    setSelectedBranch,
  });

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

  const openEditModal = useCallback((branch: Branch) => {
    setEditingBranchId(branch.id);
    setForm({
      name: branch.name,
      location: branch.location,
      manager_name: branch.manager_name,
      status: branch.status,
      latitude: branch.latitude != null ? String(branch.latitude) : "",
      longitude: branch.longitude != null ? String(branch.longitude) : "",
      geofence_radius_m: branch.geofence_radius_m != null ? String(branch.geofence_radius_m) : "100",
      work_start_time: branch.work_start_time || "",
      work_end_time: branch.work_end_time || "",
    });
    location.setAddressLookup(branch.location || "");
    setShowAddModal(true);
  }, [location]);

  const openAddModal = useCallback(() => {
    setEditingBranchId(null);
    setForm(INITIAL_BRANCH_FORM);
    location.setAddressLookup("");
    setShowAddModal(true);
  }, [location]);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setEditingBranchId(null);
  }, []);

  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const matchesSearch =
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.manager_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || branch.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [branches, searchTerm, filterStatus]);

  const deptGroups = useMemo(() => {
    const map: Record<string, Employee[]> = {};
    branchEmployees.forEach((emp) => {
      const dept = emp.department || "Other";
      if (!map[dept]) map[dept] = [];
      map[dept].push(emp);
    });
    return map;
  }, [branchEmployees]);

  const totalEmployees = useMemo(
    () => branches.reduce((sum, b) => sum + (b.employee_count || 0), 0),
    [branches]
  );
  const activeBranches = useMemo(
    () => branches.filter((b) => b.status === "active").length,
    [branches]
  );

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    return mutations.handleAddBranch(form);
  }, [mutations, form]);

  return {
    branches,
    loading,
    selectedBranch,
    branchEmployees,
    empLoading,
    showAddModal,
    setShowAddModal,
    editingBranchId,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    submitting: mutations.submitting,
    locating: location.locating,
    geocoding: location.geocoding,
    addressLookup: location.addressLookup,
    setAddressLookup: location.setAddressLookup,
    addressInputRef: location.addressInputRef,
    form,
    setForm,
    canCreateBranch,
    canManage,
    isAdmin,
    isSuperAdmin,
    userBranchId,
    filteredBranches,
    filtered: filteredBranches,
    deptGroups,
    totalEmployees,
    activeBranches,
    openDetail,
    closeDetail,
    openEditModal,
    openAddModal,
    closeModal,
    handleAddBranch: handleFormSubmit,
    useCurrentLocation: location.useCurrentLocation,
    handleGeocodeAddress: location.handleGeocodeAddress,
    toggleBranchStatus: mutations.toggleBranchStatus,
    handleDeleteBranch: mutations.handleDeleteBranch,
  };
}
