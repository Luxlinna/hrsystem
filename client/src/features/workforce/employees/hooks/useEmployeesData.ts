import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { phoneToSyntheticEmail, isPhoneSyntheticEmail, syntheticEmailToPhone } from "@/lib/phoneUtils";
import { compareBiometricIds } from "@/lib/biometricUtils";
import type { Employee, Branch, AppRole, AccountStatus, BiometricDeviceRef } from "../types";

interface UseEmployeesDataProps {
  isPartnerBranchBlocked: boolean;
  targetBranch: string | null;
  selectedSiteId: string | null;
}

const EMPLOYEE_SELECT_FIELDS =
  "*, branches(name), work_locations:default_work_location_id(id, name)";

export function useEmployeesData({
  isPartnerBranchBlocked,
}: UseEmployeesDataProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [workSites, setWorkSites] = useState<{ id: string; name: string; branch_id: string; is_default?: boolean }[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [contractTypes, setContractTypes] = useState<string[]>([]);
  const [jobStatuses, setJobStatuses] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<string[]>(["FULL-TIME", "HOD", "INTERNSHIP", "PART-TIME"]);
  const [employeeLevels, setEmployeeLevels] = useState<string[]>(["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"]);
  const [managerEmails, setManagerEmails] = useState<Set<string>>(new Set());
  const [accountStatus, setAccountStatus] = useState<Record<string, AccountStatus>>({});
  const [biometricDevices, setBiometricDevices] = useState<BiometricDeviceRef[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(() => {
    if (isPartnerBranchBlocked) {
      setEmployees([]); setLoading(false);
      return;
    }

    supabase
      .from("employees")
      .select(EMPLOYEE_SELECT_FIELDS)
      .is("deleted_at", null)
      .order("first_name")
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          toast("Error", "Failed to load employee directory", "error");
          return;
        }
        const formatted = (data || []).map((x: any) => ({
          ...x,
          branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null,
          work_locations: Array.isArray(x.work_locations) ? x.work_locations[0] : x.work_locations || null,
        })) as Employee[];

        formatted.sort((a, b) => {
          const idComp = compareBiometricIds(a.biometric_user_id, b.biometric_user_id);
          if (idComp !== 0) return idComp;
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        });

        setEmployees(formatted);
      });
  }, [isPartnerBranchBlocked]);

  useEffect(() => {
    loadEmployees();
    if (isPartnerBranchBlocked) {
      setBranches([]); setWorkSites([]);
      return;
    }

    supabase.from("branches").select("id, name").is("deleted_at", null).order("name").then(({ data }) => {
      if (data) setBranches(data as Branch[]);
    });

    supabase.from("work_locations").select("id, name, branch_id, is_default").is("deleted_at", null).order("is_default", { ascending: false }).order("name").then(({ data }) => {
      if (data) setWorkSites(data);
    });

    const loadRealTable = async (tbl: string, setter: (vals: string[]) => void, fallback: string[] = []) => {
      try {
        const { data, error } = await supabase
          .from(tbl)
          .select("name")
          .is("deleted_at", null)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });

        if (!error && data) {
          const vals = Array.from(new Set(data.map((d: any) => d.name).filter(Boolean)));
          setter(vals.length > 0 ? vals : fallback);
        } else if (fallback.length > 0) {
          setter(fallback);
        }
      } catch {
        if (fallback.length > 0) setter(fallback);
      }
    };

    loadRealTable("departments", setDepartments);
    loadRealTable("divisions", setDivisions);
    loadRealTable("positions", setPositions);
    setEmployeeTypes(["FULL-TIME", "HOD", "INTERNSHIP", "PART-TIME"]);
    loadRealTable("employee_levels", setEmployeeLevels, ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"]);
    loadRealTable("contract_types", setContractTypes);
    loadRealTable("job_statuses", setJobStatuses);

    supabase.from("app_roles").select("id, name, color").order("name").then(({ data }) => {
      if (data) setRoles(data);
    });

    supabase.from("user_role_assignments").select("email, app_roles(name)").is("deleted_at", null).then(({ data }) => {
      if (!data) return;
      const emails = new Set<string>();
      data.forEach((row: any) => {
        if (/manager/i.test(row.app_roles?.name || "") && row.email) emails.add(row.email.toLowerCase());
      });
      setManagerEmails(emails);
    });

    supabase.from("biometric_devices").select("id, branch_id, work_location_id").then(({ data }) => {
      setBiometricDevices((data as BiometricDeviceRef[]) || []);
    });
  }, [loadEmployees, isPartnerBranchBlocked]);

  useEffect(() => {
    const identifiers = employees
      .flatMap((e) => [e.email?.trim().toLowerCase(), e.phone ? phoneToSyntheticEmail(e.phone) : null])
      .filter(Boolean) as string[];

    if (identifiers.length === 0) {
      setAccountStatus({});
      return;
    }
    supabase
      .from("user_role_assignments")
      .select("email, user_id, role_id")
      .in("email", identifiers)
      .is("deleted_at", null)
      .not("role_id", "is", null)
      .then(({ data }) => {
        const statusMap: Record<string, AccountStatus> = {};
        (data || []).forEach((row: any) => {
          if (row.email) {
            const key = row.email.toLowerCase();
            statusMap[key] = { invited: true, hasAccount: Boolean(row.user_id) };
            if (isPhoneSyntheticEmail(key)) statusMap[syntheticEmailToPhone(key)] = { invited: true, hasAccount: Boolean(row.user_id) };
          }
        });
        setAccountStatus(statusMap);
      });
  }, [employees]);

  return {
    employees, setEmployees, branches, workSites, departments, divisions, positions,
    employeeTypes, employeeLevels, roles, contractTypes, jobStatuses,
    managerEmails, accountStatus, biometricDevices, loading, loadEmployees,
  };
}
