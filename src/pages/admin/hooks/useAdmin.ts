import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import type { AdminTab } from "../types";
import { useAdminData } from "./useAdminData";
import { useAdminRoleMutations } from "./useAdminRoleMutations";
import { useAdminUserMutations } from "./useAdminUserMutations";
import { useAdminPasswordResets } from "./useAdminPasswordResets";

export function useAdmin() {
  const { user } = useAuth();
  const { isSuperAdmin, isBranchAdmin, userBranchName, selectedBranchId } = useBranchScope();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "password-resets") return "password-resets";
    if (tabParam === "users" || (!isSuperAdmin && isBranchAdmin)) return "users";
    return "roles";
  });

  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const data = useAdminData();

  const roles = useAdminRoleMutations({
    roles: data.roles,
    isSuperAdmin,
    showToast,
    loadData: data.loadData,
  });

  const users = useAdminUserMutations({
    users: data.users,
    setUsers: data.setUsers,
    roles: data.roles,
    isSuperAdmin,
    currentUserEmail: user?.email,
    showToast,
    loadData: data.loadData,
  });

  const resets = useAdminPasswordResets({
    passwordResetRequests: data.passwordResetRequests,
    showToast,
    loadData: data.loadData,
  });

  // Sync activeTab when URL query changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "password-resets") setActiveTab("password-resets");
    else if (tabParam === "users" || (!isSuperAdmin && isBranchAdmin)) setActiveTab("users");
    else if (tabParam === "roles") setActiveTab("roles");
  }, [searchParams, isSuperAdmin, isBranchAdmin]);

  // Sync filterBranch when header branch switches
  useEffect(() => {
    if (selectedBranchId) {
      setFilterBranch(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Scope branch tabs to the currently selected header branch and its sub-sites
  const scopedBranches = useMemo(() => {
    if (!data.branches || data.branches.length === 0) return [];
    if (!selectedBranchId || selectedBranchId === "all") return data.branches;

    if (typeof selectedBranchId === "string" && selectedBranchId.startsWith("site:")) {
      const siteObj = data.branches.find((b) => b && b.id === selectedBranchId);
      const parentBranchId = siteObj?.branch_id;
      if (parentBranchId) {
        return data.branches.filter((b) => b && (b.id === parentBranchId || b.branch_id === parentBranchId));
      }
      return data.branches.filter((b) => b && b.id === selectedBranchId);
    }

    const relevant = data.branches.filter((b) => b && (b.id === selectedBranchId || b.branch_id === selectedBranchId));
    return relevant.length > 0 ? relevant : data.branches;
  }, [data.branches, selectedBranchId]);

  // Realtime subscription for password reset requests
  useEffect(() => {
    const channel = supabase
      .channel("admin_password_resets")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "password_reset_requests" }, () => { data.loadData(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "password_reset_requests" }, () => { data.loadData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [data]);

  return {
    isSuperAdmin,
    userBranchName,
    activeTab,
    setActiveTab,
    filterBranch,
    setFilterBranch,
    searchQuery,
    setSearchQuery,
    toast,
    scopedBranches,
    data,
    roles,
    users,
    resets,
  };
}
