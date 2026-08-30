import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Employee, Branch, AppRole, AccountStatus } from "../types";

interface UseEmployeesDataProps {
  isPartnerBranchBlocked: boolean;
  targetBranch: string | null;
  selectedSiteId: string | null;
}

export function useEmployeesData({
  isPartnerBranchBlocked,
  targetBranch,
  selectedSiteId,
}: UseEmployeesDataProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [managerEmails, setManagerEmails] = useState<Set<string>>(new Set());
  const [accountStatus, setAccountStatus] = useState<Record<string, AccountStatus>>({});
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(() => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("employees")
      .select("id, first_name, last_name, email, phone, role, department, branch_id, status, join_date, reports_to, avatar_url, default_work_location_id, branches(name)")
      .is("deleted_at", null)
      .eq("branch_id", targetBranch)
      .order("first_name");

    if (selectedSiteId) {
      query = query.eq("default_work_location_id", selectedSiteId);
    }

    query.then(({ data, error }) => {
      setLoading(false);
      if (error) {
        toast("Error", "Failed to load employee directory", "error");
        return;
      }
      const formatted = (data || []).map((x: any) => ({
        ...x,
        branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null,
      })) as Employee[];
      setEmployees(formatted);
    });
  }, [isPartnerBranchBlocked, targetBranch, selectedSiteId]);

  useEffect(() => {
    loadEmployees();
    if (isPartnerBranchBlocked || !targetBranch) {
      setBranches([]);
      return;
    }

    supabase.from("branches").select("id, name").eq("id", targetBranch).order("name").then(({ data }) => {
      setBranches(data || []);
    });

    supabase.from("app_roles").select("id, name, color").order("name").then(({ data }) => {
      setRoles(data || []);
    });

    supabase
      .from("user_role_assignments")
      .select("email, app_roles(name)")
      .is("deleted_at", null)
      .then(({ data }) => {
        if (!data) return;
        const emails = new Set<string>();
        data.forEach((row: any) => {
          const roleName = row.app_roles?.name || "";
          if (/manager/i.test(roleName) && row.email) emails.add(row.email.toLowerCase());
        });
        setManagerEmails(emails);
      });
  }, [loadEmployees, isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    const emails = employees.map((e) => e.email).filter(Boolean);
    if (emails.length === 0) {
      setAccountStatus({});
      return;
    }
    supabase.rpc("get_user_account_status", { emails }).then(({ data }) => {
      if (data) {
        const statusMap: Record<string, AccountStatus> = {};
        data.forEach((row: any) => {
          if (row.email) {
            statusMap[row.email] = { invited: Boolean(row.invited), hasAccount: Boolean(row.has_account) };
          }
        });
        setAccountStatus(statusMap);
      }
    });
  }, [employees]);

  return {
    employees,
    setEmployees,
    branches,
    roles,
    managerEmails,
    accountStatus,
    loading,
    loadEmployees,
  };
}
