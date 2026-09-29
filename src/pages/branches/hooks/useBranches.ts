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
  const { isSuperAdmin, isBranchAdmin, userBranchId, effectiveBranchId, setSelectedBranchId } = useBranchScope();
  const canCreateBranch = isSuperAdmin || isAdmin;
  const canManage = isSuperAdmin || isAdmin || isBranchAdmin;

  const { branches, loading, loadBranches } = useBranchesData();

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Scoped branches: users strictly see their own BU only
  const allowedBranches = useMemo(() => {
    // If the user has an assigned BU, they strictly can only see their own BU
    if (userBranchId) {
      const myBranch = branches.filter((b) => b.id === userBranchId);
      if (myBranch.length > 0) return myBranch;
    }

    // Only global Super Admin with no specific branch restriction gets all branches
    const isGlobalSuper = (roleName.toLowerCase() === "super admin" || isSuperAdmin) && !userBranchId;
    if (isGlobalSuper && branches.length > 0) {
      return branches;
    }

    // If workspace has an active BU selected
    if (effectiveBranchId && effectiveBranchId !== "all") {
      const active = branches.filter((b) => b.id === effectiveBranchId);
      if (active.length > 0) return active;
    }

    return branches.slice(0, 1);
  }, [branches, userBranchId, roleName, isSuperAdmin, effectiveBranchId]);

  // Currently active BU displayed on the Company Profile page
  const activeBu = useMemo(() => {
    if (userBranchId) {
      const myBranch = branches.find((b) => b.id === userBranchId);
      if (myBranch) return myBranch;
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
      .select("id, first_name, last_name, role, department, status, email, biometric_user_id, default_work_location_id, work_locations:default_work_location_id(id, name)")
      .eq("branch_id", branch.id)
      .is("deleted_at", null)
      .order("department");
    if (requestId !== detailRequestId.current) return;
    const emps = (data || []).map((x: any) => ({
      ...x,
      work_locations: Array.isArray(x.work_locations) ? x.work_locations[0] : x.work_locations || null,
    })) as Employee[];
    setBranchEmployees(emps);
    setSelectedBranch((prev) => (prev ? { ...prev, employee_count: emps.length } : null));
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
      late_grace_minutes: branch.late_grace_minutes != null ? String(branch.late_grace_minutes) : "15",
      early_leave_grace_minutes: branch.early_leave_grace_minutes != null ? String(branch.early_leave_grace_minutes) : "15",
      morning_check_in_start: branch.morning_check_in_start ? branch.morning_check_in_start.slice(0, 5) : "06:00",
      morning_check_in_end: branch.morning_check_in_end ? branch.morning_check_in_end.slice(0, 5) : "09:00",
      morning_check_out_start: branch.morning_check_out_start ? branch.morning_check_out_start.slice(0, 5) : "10:00",
      morning_check_out_end: branch.morning_check_out_end ? branch.morning_check_out_end.slice(0, 5) : "12:00",
      afternoon_check_in_start: branch.afternoon_check_in_start ? branch.afternoon_check_in_start.slice(0, 5) : "12:00",
      afternoon_check_in_end: branch.afternoon_check_in_end ? branch.afternoon_check_in_end.slice(0, 5) : "14:00",
      afternoon_check_out_start: branch.afternoon_check_out_start ? branch.afternoon_check_out_start.slice(0, 5) : "16:00",
      afternoon_check_out_end: branch.afternoon_check_out_end ? branch.afternoon_check_out_end.slice(0, 5) : "18:00",

      // 1. Company Info
      logo_url: branch.logo_url || "",
      company_name: branch.company_name || branch.name || "",
      registration_no: branch.registration_no || "",
      vat_no: branch.vat_no || "",
      industry: branch.industry || "",
      domain: branch.domain || "",
      currency: branch.currency || "USD",
      rounding_digit: branch.rounding_digit != null ? String(branch.rounding_digit) : "2",

      // 2. Physical Address Info
      physical_address: branch.physical_address || branch.location || "",
      physical_city: branch.physical_city || "Phnom Penh",
      physical_province: branch.physical_province || "",
      physical_postal_code: branch.physical_postal_code || "",
      physical_country: branch.physical_country || "Cambodia",

      // 3. Mailing Address Info
      mailing_address: branch.mailing_address || branch.physical_address || branch.location || "",
      mailing_city: branch.mailing_city || "Phnom Penh",
      mailing_province: branch.mailing_province || "",
      mailing_postal_code: branch.mailing_postal_code || "",
      mailing_country: branch.mailing_country || "Cambodia",

      // 4. Contact Info
      phone_number: branch.phone_number || "",
      email: branch.email || "",
      website: branch.website || "",

      // 5. Timezone Info
      time_zone: branch.time_zone || "SE Asia Standard Time",

      // 6. Legal Info
      legal_tax_number: branch.legal_tax_number || "",
      legal_name: branch.legal_name || "",
      legal_business_activity: branch.legal_business_activity || "",
      legal_address: branch.legal_address || "",
      legal_phone_number: branch.legal_phone_number || "",
      legal_email: branch.legal_email || "",
    });
    location.setAddressLookup(branch.physical_address || branch.location || "");
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
    setSelectedBranch,
    activeBu,
    allowedBranches,
    setSelectedBranchId,
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
