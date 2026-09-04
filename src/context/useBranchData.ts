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
      .select("id, name, location, status, work_start_time, work_end_time, late_grace_minutes, early_leave_grace_minutes, morning_check_in_start, morning_check_in_end, morning_check_out_start, morning_check_out_end, afternoon_check_in_start, afternoon_check_in_end, afternoon_check_out_start, afternoon_check_out_end")
      .is("deleted_at", null)
      .order("name");

    const { data: locationsData } = await supabase
      .from("work_locations")
      .select("id, name, branch_id, description, is_default, work_start_time, work_end_time, break_start_time, break_end_time, late_grace_minutes, early_leave_grace_minutes, is_four_punch_enabled, morning_check_in_start, morning_check_in_end, morning_check_out_start, morning_check_out_end, afternoon_check_in_start, afternoon_check_in_end, afternoon_check_out_start, afternoon_check_out_end")
      .is("deleted_at", null)
      .order("is_default", { ascending: false });

    if (branchesData) {
      const sitesList = (locationsData || []).map((loc) => ({
        id: `site:${loc.id}`,
        name: loc.name,
        location: loc.description,
        status: "active",
        branch_id: loc.branch_id,
        is_site: true as const,
        work_start_time: loc.work_start_time,
        work_end_time: loc.work_end_time,
        break_start_time: loc.break_start_time,
        break_end_time: loc.break_end_time,
        late_grace_minutes: loc.late_grace_minutes ?? 15,
        early_leave_grace_minutes: loc.early_leave_grace_minutes ?? 15,
        morning_check_in_start: loc.morning_check_in_start,
        morning_check_in_end: loc.morning_check_in_end,
        morning_check_out_start: loc.morning_check_out_start,
        morning_check_out_end: loc.morning_check_out_end,
        afternoon_check_in_start: loc.afternoon_check_in_start,
        afternoon_check_in_end: loc.afternoon_check_in_end,
        afternoon_check_out_start: loc.afternoon_check_out_start,
        afternoon_check_out_end: loc.afternoon_check_out_end,
        is_four_punch_enabled: loc.is_four_punch_enabled ?? true,
      }));

      const sortedBranches = [...branchesData]
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        .map((b) => ({
          id: b.id,
          name: b.name,
          location: b.location,
          status: b.status,
          is_site: false as const,
          work_start_time: b.work_start_time || null,
          work_end_time: b.work_end_time || null,
          break_start_time: null,
          break_end_time: null,
          late_grace_minutes: b.late_grace_minutes ?? 15,
          early_leave_grace_minutes: b.early_leave_grace_minutes ?? 15,
          morning_check_in_start: b.morning_check_in_start,
          morning_check_in_end: b.morning_check_in_end,
          morning_check_out_start: b.morning_check_out_start,
          morning_check_out_end: b.morning_check_out_end,
          afternoon_check_in_start: b.afternoon_check_in_start,
          afternoon_check_in_end: b.afternoon_check_in_end,
          afternoon_check_out_start: b.afternoon_check_out_start,
          afternoon_check_out_end: b.afternoon_check_out_end,
          is_four_punch_enabled: false,
        }));

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
