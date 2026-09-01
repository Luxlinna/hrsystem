import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { BranchInfo } from "./branchTypes";

export function useBranchData(userEmail?: string | null) {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBranchId, setUserBranchId] = useState<string | null>(null);
  const [userBranchName, setUserBranchName] = useState<string | null>(null);
  const [userSiteId, setUserSiteId] = useState<string | null>(null);
  const [userSiteName, setUserSiteName] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    const { data: branchesData } = await supabase
      .from("branches")
      .select("id, name, location, status")
      .is("deleted_at", null)
      .order("name");

    const { data: locationsData } = await supabase
      .from("work_locations")
      .select("id, name, branch_id, description")
      .is("deleted_at", null);

    if (branchesData) {
      const sitesList = (locationsData || []).map((loc) => ({
        id: `site:${loc.id}`,
        name: loc.name,
        location: loc.description,
        status: "active",
        branch_id: loc.branch_id,
        is_site: true as const,
      }));

      const sortedBranches = [...branchesData].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );

      const combined: BranchInfo[] = [...sortedBranches, ...sitesList];
      setBranches(combined);
    }
  }, []);

  const fetchUserBranch = useCallback(async () => {
    if (!userEmail) {
      setUserBranchId(null);
      setUserBranchName(null);
      setUserSiteId(null);
      setUserSiteName(null);
      setLoading(false);
      return;
    }
    const cleanEmail = userEmail.trim().toLowerCase();
    const { data } = await supabase
      .from("employees")
      .select(`
        id, branch_id, default_work_location_id,
        branches(id, name),
        work_locations:default_work_location_id(id, name)
      `)
      .ilike("email", cleanEmail)
      .is("deleted_at", null)
      .maybeSingle();

    if (data?.branch_id) {
      setUserBranchId(data.branch_id);
      const bName = (data.branches as any)?.name || null;
      const sName = (data.work_locations as any)?.name || null;
      setUserBranchName(bName);
      setUserSiteName(sName);
      setUserSiteId(data.default_work_location_id || null);
    } else {
      setUserBranchId(null);
      setUserBranchName(null);
      setUserSiteId(null);
      setUserSiteName(null);
    }
    setLoading(false);
  }, [userEmail]);

  useEffect(() => {
    fetchBranches();
    fetchUserBranch();
  }, [fetchBranches, fetchUserBranch]);

  return {
    branches,
    loading,
    userBranchId,
    userBranchName,
    userSiteId,
    userSiteName,
    fetchBranches,
  };
}
