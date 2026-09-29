import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import type { Branch, Employee, BranchFormState } from "../types";
import { INITIAL_BRANCH_FORM } from "../constants";
import { useBranchesData } from "./useBranchesData";
import { useBranchLocation } from "./useBranchLocation";
import { useBranchMutations } from "./useBranchMutations";
import { branchToFormState } from "../utils/branchFormMapper";

export function useBranches() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const roleName = role?.name || "Staff";
  const { isSuperAdmin, isBranchAdmin, userBranchId, effectiveBranchId, setSelectedBranchId } = useBranchScope();
  const canCreateBranch = isSuperAdmin || isAdmin;
  const canManage = isSuperAdmin || isAdmin || isBranchAdmin;

  const { branches, loading, loadBranches } = useBranchesData();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Scoped branches: users strictly see their own BU only
  const allowedBranches = useMemo(() => {
    if (userBranchId) {
      const my = branches.filter((b) => b.id === userBranchId);
      if (my.length > 0) return my;
    }
    const isGlobalSuper = (roleName.toLowerCase() === "super admin" || isSuperAdmin) && !userBranchId;
    if (isGlobalSuper && branches.length > 0) return branches;

    if (effectiveBranchId && effectiveBranchId !== "all") {
      const active = branches.filter((b) => b.id === effectiveBranchId);
      if (active.length > 0) return active;
    }
    return branches.slice(0, 1);
  }, [branches, userBranchId, roleName, isSuperAdmin, effectiveBranchId]);

  // Currently active BU displayed on the Company Profile page
  const activeBu = useMemo(() => {
    if (userBranchId) {
      const my = branches.find((b) => b.id === userBranchId);
      if (my) return my;
    }
    if (selectedBranch && allowedBranches.some((b) => b.id === selectedBranch.id)) {
      return selectedBranch;
    }
    if (effectiveBranchId && effectiveBranchId !== "all") {
      const found = branches.find((b) => b.id === effectiveBranchId);
      if (found) return found;
    }
    return allowedBranches[0] || branches[0] || null;
  }, [userBranchId, branches, selectedBranch, allowedBranches, effectiveBranchId]);

  const [branchEmployees, setBranchEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState<BranchFormState>(INITIAL_BRANCH_FORM);
  const [modalInitialTab, setModalInitialTab] = useState<"profile" | "schedule">("profile");
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

  const loadBranchEmployees = useCallback(async (branchId: string) => {
    setEmpLoading(true);
    const requestId = ++detailRequestId.current;
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, status, email, biometric_user_id, default_work_location_id, work_locations:default_work_location_id(id, name)")
      .eq("branch_id", branchId)
      .is("deleted_at", null)
      .order("department");
    if (requestId !== detailRequestId.current) return;
    const emps = (data || []).map((x: any) => ({
      ...x,
      work_locations: Array.isArray(x.work_locations) ? x.work_locations[0] : x.work_locations || null,
    })) as Employee[];
    setBranchEmployees(emps);
    setEmpLoading(false);
  }, []);

  // Automatically fetch staff whenever the active BU changes
  useEffect(() => {
    if (activeBu?.id) {
      loadBranchEmployees(activeBu.id);
    } else {
      setBranchEmployees([]);
    }
  }, [activeBu?.id, loadBranchEmployees]);

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const q = searchTerm.toLowerCase();
      const match = b.name.toLowerCase().includes(q) || b.location.toLowerCase().includes(q) || b.manager_name.toLowerCase().includes(q);
      return match && (filterStatus === "all" || b.status === filterStatus);
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

  return {
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    activeBu,
    allowedBranches,
    setSelectedBranchId,
    branchEmployees,
    empLoading,
    showAddModal,
    setShowAddModal,
    modalInitialTab,
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
    totalEmployees: branches.reduce((sum, b) => sum + (b.employee_count || 0), 0),
    activeBranches: branches.filter((b) => b.status === "active").length,
    openDetail: (b: Branch) => { setSelectedBranch(b); loadBranchEmployees(b.id); },
    closeDetail: () => { setSelectedBranch(null); setBranchEmployees([]); },
    openEditModal: (b: Branch, tab: "profile" | "schedule" = "profile") => {
      setEditingBranchId(b.id);
      setModalInitialTab(tab);
      setForm(branchToFormState(b));
      location.setAddressLookup(b.physical_address || b.location || "");
      setShowAddModal(true);
    },
    openAddModal: () => {
      setEditingBranchId(null);
      setForm(INITIAL_BRANCH_FORM);
      setModalInitialTab("profile");
      location.setAddressLookup("");
      setShowAddModal(true);
    },
    closeModal: () => { setShowAddModal(false); setEditingBranchId(null); },
    handleAddBranch: (e: React.FormEvent) => { e.preventDefault(); return mutations.handleAddBranch(form); },
    useCurrentLocation: location.useCurrentLocation,
    handleGeocodeAddress: location.handleGeocodeAddress,
    toggleBranchStatus: mutations.toggleBranchStatus,
    handleDeleteBranch: mutations.handleDeleteBranch,
  };
}
