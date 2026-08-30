import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import type {
  AppRole,
  AuthAccountsResult,
  DirectoryEmployee,
  PasswordResetRequest,
  UserAssignment,
} from "../types";
import { listAuthAccounts } from "../api";
import {
  sortBranchesList,
  buildEnrichedAssignments,
  buildEnrichedEmployees,
} from "./adminDataHelpers";

export function useAdminData() {
  const { user } = useAuth();
  const { isSuperAdmin, userBranchId } = useBranchScope();

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
    const authAccountsPromise = listAuthAccounts().catch((error) => {
      console.warn("Could not fetch Auth accounts:", error);
      return { accounts: [], assignments: null } as AuthAccountsResult;
    });

    let targetBranchId = userBranchId;
    if (!isSuperAdmin && !targetBranchId && user?.email) {
      const { data: myEmp } = await supabase.from("employees").select("branch_id").ilike("email", user.email).maybeSingle();
      if (myEmp?.branch_id) targetBranchId = myEmp.branch_id;
    }

    const empQuery = supabase.from("employees").select("id, email, first_name, last_name, role, department, branch_id, default_work_location_id, branches(id, name)").not("email", "is", null).is("deleted_at", null).order("first_name");

    const [rolesRes, usersRes, deletedRes, employeesRes, resetRequestsRes, authAccountsResult, branchesRes, locationsRes] = await Promise.all([
      supabase.from("app_roles").select("*").order("id"),
      supabase.from("user_role_assignments").select("*, app_roles(id, name, color, is_admin)").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("user_role_assignments").select("email").not("deleted_at", "is", null),
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

    const activeAssignments: UserAssignment[] = (authAccountsResult.assignments || usersRes.data || []).filter((u: any) => !u.deleted_at);
    const activeEmails = new Set(activeAssignments.map((u) => u.email?.toLowerCase()).filter(Boolean));
    const deletedEmails = new Set((deletedRes.data || []).map((u: any) => u.email?.toLowerCase()).filter(Boolean));
    const employeeMap = new Map((employeesRes.data || []).map((e: any) => [e.email?.toLowerCase(), e]));

    const enrichedAssignments = buildEnrichedAssignments(activeAssignments, employeeMap, locationsMap, branchesList);

    let virtualIdCounter = -1;
    const unassignedAuthUsers: UserAssignment[] = (authAccountsResult.accounts || [])
      .filter((a) => a.email && !activeEmails.has(a.email.toLowerCase()) && !deletedEmails.has(a.email.toLowerCase()))
      .map((a) => {
        activeEmails.add(a.email!.toLowerCase());
        const emp = employeeMap.get(a.email!.toLowerCase());
        const bName = emp?.branches ? (emp.branches as any).name : null;
        const site = emp?.default_work_location_id ? locationsMap.get(emp.default_work_location_id) : null;
        return {
          id: virtualIdCounter--,
          user_id: a.id,
          email: a.email!.toLowerCase(),
          display_name: a.display_name,
          role_id: null,
          created_at: new Date().toISOString(),
          app_roles: null,
          branch_id: emp?.branch_id || site?.branch_id || null,
          branch_name: bName || (site ? branchesList.find((b) => b.id === site.branch_id)?.name : null) || "Headquarters",
          default_work_location_id: emp?.default_work_location_id || null,
          site_name: site?.name || null,
        };
      });

    const unconfirmed = new Set<string>((authAccountsResult.accounts || []).filter((a) => a.email && !a.email_confirmed_at && !a.confirmed_at).map((a) => a.email!.toLowerCase()));
    const branchEmployeeEmails = new Set((employeesRes.data || []).map((e: any) => e.email?.toLowerCase()).filter(Boolean));
    if (user?.email) branchEmployeeEmails.add(user.email.toLowerCase());

    const allCombined = [...enrichedAssignments, ...unassignedAuthUsers];
    const filteredUsers = (!isSuperAdmin && targetBranchId) ? allCombined.filter((u) => branchEmployeeEmails.has(u.email?.toLowerCase())) : allCombined;
    const allResets = (resetRequestsRes.data || []) as PasswordResetRequest[];
    const filteredResets = (!isSuperAdmin && targetBranchId) ? allResets.filter((r) => branchEmployeeEmails.has(r.email?.toLowerCase())) : allResets;

    setRoles(rolesRes.data || []);
    setUsers(filteredUsers);
    setUnconfirmedEmails(unconfirmed);
    setEmployees(buildEnrichedEmployees(employeesRes.data || [], locationsMap, branchesList));
    setPasswordResetRequests(filteredResets);
    setLoading(false);
  }, [isSuperAdmin, userBranchId, user?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  return { roles, users, setUsers, branches, passwordResetRequests, employees, unconfirmedEmails, loading, userLoadError, loadData };
}
