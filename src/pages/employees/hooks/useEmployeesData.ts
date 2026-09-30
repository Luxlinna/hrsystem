import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { phoneToSyntheticEmail, isPhoneSyntheticEmail, syntheticEmailToPhone } from "@/lib/phoneUtils";
import { compareBiometricIds } from "@/lib/biometricUtils";
import {
  BU_DEFAULT_CONTRACT_TYPES,
  BU_DEFAULT_JOB_STATUSES,
  BU_DEFAULT_DEPARTMENTS,
  BU_DEFAULT_POSITIONS,
  BU_DEFAULT_EMPLOYEE_TYPES,
  BU_DEFAULT_EMPLOYEE_LEVELS,
} from "../constants";
import type { Employee, Branch, AppRole, AccountStatus, BiometricDeviceRef } from "../types";

interface UseEmployeesDataProps {
  isPartnerBranchBlocked: boolean;
  targetBranch: string | null;
  selectedSiteId: string | null;
}

const EMPLOYEE_SELECT_FIELDS =
  "id, first_name, last_name, kh_name, full_name, employee_code, nssf_number, email, phone, role, position, department, branch_id, status, join_date, start_date, reports_to, avatar_url, default_work_location_id, biometric_user_id, contract_type, contract_effective_date, contract_end_date, basic_salary, contract_rate, employment_type, code_bu, tax_salary_frequency, payroll_structure, branches(name), work_locations:default_work_location_id(id, name)";

export function useEmployeesData({
  isPartnerBranchBlocked,
  targetBranch,
  selectedSiteId,
}: UseEmployeesDataProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [workSites, setWorkSites] = useState<{ id: string; name: string; branch_id: string; is_default?: boolean }[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [contractTypes, setContractTypes] = useState<string[]>(BU_DEFAULT_CONTRACT_TYPES);
  const [jobStatuses, setJobStatuses] = useState<string[]>(BU_DEFAULT_JOB_STATUSES);
  const [departments, setDepartments] = useState<string[]>(BU_DEFAULT_DEPARTMENTS);
  const [positions, setPositions] = useState<string[]>(BU_DEFAULT_POSITIONS);
  const [employeeTypes, setEmployeeTypes] = useState<string[]>(BU_DEFAULT_EMPLOYEE_TYPES);
  const [employeeLevels, setEmployeeLevels] = useState<string[]>(BU_DEFAULT_EMPLOYEE_LEVELS);
  const [managerEmails, setManagerEmails] = useState<Set<string>>(new Set());
  const [accountStatus, setAccountStatus] = useState<Record<string, AccountStatus>>({});
  const [biometricDevices, setBiometricDevices] = useState<BiometricDeviceRef[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(() => {
    if (isPartnerBranchBlocked) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const query = supabase
      .from("employees")
      .select(EMPLOYEE_SELECT_FIELDS)
      .is("deleted_at", null)
      .order("first_name");

    query.then(({ data, error }) => {
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

      // Sort by BU Biometric ID from 001 until the last user
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
      setBranches([]);
      setWorkSites([]);
      return;
    }

    supabase.from("branches").select("id, name").is("deleted_at", null).order("name").then(({ data }) => {
      if (data) setBranches(data as Branch[]);
    });

    supabase.from("work_locations").select("id, name, branch_id, is_default").is("deleted_at", null).order("is_default", { ascending: false }).order("name").then(({ data }) => {
      if (data) setWorkSites(data);
    });

    const loadStr = (tbl: string, setter: (vals: string[]) => void) => {
      supabase.from(tbl).select("name").is("deleted_at", null).order("sort_order").order("name").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setter(Array.from(new Set(data.map((d: any) => d.name).filter(Boolean))));
        }
      });
    };

    loadStr("departments", setDepartments);
    loadStr("positions", setPositions);
    loadStr("employee_types", setEmployeeTypes);
    loadStr("employee_levels", setEmployeeLevels);
    loadStr("contract_types", setContractTypes);
    loadStr("job_statuses", setJobStatuses);

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
            const status: AccountStatus = { invited: true, hasAccount: Boolean(row.user_id) };
            statusMap[key] = status;
            if (isPhoneSyntheticEmail(key)) statusMap[syntheticEmailToPhone(key)] = status;
          }
        });
        setAccountStatus(statusMap);
      });
  }, [employees]);

  return {
    employees, setEmployees, branches, workSites, departments, positions,
    employeeTypes, employeeLevels, roles, contractTypes, jobStatuses,
    managerEmails, accountStatus, biometricDevices, loading, loadEmployees,
  };
}
