import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ModalManagerEmployee } from "./types";
import type { EmployeeFormState } from "../../types";

export function useAddEmployeeModalData(isOpen: boolean, form: EmployeeFormState) {
  const [dbBranches, setDbBranches] = useState<
    Array<{ id: string; name: string; location: string | null }>
  >([]);
  const [dbWorkLocations, setDbWorkLocations] = useState<
    Array<{ id: string; name: string; description: string | null; branch_id: string | null }>
  >([]);
  const [dbEmployees, setDbEmployees] = useState<ModalManagerEmployee[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      supabase.from("branches").select("id, name, location").is("deleted_at", null).order("name"),
      supabase.from("work_locations").select("id, name, description, branch_id").is("deleted_at", null).order("name"),
      supabase.from("employees").select("id, first_name, last_name, email, phone, department, role, position, branch_id, bu_full_name, code_bu").is("deleted_at", null).order("first_name"),
      supabase.from("user_role_assignments").select("id, user_id, email, display_name, role_id, deleted_at, app_roles(id, name, is_admin, branch_id)").is("deleted_at", null),
    ]).then(([bRes, wRes, eRes, uRes]) => {
      if (bRes.data) setDbBranches(bRes.data);
      if (wRes.data) setDbWorkLocations(wRes.data);

      const rawEmployees = eRes.data || [];
      const assignments = (uRes.data || []) as any[];

      const enriched: ModalManagerEmployee[] = rawEmployees
        .map((emp) => {
          let matchedAssignment: any = null;
          const empEmail = emp.email?.toLowerCase().trim();
          if (empEmail) {
            matchedAssignment = assignments.find(
              (a) => a.email && a.email.toLowerCase().trim() === empEmail
            );
          }
          if (!matchedAssignment && emp.phone) {
            const empPhoneDigits = emp.phone.replace(/\D/g, "");
            if (empPhoneDigits.length >= 6) {
              matchedAssignment = assignments.find((a) => {
                if (!a.email) return false;
                const aDigits = a.email.split("@")[0].replace(/\D/g, "");
                return (
                  aDigits === empPhoneDigits ||
                  (empPhoneDigits.startsWith("0") && aDigits === "855" + empPhoneDigits.slice(1)) ||
                  (empPhoneDigits.startsWith("855") && aDigits === "0" + empPhoneDigits.slice(3))
                );
              });
            }
          }
          if (!matchedAssignment) {
            const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim().toLowerCase();
            matchedAssignment = assignments.find(
              (a) => a.display_name && a.display_name.trim().toLowerCase() === fullName
            );
          }

          const assignedRoleName = matchedAssignment?.app_roles?.name || null;
          const realRole = assignedRoleName || emp.position || emp.role || "Staff";
          const lowerRole = realRole.toLowerCase();
          const isSuperAdmin = lowerRole.includes("super admin") || lowerRole === "super admin";

          const isExcluded =
            isSuperAdmin ||
            lowerRole === "new hire" ||
            lowerRole.includes("worker") ||
            lowerRole.includes("operator") ||
            lowerRole.includes("helper") ||
            emp.first_name?.toLowerCase() === "chem" ||
            emp.first_name?.toLowerCase() === "hrm" ||
            (emp.first_name?.toLowerCase() === "sophat" && (emp.last_name || "").toLowerCase() === "it");

          const isManager =
            !isExcluded &&
            !isSuperAdmin &&
            (Boolean(matchedAssignment?.app_roles?.is_admin) ||
              lowerRole.includes("manager") ||
              lowerRole.includes("lead") ||
              lowerRole.includes("director") ||
              lowerRole.includes("head") ||
              lowerRole.includes("supervisor") ||
              lowerRole.includes("ceo") ||
              lowerRole.includes("admin") ||
              lowerRole.includes("officer") ||
              lowerRole.includes("chair") ||
              lowerRole.includes("chief"));

          const isAdmin =
            !isSuperAdmin &&
            (Boolean(matchedAssignment?.app_roles?.is_admin) ||
              lowerRole.includes("admin") ||
              lowerRole.includes("ceo") ||
              lowerRole.includes("chair"));

          return {
            ...emp,
            realRole,
            isManager,
            isAdmin,
          };
        })
        .filter((emp) => emp.isManager || emp.isAdmin);

      setDbEmployees(enriched);
    });
  }, [isOpen]);

  const cleanBranches = useMemo(() => {
    return dbBranches.filter(
      (b) =>
        !b.name.toLowerCase().startsWith("site:") &&
        !b.id.startsWith("site:") &&
        !b.name.toLowerCase().includes("(site)")
    );
  }, [dbBranches]);

  const getBranchCode = useCallback((branchName: string): string => {
    const lower = (branchName || "").toLowerCase().trim();
    if (lower.includes("express") || lower.includes("exp")) return "EXP";
    if (lower.includes("logistics") || lower.includes("log")) return "LOG";
    if (lower.includes("tech") || lower.includes("technology")) return "TEC";
    if (lower.includes("retail") || lower.includes("mart") || lower.includes("store")) return "RET";
    if (lower.includes("finance") || lower.includes("capital")) return "FIN";
    if (lower.includes("cambodia") || lower.includes("kh")) return "KHM";
    if (lower.includes("headquarter") || lower.includes("hq") || lower.includes("main")) return "HQ";
    const words = branchName.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0].slice(0, 2) + words[1].slice(0, 1)).toUpperCase();
    }
    return (branchName.slice(0, 3) || "BU").toUpperCase();
  }, []);

  const currentBranch = useMemo(() => {
    if (!form.branch_id && !form.bu_full_name && !form.code_bu) return null;
    return (
      cleanBranches.find((b) => b.id === form.branch_id) ||
      cleanBranches.find((b) => b.name === form.bu_full_name) ||
      cleanBranches.find((b) => getBranchCode(b.name) === form.code_bu) ||
      null
    );
  }, [cleanBranches, form.branch_id, form.bu_full_name, form.code_bu, getBranchCode]);

  const currentBranchName = currentBranch?.name || form.bu_full_name || cleanBranches[0]?.name || "";

  const workSites = useMemo(() => {
    if (!currentBranch) return dbWorkLocations;
    return dbWorkLocations.filter((w) => w.branch_id === currentBranch.id);
  }, [dbWorkLocations, currentBranch]);

  const currentSiteSelectValue = useMemo(() => {
    if (!form.site) return "";
    const matched = workSites.find(
      (w) => w.name.toLowerCase().trim() === form.site.toLowerCase().trim()
    );
    return matched ? matched.id : form.site;
  }, [workSites, form.site]);

  const buManagers = useMemo(() => {
    if (!currentBranch) return dbEmployees;
    const sameBu = dbEmployees.filter(
      (e) =>
        e.branch_id === currentBranch.id ||
        (e.code_bu && form.code_bu && e.code_bu === form.code_bu) ||
        (e.bu_full_name && form.bu_full_name && e.bu_full_name === form.bu_full_name)
    );
    return sameBu.length > 0 ? sameBu : dbEmployees;
  }, [dbEmployees, currentBranch, form.code_bu, form.bu_full_name]);

  const buCeos = useMemo(() => {
    return dbEmployees.filter((e) => {
      const lower = (e.realRole || "").toLowerCase();
      return lower.includes("ceo") || lower.includes("chair") || lower.includes("director") || e.isAdmin;
    });
  }, [dbEmployees]);

  return {
    cleanBranches,
    currentBranch,
    currentBranchName,
    workSites,
    currentSiteSelectValue,
    getBranchCode,
    buManagers,
    buCeos,
  };
}
