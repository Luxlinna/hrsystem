import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import { listAuthAccounts } from "../api";
import { sortBranchesList, buildEnrichedAssignments, buildEnrichedEmployees } from "./adminDataHelpers";
import { phoneToSyntheticEmail, isPhoneSyntheticEmail, syntheticEmailToPhone, normalizePhone } from "@/lib/phoneUtils";
import type { AppRole, DirectoryEmployee, PasswordResetRequest, UserAssignment, AuthAccountsResult } from "../types";
import { getRoleCategoryKey, getShortBuName } from "../constants";

export function useAdminData() {
  const { user } = useAuth();
  const { isSuperAdmin, userBranchId, targetBranch } = useBranchScope();

  const [roles, setRoles] = useState<AppRole[]>([]);
  const [users, setUsers] = useState<UserAssignment[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string; is_site?: boolean; branch_id?: string }[]>([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [unconfirmedEmails, setUnconfirmedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setUserLoadError(null);

    const effectiveBranch = targetBranch || userBranchId || null;

    const authAccountsPromise: Promise<AuthAccountsResult> = listAuthAccounts().catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load auth accounts";
      setUserLoadError(msg);
      return { accounts: [], assignments: null, deleted_assignments: null };
    });

    let empQuery = supabase
      .from("employees")
      .select("id, email, phone, first_name, last_name, role, department, branch_id, default_work_location_id, branches(id, name)")
      .is("deleted_at", null)
      .order("first_name");

    // Only restrict employee query to effectiveBranch if the caller is a branch admin, NOT super admin
    if (!isSuperAdmin && effectiveBranch) {
      empQuery = empQuery.eq("branch_id", effectiveBranch);
    }

    const [rolesRes, usersRes, employeesRes, resetRequestsRes, authAccountsResult, branchesRes, locationsRes] = await Promise.all([
      supabase.from("app_roles").select("*").order("id"),
      supabase.from("user_role_assignments").select("*, app_roles(id, name, color, is_admin, branch_id, work_location_id)").order("created_at", { ascending: false }),
      empQuery,
      supabase.from("password_reset_requests").select("id, email, status, requested_at, acted_at").is("deleted_at", null).order("requested_at", { ascending: false }).limit(50),
      authAccountsPromise,
      supabase.from("branches").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("work_locations").select("id, name, branch_id").is("deleted_at", null),
    ]);

    const locationsMap = new Map(((locationsRes.data || []) as any[]).map((loc) => [loc.id, loc]));
    const branchesList = (branchesRes.data || []) as any[];
    const pureBranches = sortBranchesList(branchesList);

    const sitesList = ((locationsRes.data || []) as any[]).map((loc) => ({ id: `site:${loc.id}`, name: loc.name, branch_id: loc.branch_id, is_site: true }));
    const combinedBranches: { id: string; name: string; is_site?: boolean; branch_id?: string }[] = [];
    pureBranches.forEach((branch) => {
      combinedBranches.push(branch);
      combinedBranches.push(...sitesList.filter((s) => s.branch_id === branch.id));
    });
    setBranches(combinedBranches);

    let catMap: Record<number, string> = {};
    let buMap: Record<number, string[]> = {};
    try {
      catMap = JSON.parse(localStorage.getItem("hrm_role_category_map") || "{}");
      buMap = JSON.parse(localStorage.getItem("hrm_role_bu_map") || "{}");
    } catch (_e) { /* ignore */ }

    const rawRoles = (rolesRes.data || []) as any[];
    const enrichedRoles: AppRole[] = rawRoles.map((r) => {
      let bIds: string[] = [];
      if (buMap[r.id] && Array.isArray(buMap[r.id]) && buMap[r.id].length > 0) {
        bIds = buMap[r.id];
      } else if (r.branch_ids && Array.isArray(r.branch_ids)) {
        bIds = r.branch_ids;
      } else if (r.branch_id) {
        bIds = r.branch_id.includes(",")
          ? r.branch_id.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [r.branch_id];
      }

      let bName = null;
      if (bIds.length === 1) {
        const raw = branchesList.find((b) => b.id === bIds[0])?.name;
        bName = raw ? getShortBuName(raw) : null;
      } else if (bIds.length > 1) {
        const names = bIds
          .map((id: string) => branchesList.find((b) => b.id === id)?.name)
          .filter(Boolean)
          .map((n: string) => getShortBuName(n));
        bName = names.length > 0 ? names.join(", ") : `${bIds.length} BUs`;
      } else if (r.branch_id) {
        const raw = branchesList.find((b) => b.id === r.branch_id)?.name;
        bName = raw ? getShortBuName(raw) : null;
      }

      const sName = r.work_location_id ? locationsMap.get(r.work_location_id)?.name : null;
      const roleCategory = r.category || catMap[r.id] || getRoleCategoryKey(r);
      return {
        ...r,
        branch_ids: bIds,
        category: roleCategory,
        branch_name: bName || null,
        site_name: sName || null,
      };
    });

    // If BU Admin, only show global roles or roles matching their BU
    const visibleRoles = (!isSuperAdmin && effectiveBranch)
      ? enrichedRoles.filter((r) => {
          if (!r.branch_id && (!r.branch_ids || r.branch_ids.length === 0)) return true;
          return r.branch_ids?.includes(effectiveBranch) || r.branch_id === effectiveBranch;
        })
      : enrichedRoles;

    const allAssignments = (usersRes.data || []) as any[];
    const serverDeletedAssignments = (authAccountsResult.deleted_assignments || []) as any[];
    const orphanedAuthUserIds = new Set<string>((authAccountsResult.orphaned_auth_user_ids || []).filter(Boolean));
    const activeAssignments: UserAssignment[] = allAssignments.filter((u: any) => !u.deleted_at);
    const deletedAssignments = [
      ...allAssignments.filter((u: any) => Boolean(u.deleted_at)),
      ...serverDeletedAssignments,
    ];

    const deletedEmails = new Set(deletedAssignments.map((u: any) => u.email?.toLowerCase().trim()).filter(Boolean));
    const deletedUserIds = new Set(deletedAssignments.map((u: any) => u.user_id).filter(Boolean));

    const isDeletedAccount = (email?: string | null, userId?: string | null): boolean => {
      // Treat as deleted if the auth user_id is in the orphaned set
      // (their assignment row was permanently wiped, not just soft-deleted)
      if (userId && orphanedAuthUserIds.has(userId)) return true;
      if (userId && deletedUserIds.has(userId)) return true;
      if (!email) return false;
      const clean = email.toLowerCase().trim();
      if (deletedEmails.has(clean)) return true;
      if (isPhoneSyntheticEmail(clean)) {
        const rawPhone = syntheticEmailToPhone(clean);
        if (deletedEmails.has(rawPhone)) return true;
        const normalized = normalizePhone(rawPhone);
        if (deletedEmails.has(normalized)) return true;
      }
      return false;
    };

    const employeeMap = new Map();
    (employeesRes.data || []).forEach((e: any) => {
      if (e.user_id) {
        employeeMap.set(`user:${e.user_id}`, e);
      }
      if (e.email) {
        employeeMap.set(e.email.toLowerCase(), e);
        if (isPhoneSyntheticEmail(e.email)) {
          const raw = syntheticEmailToPhone(e.email);
          employeeMap.set(raw, e);
          const clean = normalizePhone(raw);
          if (clean) {
            employeeMap.set(clean, e);
            employeeMap.set(phoneToSyntheticEmail(clean), e);
          }
        }
      }
      if (e.phone) {
        employeeMap.set(e.phone.trim().toLowerCase(), e);
        const clean = normalizePhone(e.phone);
        if (clean) {
          employeeMap.set(clean, e);
          employeeMap.set(phoneToSyntheticEmail(clean), e);
        }
      }
    });

    // Map existing assignments by lowercased email
    const assignedEmails = new Set(activeAssignments.map((u) => u.email?.toLowerCase()).filter(Boolean));

    // Map auth accounts by lowercased email
    const authMap = new Map<string, any>((authAccountsResult.accounts || []).map((a: any) => [a.email?.toLowerCase(), a]));

    // Link user_id from auth accounts if missing on assignment
    activeAssignments.forEach((u) => {
      if (!u.user_id && u.email) {
        const matchedAuth = authMap.get(u.email.toLowerCase());
        if (matchedAuth?.id) {
          u.user_id = matchedAuth.id;
        }
      }
    });

    // Synthesize entries for any active auth user without a user_role_assignments row,
    // strictly excluding accounts that have been moved to the Recycle Bin (deleted_at is set)
    const unassignedAuthAccounts: UserAssignment[] = (authAccountsResult.accounts || [])
      .filter((a) => {
        if (!a.email) return false;
        const emailLower = a.email.toLowerCase().trim();
        if (assignedEmails.has(emailLower)) return false;
        if (isDeletedAccount(emailLower, a.id)) return false;
        return true;
      })
      .map((a, idx) => ({
        id: -1000 - idx,
        user_id: a.id,
        email: a.email,
        display_name: a.display_name || null,
        role_id: null,
        created_at: a.created_at || new Date().toISOString(),
      }));

    const combinedAssignments = [...activeAssignments, ...unassignedAuthAccounts];
    const enrichedAssignments = buildEnrichedAssignments(combinedAssignments, employeeMap, locationsMap, branchesList);

    const unconfirmed = new Set<string>(
      (authAccountsResult.accounts || [])
        .filter((a) => a.email && (!a.email_confirmed_at || !a.confirmed_at || a.invite_pending))
        .map((a) => a.email!.toLowerCase())
    );
    const branchEmployeeEmails = new Set(
      (employeesRes.data || []).flatMap((e: any) => {
        const list: (string | null)[] = [e.email?.toLowerCase()];
        if (e.phone) {
          list.push(phoneToSyntheticEmail(e.phone));
          const digits = e.phone.replace(/\D/g, "");
          list.push(`${digits}@phone.hrmsystem.local`);
          if (digits.startsWith("855") && digits.length >= 11) {
            list.push(`0${digits.slice(3)}@phone.hrmsystem.local`);
          }
        }
        return list;
      }).filter(Boolean)
    );
    if (user?.email) branchEmployeeEmails.add(user.email.toLowerCase());

    const filteredUsers = (!isSuperAdmin && effectiveBranch)
      ? enrichedAssignments.filter((u) => u.branch_id === effectiveBranch || (u.email && branchEmployeeEmails.has(u.email.toLowerCase())))
      : enrichedAssignments;
    const allResets = (resetRequestsRes.data || []) as PasswordResetRequest[];
    const filteredResets = (!isSuperAdmin && effectiveBranch)
      ? allResets.filter((r) => r.email && branchEmployeeEmails.has(r.email.toLowerCase()))
      : allResets;

    // Filter employees for autofill to those with contact info (email or phone)
    const actionableEmployees = (employeesRes.data || []).filter((e: any) => Boolean(e.email || e.phone));

    setRoles(visibleRoles);
    setUsers(filteredUsers);
    setUnconfirmedEmails(unconfirmed);
    setEmployees(buildEnrichedEmployees(actionableEmployees, locationsMap, branchesList));
    setPasswordResetRequests(filteredResets);
    setLoading(false);
  }, [isSuperAdmin, userBranchId, targetBranch, user?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  return { roles, users, setUsers, branches, passwordResetRequests, employees, unconfirmedEmails, loading, userLoadError, loadData };
}
