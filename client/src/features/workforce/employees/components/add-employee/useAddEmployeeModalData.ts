import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { ModalManagerEmployee } from "./types";
import type { EmployeeFormState } from "../../types";
import { getBranchCode, deriveBuHandle, DEPARTMENTS } from "../../constants";

const SEED_POSITIONS = [
  "ACM Grocery II",
  "ACM-SF & Butchery",
  "AP - Non Trade",
  "Account Payable Executive",
  "Account Payable Officer",
  "Account Payable Supervisor",
  "Account Receivable Executive",
  "Account Receivable Officer",
  "Accounting Assistant",
  "Accounting Intern",
  "Accounting Manager",
  "Accounting Supervisor",
  "Acting Assistant Store Manager",
  "Manager",
  "Supervisor",
  "Officer",
  "Staff",
  "Assistant",
  "Intern",
];

export interface UseAddEmployeeModalDataOptions {
  passedDepartments?: string[];
  passedDivisions?: string[];
  passedPositions?: string[];
}

export function useAddEmployeeModalData(
  isOpen: boolean,
  form: EmployeeFormState,
  options: UseAddEmployeeModalDataOptions = {}
) {
  const { passedDepartments, passedDivisions, passedPositions } = options;
  const [dbBranches, setDbBranches] = useState<Array<{ id: string; name: string; location: string | null }>>([]);
  const [dbWorkLocations, setDbWorkLocations] = useState<Array<{ id: string; name: string; description: string | null; branch_id: string | null }>>([]);
  const [dbEmployees, setDbEmployees] = useState<ModalManagerEmployee[]>([]);
  const [dbDivisions, setDbDivisions] = useState<Array<{ id: string; name: string; branch_id?: string | null; status?: string | null }>>([]);
  const [dbDepartments, setDbDepartments] = useState<Array<{ id: string; name: string; branch_id?: string | null; status?: string | null }>>([]);
  const [dbPositions, setDbPositions] = useState<Array<{ id: string; name: string; branch_id?: string | null; status?: string | null }>>([]);
  const [dbEmployeeTypes, setDbEmployeeTypes] = useState<Array<{ id: string; name: string; branch_id?: string | null }>>([]);
  const [dbContractTypes, setDbContractTypes] = useState<Array<{ id: string; name: string; term?: string; branch_id?: string | null; status?: string | null }>>([]);

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      supabase.from("branches").select("id, name, location").is("deleted_at", null).order("name"),
      supabase.from("work_locations").select("id, name, description, branch_id").is("deleted_at", null).order("name"),
      supabase.from("employees").select("id, first_name, last_name, email, phone, department, role, position, branch_id, bu_full_name, code_bu, branches(id, name)").is("deleted_at", null).order("first_name"),
      supabase.from("user_role_assignments").select("id, user_id, email, display_name, role_id, deleted_at, app_roles(id, name, is_admin, branch_id)").is("deleted_at", null),
      supabase.from("divisions").select("id, name, branch_id, status").is("deleted_at", null).order("name"),
      supabase.from("departments").select("id, name, branch_id, status").is("deleted_at", null).order("name"),
      supabase.from("positions").select("id, name, branch_id, status").is("deleted_at", null).order("name"),
      supabase.from("contract_types").select("id, name, term, branch_id, status").is("deleted_at", null).order("name"),
    ]).then(([bRes, wRes, eRes, uRes, divRes, dRes, pRes, cRes]) => {
      if (bRes.data) setDbBranches(bRes.data);
      if (wRes.data) setDbWorkLocations(wRes.data);
      if (divRes.data) setDbDivisions(divRes.data.filter((d) => !d.status || d.status !== "disabled"));
      if (dRes.data) setDbDepartments(dRes.data.filter((d) => !d.status || d.status !== "disabled"));
      if (pRes.data) setDbPositions(pRes.data.filter((p) => !p.status || p.status !== "disabled"));
      if (cRes.data) setDbContractTypes(cRes.data.filter((c) => !c.status || c.status !== "disabled"));

      const rawEmployees = (eRes.data || []) as any[];
      const assignments = (uRes.data || []) as any[];

      const enriched: ModalManagerEmployee[] = rawEmployees.map((emp) => {
        const empEmail = emp.email?.toLowerCase().trim();
        const matchedAssignment = assignments.find((a) => a.email && a.email.toLowerCase().trim() === empEmail);
        const assignedRoleName = matchedAssignment?.app_roles?.name || null;
        const realRole = assignedRoleName || emp.position || emp.role || "Staff";
        const lowerRole = realRole.toLowerCase();
        const isManager = Boolean(matchedAssignment?.app_roles?.is_admin) || lowerRole.includes("manager") || lowerRole.includes("head") || lowerRole.includes("lead") || lowerRole.includes("director") || lowerRole.includes("supervisor");
        return { ...emp, realRole, isManager, isAdmin: Boolean(matchedAssignment?.app_roles?.is_admin) };
      });

      setDbEmployees(enriched);
    });
  }, [isOpen]);

  const cleanBranches = useMemo(() => {
    return dbBranches.filter((b) => !b.name.toLowerCase().startsWith("site:") && !b.id.startsWith("site:") && !b.name.toLowerCase().includes("(site)"));
  }, [dbBranches]);

  const currentBranch = useMemo(() => {
    if (!form.branch_id && !form.bu_full_name && !form.code_bu) return null;
    return (
      cleanBranches.find((b) => b.id === form.branch_id) ||
      cleanBranches.find((b) => b.name.toLowerCase().trim() === (form.bu_full_name || "").toLowerCase().trim()) ||
      cleanBranches.find((b) => getBranchCode(b.name) === form.code_bu) ||
      null
    );
  }, [cleanBranches, form.branch_id, form.bu_full_name, form.code_bu]);

  const currentBranchName = currentBranch?.name || form.bu_full_name || cleanBranches[0]?.name || "";

  const workSites = useMemo(() => {
    if (!currentBranch) return dbWorkLocations;
    return dbWorkLocations.filter((w) => w.branch_id === currentBranch.id);
  }, [dbWorkLocations, currentBranch]);

  const currentSiteSelectValue = useMemo(() => {
    if (!form.site) return "";
    const lower = form.site.toLowerCase().trim();
    if (lower === "headquarters" || lower.startsWith("main office")) return "";
    const matched = workSites.find((w) => w.name.toLowerCase().trim() === lower || w.id === form.site);
    return matched ? matched.id : "";
  }, [workSites, form.site]);

  const divisions = useMemo(() => {
    const list = dbDivisions.map((d) => d.name?.trim()).filter(Boolean);
    const merged = Array.from(new Set([...(passedDivisions || []), ...list]));
    return merged;
  }, [dbDivisions, passedDivisions]);

  const departments = useMemo(() => {
    const list = dbDepartments.map((d) => d.name?.trim()).filter(Boolean);
    const merged = Array.from(new Set([...(passedDepartments || []), ...list]));
    return merged.length > 0 ? merged : DEPARTMENTS;
  }, [dbDepartments, passedDepartments]);

  const positions = useMemo(() => {
    const list = dbPositions.map((p) => p.name?.trim()).filter(Boolean);
    const merged = Array.from(new Set([...(passedPositions || []), ...list]));
    return merged.length > 0 ? merged : SEED_POSITIONS;
  }, [dbPositions, passedPositions]);

  const employeeTypes = useMemo(() => {
    const list = dbEmployeeTypes.map((t) => t.name?.trim()).filter(Boolean);
    return list.length > 0 ? Array.from(new Set(list)) : ["Full-Time", "Part-Time", "Probationary", "Internship", "Casual"];
  }, [dbEmployeeTypes]);

  const contractTypes = useMemo(() => {
    const list = dbContractTypes.map((c) => c.name?.trim()).filter(Boolean);
    return list.length > 0 ? Array.from(new Set(list)) : ["1-YEAR FDC", "2-YEAR FDC", "3-YEAR FDC", "PERMANENT (UDC)", "PROBATION", "Internship"];
  }, [dbContractTypes]);

  const buManagers = useMemo(() => {
    return dbEmployees;
  }, [dbEmployees]);

  return {
    cleanBranches,
    currentBranch,
    currentBranchName,
    workSites,
    currentSiteSelectValue,
    divisions,
    departments,
    positions,
    employeeTypes,
    contractTypes,
    buManagers,
    buCeos: buManagers,
    getBranchCode,
    deriveBuHandle,
  };
}
