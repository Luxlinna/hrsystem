import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ModalManagerEmployee, EditHiringFormData } from "./types";

export function useHiringModalData(isOpen: boolean, formData: EditHiringFormData) {
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
            emp.first_name.toLowerCase() === "chem" ||
            emp.first_name.toLowerCase() === "hrm" ||
            (emp.first_name.toLowerCase() === "sophat" && (emp.last_name || "").toLowerCase() === "it");

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
        .filter((e) => !e.first_name.toLowerCase().includes("chem") && e.realRole.toLowerCase() !== "new hire" && !e.realRole.toLowerCase().includes("super admin"));

      setDbEmployees(enriched);
    });
  }, [isOpen]);

  const getBranchCode = useCallback((name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("head office") || lower.includes("corporate")) return "BU-HQ";
    if (lower.includes("hr")) return "BU-HR";
    if (lower.includes("ops")) return "BU-OPS";
    if (lower.includes("pinex")) return "BU-PINEX";
    const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return `BU-${clean.slice(0, 5)}`;
  }, []);

  const cleanBranches = useMemo(() => {
    const seen = new Set<string>();
    return dbBranches.filter((b) => {
      if (!b.name || b.name.toLowerCase().startsWith("site:")) return false;
      const key = b.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dbBranches]);

  const currentBranch = useMemo(() => {
    if (!formData.bu_full_name && !formData.code_bu) return null;
    return (
      cleanBranches.find(
        (b) =>
          (formData.bu_full_name &&
            b.name.toLowerCase() === formData.bu_full_name.trim().toLowerCase()) ||
          (formData.code_bu &&
            getBranchCode(b.name).toUpperCase() === formData.code_bu.trim().toUpperCase())
      ) || null
    );
  }, [cleanBranches, formData.bu_full_name, formData.code_bu, getBranchCode]);

  const currentBranchName = currentBranch?.name || formData.bu_full_name || "Main Branch";

  const workSites = useMemo(() => {
    if (!currentBranch) return [];
    return dbWorkLocations.filter((wl) => wl.branch_id === currentBranch.id);
  }, [currentBranch, dbWorkLocations]);

  const matchedSubSite = useMemo(() => {
    if (!formData.site || workSites.length === 0) return null;
    return (
      workSites.find(
        (s) =>
          s.id === formData.site ||
          s.name.toLowerCase() === formData.site.trim().toLowerCase() ||
          formData.site.toLowerCase().includes(s.name.trim().toLowerCase())
      ) || null
    );
  }, [formData.site, workSites]);

  const currentSiteSelectValue = matchedSubSite ? matchedSubSite.id : "";

  const normalizeText = (text: string | null | undefined) => {
    if (!text) return "";
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const isEmployeeInCurrentBu = useCallback(
    (emp: ModalManagerEmployee) => {
      const candBuName = normalizeText(formData.bu_full_name);
      const candBuCode = normalizeText(formData.code_bu);
      if (!candBuName && !candBuCode) return true;

      const empBranch = dbBranches.find((b) => b.id === emp.branch_id);
      const empBranchName = normalizeText(empBranch?.name);
      const empBuFull = normalizeText(emp.bu_full_name);
      const empBuCode = normalizeText(emp.code_bu);

      if (candBuName && empBranchName && (empBranchName.includes(candBuName) || candBuName.includes(empBranchName))) return true;
      if (candBuName && empBuFull && (empBuFull.includes(candBuName) || candBuName.includes(empBuFull))) return true;
      if (candBuCode && empBuCode && (empBuCode.includes(candBuCode) || candBuCode.includes(empBuCode))) return true;

      return false;
    },
    [formData.bu_full_name, formData.code_bu, dbBranches]
  );

  const buEmployees = useMemo(() => {
    const list = dbEmployees.filter(isEmployeeInCurrentBu);
    const seen = new Set<string>();
    return list.filter((e) => {
      const key = `${normalizeText(e.first_name)}_${normalizeText(e.last_name)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dbEmployees, isEmployeeInCurrentBu]);

  const buManagers = useMemo(() => {
    const seen = new Set<string>();
    return buEmployees.filter((e) => {
      const r = e.realRole.toLowerCase();
      if (!r.includes("manager")) return false;
      const key = `${e.first_name.trim().toLowerCase()}_${(e.last_name || "").trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [buEmployees]);

  const buCeos = useMemo(() => {
    const seen = new Set<string>();
    return buEmployees.filter((e) => {
      const r = e.realRole.toLowerCase();
      if (!r.includes("ceo")) return false;
      if (buManagers.some((m) => m.id === e.id)) return false;
      const key = `${e.first_name.trim().toLowerCase()}_${(e.last_name || "").trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [buEmployees, buManagers]);

  return {
    dbBranches,
    dbWorkLocations,
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
