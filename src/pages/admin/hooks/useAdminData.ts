import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import { listAuthAccounts } from "../api";
import { sortBranchesList, buildEnrichedAssignments, buildEnrichedEmployees } from "./adminDataHelpers";
import { phoneToSyntheticEmail, isPhoneSyntheticEmail, syntheticEmailToPhone, normalizePhone } from "@/lib/phoneUtils";
import type { AppRole, DirectoryEmployee, PasswordResetRequest, UserAssignment } from "../types";

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

    const authAccountsPromise = listAuthAccounts().catch((err) => {
      const msg = err instanceof Error ? err.message : "Failed to load auth accounts";
      setUserLoadError(msg);
      return { accounts: [], assignments: null };
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
      supabase.from("user_role_assignments").select("*, app_roles(id, name, color, is_admin)").is("deleted_at", null).order("created_at", { ascending: false }),
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

    const activeAssignments: UserAssignment[] = (usersRes.data || []).filter((u: any) => !u.deleted_at);
    const employeeMap = new Map();
    (employeesRes.data || []).forEach((e: any) => {
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
    const authMap = new Map((authAccountsResult.accounts || []).map((a) => [a.email?.toLowerCase(), a]));

    // Link user_id from auth accounts if missing on assignment
    activeAssignments.forEach((u) => {
      if (!u.user_id && u.email) {
        const matchedAuth = authMap.get(u.email.toLowerCase());
        if (matchedAuth?.id) {
          u.user_id = matchedAuth.id;
        }
      }
    });

    // Synthesize entries for any auth user without a user_role_assignments row so admins see them
    const unassignedAuthAccounts: UserAssignment[] = (authAccountsResult.accounts || [])
      .filter((a) => a.email && !assignedEmails.has(a.email.toLowerCase()))
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

    const unconfirmed = new Set<string>((authAccountsResult.accounts || []).filter((a) => a.email && !a.email_confirmed_at && !a.confirmed_at).map((a) => a.email!.toLowerCase()));
    const branchEmployeeEmails = new Set(
      (employeesRes.data || []).flatMap((e: any) => [
        e.email?.toLowerCase(),
        e.phone ? phoneToSyntheticEmail(e.phone) : null,
      ]).filter(Boolean)
    );
    if (user?.email) branchEmployeeEmails.add(user.email.toLowerCase());

    const filteredUsers = (!isSuperAdmin && effectiveBranch) ? enrichedAssignments.filter((u) => branchEmployeeEmails.has(u.email?.toLowerCase())) : enrichedAssignments;
    const allResets = (resetRequestsRes.data || []) as PasswordResetRequest[];
    const filteredResets = (!isSuperAdmin && effectiveBranch) ? allResets.filter((r) => branchEmployeeEmails.has(r.email?.toLowerCase())) : allResets;

    // Filter employees for autofill to those with contact info (email or phone)
    const actionableEmployees = (employeesRes.data || []).filter((e: any) => Boolean(e.email || e.phone));

    setRoles(rolesRes.data || []);
    setUsers(filteredUsers);
    setUnconfirmedEmails(unconfirmed);
    setEmployees(buildEnrichedEmployees(actionableEmployees, locationsMap, branchesList));
    setPasswordResetRequests(filteredResets);
    setLoading(false);
  }, [isSuperAdmin, userBranchId, targetBranch, user?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  return { roles, users, setUsers, branches, passwordResetRequests, employees, unconfirmedEmails, loading, userLoadError, loadData };
}
