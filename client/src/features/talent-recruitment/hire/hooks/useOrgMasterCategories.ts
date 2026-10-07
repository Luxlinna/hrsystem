import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface OrgDivisionOption {
  id: string;
  name: string;
  code?: string | null;
  status?: string;
  branch_id?: string | null;
}

export interface OrgDepartmentOption {
  id: string;
  name: string;
  code?: string | null;
  division_id?: string | null;
  status?: string;
  branch_id?: string | null;
}

export interface OrgPositionOption {
  id: string;
  name: string;
  code?: string | null;
  department_id?: string | null;
  status?: string;
}

export interface OrgWorkLocationOption {
  id: string;
  name: string;
  address?: string | null;
  branch_id?: string | null;
  is_default?: boolean;
  status?: string;
}

export interface OrgBusinessUnitOption {
  id: string;
  name: string;
  company_name?: string | null;
  status?: string;
}

export interface OrgMasterCategories {
  businessUnits: OrgBusinessUnitOption[];
  divisions: OrgDivisionOption[];
  departments: OrgDepartmentOption[];
  positions: OrgPositionOption[];
  workLocations: OrgWorkLocationOption[];
  employeeTypes: string[];
  employeeLevels: string[];
  contractTypes: string[];
  companies: string[];
  loading: boolean;
}

const DEFAULT_DEPARTMENTS = [
  "HUMAN RESOURCES",
  "ADMINISTRATION",
  "BUSINESS DEVELOPMENT",
  "FINANCE AND ACCOUNTING",
  "INFORMATION TECHNOLOGY (IT)",
  "INTERNAL AUDIT AND LOSS PREVENTION",
  "MANAGEMENT",
  "MARKETING",
  "MERCHANDISE",
  "OPERATIONS",
  "OPERATIONS KITCHEN",
];

const DEFAULT_EMPLOYEE_TYPES = [
  "FULL-TIME",
  "PART-TIME",
  "INTERNSHIP",
  "PROBATION",
  "CONTRACTOR",
  "HOD",
];

const DEFAULT_EMPLOYEE_LEVELS = [
  "Intern",
  "Junior",
  "Mid-level",
  "Senior",
  "Lead",
  "Manager",
  "Senior Manager",
  "Director",
  "Executive",
];

const DEFAULT_CONTRACT_TYPES = [
  "1-YEAR FDC",
  "2-YEAR FDC",
  "UDC (PERMANENT)",
  "PROBATION (3-MONTH)",
  "INTERNSHIP (3-6 MONTHS)",
  "CONSULTANCY",
  "FREELANCE",
];

const POSITIONS_CACHE_KEY = "hr_positions_cache";
const DELETED_STORAGE_KEY = "hr_deleted_position_ids";

