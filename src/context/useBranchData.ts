import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { BranchInfo } from "./branchTypes";

export function useBranchData(userEmail?: string | null) {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBranchId, setUserBranchId] = useState<string | null>(null);
  const [userBranchName, setUserBranchName] = useState<string | null>(null);

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
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("employees")
      .select("id, branch_id, branches(id, name)")
      .eq("email", userEmail)
      .maybeSingle();

    if (data?.branch_id) {
      setUserBranchId(data.branch_id);
      const bName = (data.branches as any)?.name || null;
      setUserBranchName(bName);
    } else {
      setUserBranchId(null);
      setUserBranchName(null);
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
    fetchBranches,
  };
}
