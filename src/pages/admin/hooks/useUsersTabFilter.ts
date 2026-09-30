import { useMemo } from "react";
import type { UserAssignment } from "../types";
import { isPhoneSyntheticEmail, syntheticEmailToPhone } from "@/lib/phoneUtils";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

export function useUsersTabFilter(
  users: UserAssignment[] = [],
  branches: BranchOption[] = [],
  filterBranch: string,
  searchQuery: string,
  isSuperAdmin: boolean = true
) {
  const displayedUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const bList = Array.isArray(branches) ? branches : [];

    return list.filter((u) => {
      if (!u) return false;

      if (filterBranch && filterBranch !== "all") {
        // Support comma-separated multi-select (from flyout) or single ID (from pill)
        const ids = filterBranch.split(",").map((s) => s.trim()).filter(Boolean);
        if (ids.length > 0) {
          const matched = ids.some((id) => {
            if (id.startsWith("site:")) {
              const siteId = id.substring(5);
              return (
                u.default_work_location_id === siteId ||
                u.app_roles?.work_location_id === siteId
              );
            }
            // BU match: direct id or name match
            const targetB = bList.find((b) => b && b.id === id);
            const isDirectMatch = u.branch_id === id || u.app_roles?.branch_id === id;
            const uBranchName = (u.branch_name || "").toLowerCase().trim();
            const targetBName = (targetB?.name || "").toLowerCase().trim();
            const isNameMatch = Boolean(uBranchName && targetBName && uBranchName === targetBName);
            return isDirectMatch || isNameMatch;
          });
          if (!matched) return false;
        }
      }

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (u.display_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = isPhoneSyntheticEmail(u.email) ? syntheticEmailToPhone(u.email).toLowerCase() : "";
        const role = (u.app_roles?.name || "").toLowerCase();
        const branch = (u.branch_name || "").toLowerCase();
        const site = (u.site_name || "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || role.includes(q) || branch.includes(q) || site.includes(q);
      }
      return true;
    });
  }, [users, filterBranch, searchQuery, branches]);

  const branchCounts = useMemo(() => {
    const map: Record<string, number> = {};
    const list = Array.isArray(users) ? users : [];
    const bList = Array.isArray(branches) ? branches : [];

    list.forEach((u) => {
      if (!u) return;
      const bId = u.branch_id || u.app_roles?.branch_id;
      if (bId) map[bId] = (map[bId] || 0) + 1;
      const locId = u.default_work_location_id || u.app_roles?.work_location_id;
      if (locId) {
        const sKey = `site:${locId}`;
        map[sKey] = (map[sKey] || 0) + 1;
      }
      if (!bId && u.branch_name) {
        const uBName = (u.branch_name || "").toLowerCase().trim();
        const matched = bList.find((b) => b && !b.is_site && (b.name || "").toLowerCase().trim() === uBName);
        if (matched?.id) map[matched.id] = (map[matched.id] || 0) + 1;
      }
    });
    return map;
  }, [users, branches]);

  const scopedTotal = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    if (!isSuperAdmin) return list.length;
    // When Super Admin views all BUs, scopedTotal = total user count
    if (!filterBranch || filterBranch === "all") return list.length;
    const bList = Array.isArray(branches) ? branches : [];
    const parentBranch = bList.find((b) => b && !b.is_site);
    if (!parentBranch) return list.length;

    const parentName = (parentBranch.name || "").toLowerCase().trim();
    return list.filter((u) => {
      if (!u) return false;
      const bId = u.branch_id || u.app_roles?.branch_id;
      const isDirect = bId === parentBranch.id;
      const uBName = (u.branch_name || "").toLowerCase().trim();
      const isNameMatch = Boolean(uBName && parentName && uBName === parentName);
      const locId = u.default_work_location_id || u.app_roles?.work_location_id;
      const isSiteMatch = Boolean(
        locId &&
        bList.some((b) => b && b.is_site && b.id === `site:${locId}`)
      );
      return isDirect || isNameMatch || isSiteMatch;
    }).length;
  }, [users, branches, isSuperAdmin, filterBranch]);

  return { displayedUsers, branchCounts, scopedTotal };
}