const getDeletedSet = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const getCachedPositions = (): OrgPositionOption[] => {
  try {
    const raw = localStorage.getItem(POSITIONS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveCachedPositions = (list: OrgPositionOption[]) => {
  try {
    localStorage.setItem(POSITIONS_CACHE_KEY, JSON.stringify(list));
  } catch (e) { console.error(e); }
};

export function useOrgMasterCategories(selectedBranchId?: string | null): OrgMasterCategories {
  const [businessUnits, setBusinessUnits] = useState<OrgBusinessUnitOption[]>([]);
  const [divisions, setDivisions] = useState<OrgDivisionOption[]>([]);
  const [departments, setDepartments] = useState<OrgDepartmentOption[]>([]);
  const [positions, setPositions] = useState<OrgPositionOption[]>(() => {
    const cached = getCachedPositions();
    if (cached.length > 0) {
      const delSet = getDeletedSet();
      return cached.filter((p) => !delSet.has(p.id) && !delSet.has(p.name) && (!p.status || p.status === "active"));
    }
    return [];
  });
  const [workLocations, setWorkLocations] = useState<OrgWorkLocationOption[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<string[]>(DEFAULT_EMPLOYEE_TYPES);
  const [employeeLevels, setEmployeeLevels] = useState<string[]>(DEFAULT_EMPLOYEE_LEVELS);
  const [contractTypes, setContractTypes] = useState<string[]>(DEFAULT_CONTRACT_TYPES);
  const [companies, setCompanies] = useState<string[]>(["UNI", "OPS SOLUTIONS CO., LTD"]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOrgData() {
      try {
        setLoading(true);

        let divQuery = supabase.from("divisions").select("id, name, code, status, branch_id").is("deleted_at", null).order("name");
        let deptQuery = supabase.from("departments").select("id, name, parent_department_name, status, branch_id, sort_order").is("deleted_at", null).order("sort_order", { ascending: true }).order("name", { ascending: true });
        let posQuery = supabase.from("positions").select("*").is("deleted_at", null).order("sort_order", { ascending: true }).order("name", { ascending: true });
        let locQuery = supabase.from("work_locations").select("id, name, address, branch_id, is_default, status").is("deleted_at", null).order("name");
        let empTypeQuery = Promise.resolve({ data: [{ name: "FULL-TIME" }, { name: "HOD" }, { name: "INTERNSHIP" }, { name: "PART-TIME" }], error: null });
        let empLvlQuery = supabase.from("employee_levels").select("id, name, remark, status, sort_order").is("deleted_at", null).order("sort_order", { ascending: true }).order("name", { ascending: true });
        let contractQuery = supabase.from("contract_types").select("id, name, term, status, sort_order").is("deleted_at", null).order("sort_order", { ascending: true }).order("name", { ascending: true });
        let branchQuery = supabase.from("branches").select("id, name, company_name, status").is("deleted_at", null).order("name");

        if (selectedBranchId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedBranchId)) {
          locQuery = locQuery.or(`branch_id.eq.${selectedBranchId},branch_id.is.null`);
        }

        const [
          divRes,
          deptRes,
          posRes,
          locRes,
          empTypeRes,
          empLvlRes,
          contractRes,
          branchRes,
        ] = await Promise.allSettled([
          divQuery,
          deptQuery,
          posQuery,
          locQuery,
          empTypeQuery,
          empLvlQuery,
          contractQuery,
          branchQuery,
        ]);

        if (!isMounted) return;

        // Branches / Business Units
        if (branchRes.status === "fulfilled" && branchRes.value.data && branchRes.value.data.length > 0) {
          const bus = branchRes.value.data.map((b: any) => ({
            id: b.id,
            name: b.name,
            company_name: b.company_name,
            status: b.status,
          }));
          setBusinessUnits(bus);

          const compSet = new Set<string>();
          compSet.add("UNI");
          branchRes.value.data.forEach((b: any) => {
            if (b.company_name) compSet.add(b.company_name);
            if (b.name) compSet.add(b.name);
          });
          setCompanies(Array.from(compSet));
        }

        // Divisions
        if (divRes.status === "fulfilled" && divRes.value.data && divRes.value.data.length > 0) {
          setDivisions((divRes.value.data as OrgDivisionOption[]).filter((d) => !d.status || d.status === "active"));
        }

        // Departments
        if (deptRes.status === "fulfilled" && deptRes.value.data && deptRes.value.data.length > 0) {
          const activeDepts = (deptRes.value.data as OrgDepartmentOption[]).filter((d) => !d.status || d.status === "active");
          setDepartments(activeDepts.length > 0 ? activeDepts : DEFAULT_DEPARTMENTS.map((d) => ({ id: d, name: d, status: "active" })));
        } else {
          setDepartments(DEFAULT_DEPARTMENTS.map((d) => ({ id: d, name: d, status: "active" })));
        }

        // Positions
        if (posRes.status === "fulfilled" && posRes.value.data && posRes.value.data.length > 0) {
          const delSet = getDeletedSet();
          const activePositions = (posRes.value.data as OrgPositionOption[]).filter(
            (p) => !delSet.has(p.id) && !delSet.has(p.name) && (!p.status || p.status === "active")
          );
          if (activePositions.length > 0) {
            setPositions(activePositions);
            saveCachedPositions(activePositions);
          }
        } else {
          const cached = getCachedPositions();
          if (cached.length > 0) {
            const delSet = getDeletedSet();
            setPositions(
              cached.filter((p) => !delSet.has(p.id) && !delSet.has(p.name) && (!p.status || p.status === "active"))
            );
          }
        }

        // Work Locations
        if (locRes.status === "fulfilled" && locRes.value.data && locRes.value.data.length > 0) {
          setWorkLocations((locRes.value.data as OrgWorkLocationOption[]).filter((w) => !w.status || w.status === "active"));
        }

        // Employee Types
        if (empTypeRes.status === "fulfilled" && empTypeRes.value.data && empTypeRes.value.data.length > 0) {
          const names = empTypeRes.value.data
            .filter((r: any) => !r.status || r.status === "active")
            .map((r: any) => r.name)
            .filter(Boolean);
          if (names.length > 0) setEmployeeTypes(names);
        }

        // Employee Levels
        if (empLvlRes.status === "fulfilled" && empLvlRes.value.data && empLvlRes.value.data.length > 0) {
          const names = empLvlRes.value.data
            .filter((r: any) => !r.status || r.status === "active")
            .map((r: any) => r.name)
            .filter(Boolean);
          if (names.length > 0) setEmployeeLevels(names);
        }

        // Contract Types
        if (contractRes.status === "fulfilled" && contractRes.value.data && contractRes.value.data.length > 0) {
          const names = contractRes.value.data
            .filter((r: any) => !r.status || r.status === "active")
            .map((r: any) => r.name)
            .filter(Boolean);
          if (names.length > 0) setContractTypes(names);
        }
      } catch (err) {
        console.error("Failed to load org master categories:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrgData();

    return () => {
      isMounted = false;
    };
  }, [selectedBranchId]);

  return {
    businessUnits,
    divisions,
    departments,
    positions,
    workLocations,
    employeeTypes,
    employeeLevels,
    contractTypes,
    companies,
    loading,
  };
}
