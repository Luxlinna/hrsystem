import { useMemo } from "react";
import type { UserAssignment } from "../types";

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
  searchQuery: string
) {
  const displayedUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const bList = Array.isArray(branches) ? branches : [];

    return list.filter((u) => {
      if (!u) return false;
      if (filterBranch && filterBranch !== "all") {
        if (typeof filterBranch === "string" && filterBranch.startsWith("site:")) {
          const sId = filterBranch.substring(5);
          if (u.default_work_location_id !== sId) return false;
        } else {
          const targetB = bList.find((b) => b && b.id === filterBranch);
          const isDirectMatch = u.branch_id === filterBranch;
          const uBranchName = (u.branch_name || "").toLowerCase().trim();
          const targetBName = (targetB?.name || "").toLowerCase().trim();
          const isNameMatch = Boolean(uBranchName && targetBName && uBranchName === targetBName);
          if (!isDirectMatch && !isNameMatch) return false;
        }
      }

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (u.display_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const role = (u.app_roles?.name || "").toLowerCase();
        const branch = (u.branch_name || "").toLowerCase();
        const site = (u.site_name || "").toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q) || branch.includes(q) || site.includes(q);
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
      if (u.branch_id) map[u.branch_id] = (map[u.branch_id] || 0) + 1;
      if (u.default_work_location_id) {
        const sKey = `site:${u.default_work_location_id}`;
        map[sKey] = (map[sKey] || 0) + 1;
      }
      if (!u.branch_id && u.branch_name) {
        const uBName = (u.branch_name || "").toLowerCase().trim();
        const matched = bList.find((b) => b && !b.is_site && (b.name || "").toLowerCase().trim() === uBName);
        if (matched?.id) map[matched.id] = (map[matched.id] || 0) + 1;
      }
    });
    return map;
  }, [users, branches]);

  const scopedTotal = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const bList = Array.isArray(branches) ? branches : [];
    const parentBranch = bList.find((b) => b && !b.is_site);
    if (!parentBranch) return list.length;

    const parentName = (parentBranch.name || "").toLowerCase().trim();
    return list.filter((u) => {
      if (!u) return false;
      const isDirect = u.branch_id === parentBranch.id;
      const uBName = (u.branch_name || "").toLowerCase().trim();
      const isNameMatch = Boolean(uBName && parentName && uBName === parentName);
      const isSiteMatch = Boolean(
        u.default_work_location_id &&
        bList.some((b) => b && b.is_site && b.id === `site:${u.default_work_location_id}`)
      );
      return isDirect || isNameMatch || isSiteMatch;
    }).length;
  }, [users, branches]);

  return { displayedUsers, branchCounts, scopedTotal };
}
