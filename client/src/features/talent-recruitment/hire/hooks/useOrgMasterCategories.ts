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

export function useOrgMasterCategories(selectedBranchId?: string | null): OrgMasterCategories {
  const [businessUnits, setBusinessUnits] = useState<OrgBusinessUnitOption[]>([]);
  const [divisions, setDivisions] = useState<OrgDivisionOption[]>([]);
  const [departments, setDepartments] = useState<OrgDepartmentOption[]>([]);
  const [positions, setPositions] = useState<OrgPositionOption[]>([]);
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

        const [
          divRes,
          deptRes,
          posRes,
          locRes,
          empTypeRes,
          empLvlRes,
          contractRes,
          branchRes,
        ] = await Promise.all([
          supabase.from("divisions").select("id, name, code, status, branch_id").is("deleted_at", null).order("name"),
          supabase.from("departments").select("id, name, code, division_id, status, branch_id").is("deleted_at", null).order("name"),
          supabase.from("positions").select("id, name, code, department_id, status").is("deleted_at", null).order("name"),
          supabase.from("work_locations").select("id, name, address, branch_id, is_default, status").is("deleted_at", null).order("name"),
          supabase.from("employee_types").select("id, name, status").is("deleted_at", null).order("name"),
          supabase.from("employee_levels").select("id, name, grade, status").is("deleted_at", null).order("grade"),
          supabase.from("contract_types").select("id, name, status").is("deleted_at", null).order("name"),
          supabase.from("branches").select("id, name, company_name, status").is("deleted_at", null).order("name"),
        ]);

        if (!isMounted) return;

        if (branchRes.data && branchRes.data.length > 0) {
          const bus = branchRes.data.map((b: any) => ({
            id: b.id,
            name: b.name,
            company_name: b.company_name,
            status: b.status,
          }));
          setBusinessUnits(bus);

          const compSet = new Set<string>();
          compSet.add("UNI");
          branchRes.data.forEach((b: any) => {
            if (b.company_name) compSet.add(b.company_name);
            if (b.name) compSet.add(b.name);
          });
          setCompanies(Array.from(compSet));
        }

        if (divRes.data && divRes.data.length > 0) {
          setDivisions(divRes.data as OrgDivisionOption[]);
        }

        if (deptRes.data && deptRes.data.length > 0) {
          setDepartments(deptRes.data as OrgDepartmentOption[]);
        } else {
          setDepartments(DEFAULT_DEPARTMENTS.map((d) => ({ id: d, name: d, status: "active" })));
        }

        if (posRes.data && posRes.data.length > 0) {
          setPositions(posRes.data as OrgPositionOption[]);
        }

        if (locRes.data && locRes.data.length > 0) {
          setWorkLocations(locRes.data as OrgWorkLocationOption[]);
        }

        if (empTypeRes.data && empTypeRes.data.length > 0) {
          const names = empTypeRes.data.map((r: any) => r.name).filter(Boolean);
          if (names.length > 0) setEmployeeTypes(names);
        }

        if (empLvlRes.data && empLvlRes.data.length > 0) {
          const names = empLvlRes.data.map((r: any) => r.name).filter(Boolean);
          if (names.length > 0) setEmployeeLevels(names);
        }

        if (contractRes.data && contractRes.data.length > 0) {
          const names = contractRes.data.map((r: any) => r.name).filter(Boolean);
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
