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

export function useAddEmployeeModalData(isOpen: boolean, form: EmployeeFormState) {
  const [dbBranches, setDbBranches] = useState<Array<{ id: string; name: string; location: string | null }>>([]);
  const [dbWorkLocations, setDbWorkLocations] = useState<Array<{ id: string; name: string; description: string | null; branch_id: string | null }>>([]);
  const [dbEmployees, setDbEmployees] = useState<ModalManagerEmployee[]>([]);
  const [dbDivisions, setDbDivisions] = useState<Array<{ id: string; name: string; branch_id: string | null }>>([]);
  const [dbDepartments, setDbDepartments] = useState<Array<{ id: string; name: string; branch_id: string | null }>>([]);
  const [dbPositions, setDbPositions] = useState<Array<{ id: string; name: string; branch_id: string | null }>>([]);
  const [dbEmployeeTypes, setDbEmployeeTypes] = useState<Array<{ id: string; name: string; branch_id: string | null }>>([]);
  const [dbContractTypes, setDbContractTypes] = useState<Array<{ id: string; name: string; term?: string; branch_id: string | null }>>([]);

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      supabase.from("branches").select("id, name, location").is("deleted_at", null).order("name"),
      supabase.from("work_locations").select("id, name, description, branch_id").is("deleted_at", null).order("name"),
      supabase.from("employees").select("id, first_name, last_name, email, phone, department, role, position, branch_id, bu_full_name, code_bu, branches(id, name)").is("deleted_at", null).order("first_name"),
      supabase.from("user_role_assignments").select("id, user_id, email, display_name, role_id, deleted_at, app_roles(id, name, is_admin, branch_id)").is("deleted_at", null),
      supabase.from("divisions").select("id, name, branch_id").is("deleted_at", null).order("name"),
      supabase.from("departments").select("id, name, branch_id").is("deleted_at", null).order("sort_order"),
      supabase.from("positions").select("id, name, branch_id").is("deleted_at", null).order("sort_order"),
      supabase.from("contract_types").select("id, name, term, branch_id").is("deleted_at", null).order("sort_order"),
    ]).then(([bRes, wRes, eRes, uRes, divRes, dRes, pRes, cRes]) => {
      if (bRes.data) setDbBranches(bRes.data);
      if (wRes.data) setDbWorkLocations(wRes.data);
      if (divRes.data) setDbDivisions(divRes.data);
      if (dRes.data) setDbDepartments(dRes.data);
      if (pRes.data) setDbPositions(pRes.data);
      if (cRes.data) setDbContractTypes(cRes.data);

      const rawEmployees = (eRes.data || []) as any[];
      const assignments = (uRes.data || []) as any[];

      const enriched: ModalManagerEmployee[] = rawEmployees
        .map((emp) => {
          const empEmail = emp.email?.toLowerCase().trim();
          const matchedAssignment = assignments.find((a) => a.email && a.email.toLowerCase().trim() === empEmail);
          const assignedRoleName = matchedAssignment?.app_roles?.name || null;
          const realRole = assignedRoleName || emp.position || emp.role || "Staff";
          const lowerRole = realRole.toLowerCase();
          const isManager = Boolean(matchedAssignment?.app_roles?.is_admin) || lowerRole.includes("manager") || lowerRole.includes("head") || lowerRole.includes("lead") || lowerRole.includes("director") || lowerRole.includes("supervisor");
          return { ...emp, realRole, isManager, isAdmin: Boolean(matchedAssignment?.app_roles?.is_admin) };
        })
        .filter((emp) => emp.isManager || emp.isAdmin);

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
    const list = currentBranch ? dbDivisions.filter((d) => !d.branch_id || d.branch_id === currentBranch.id) : dbDivisions;
    return Array.from(new Set(list.map((d) => d.name)));
  }, [dbDivisions, currentBranch]);

  const departments = useMemo(() => {
    const list = currentBranch ? dbDepartments.filter((d) => !d.branch_id || d.branch_id === currentBranch.id) : dbDepartments;
    return list.length > 0 ? Array.from(new Set(list.map((d) => d.name))) : DEPARTMENTS;
  }, [dbDepartments, currentBranch]);

  const positions = useMemo(() => {
    const list = currentBranch ? dbPositions.filter((p) => !p.branch_id || p.branch_id === currentBranch.id) : dbPositions;
    return list.length > 0 ? Array.from(new Set(list.map((p) => p.name))) : SEED_POSITIONS;
  }, [dbPositions, currentBranch]);

  const employeeTypes = useMemo(() => {
    const list = currentBranch ? dbEmployeeTypes.filter((t) => !t.branch_id || t.branch_id === currentBranch.id) : dbEmployeeTypes;
    return list.length > 0 ? Array.from(new Set(list.map((t) => t.name))) : ["Full-Time", "Part-Time", "Probationary", "Internship", "Casual"];
  }, [dbEmployeeTypes, currentBranch]);

  const contractTypes = useMemo(() => {
    const list = currentBranch ? dbContractTypes.filter((c) => !c.branch_id || c.branch_id === currentBranch.id) : dbContractTypes;
    return list.length > 0 ? Array.from(new Set(list.map((c) => c.name))) : ["1-YEAR FDC", "2-YEAR FDC", "3-YEAR FDC", "PERMANENT (UDC)", "PROBATION", "Internship"];
  }, [dbContractTypes, currentBranch]);

  const buManagers = useMemo(() => {
    const selectedBranchId = currentBranch?.id || form.branch_id;
    if (!selectedBranchId) return dbEmployees;
    return dbEmployees.filter((e) => e.branch_id === selectedBranchId || e.branches?.id === selectedBranchId);
  }, [dbEmployees, currentBranch, form.branch_id]);

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
