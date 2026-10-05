import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import type { Branch } from "../types";

export const HR_ADMIN_DIVISION_REGEX =
  /(^|\b)(hr|human\s*resources?|people|talent)(\b|$)|hr\s*(&|and|\/|\+)\s*admin|admin\s*(&|and|\/|\+)\s*hr/i;

export const HR_POSITION_REGEX =
  /(^|\b)(hr|recruiter|recruitment|talent|people|talent\s*acquisition)(\b|$)|hr\s*(&|and|\/|\+)?\s*(officer|specialist|manager|executive|generalist|director|lead|coordinator|admin|assistant|supervisor|staff|intern|partner|consultant)/i;

export function isEmployeeHrRecruiter(
  emp: {
    branch_id?: string | null;
    branch_name?: string | null;
    department?: string | null;
    role?: string | null;
    branches?: { name?: string } | { name?: string }[] | null;
  },
  branches: Branch[] = [],
  hrBranchIds?: Set<string>
): boolean {
  const ids =
    hrBranchIds ||
    new Set(
      (branches || [])
        .filter((b) => HR_ADMIN_DIVISION_REGEX.test(b.name))
        .map((b) => b.id)
    );

  const empBranchName =
    emp.branch_name ||
    branches.find((b) => b.id === emp.branch_id)?.name ||
    (Array.isArray(emp.branches) ? emp.branches[0]?.name : (emp.branches as any)?.name) ||
    "";

  const isHrDivision =
    Boolean(emp.branch_id && ids.has(emp.branch_id)) ||
    HR_ADMIN_DIVISION_REGEX.test(empBranchName) ||
    HR_ADMIN_DIVISION_REGEX.test(emp.department || "");

  const isHrPosition = HR_POSITION_REGEX.test(emp.role || "");

  // Must belong to HR Division AND hold an HR position in that division
  return isHrDivision && isHrPosition;
}

export function useHrRecruiters(branches: Branch[] = [], fallbackEmployees: SearchableEmployee[] = []) {
  const [recruiters, setRecruiters] = useState<SearchableEmployee[]>(() => {
    if (fallbackEmployees.length > 0) {
      return fallbackEmployees
        .filter((emp) => isEmployeeHrRecruiter(emp, branches))
        .sort((a, b) => (a.first_name || "").localeCompare(b.first_name || ""));
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecruiters() {
      setLoading(true);
      try {
        const hrBranchIds = new Set(
          (branches || [])
            .filter((b) => HR_ADMIN_DIVISION_REGEX.test(b.name))
            .map((b) => b.id)
        );

        // Fetch enterprise employees to identify HR and Admin division & HR role staff
        const { data, error } = await supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name)")
          .is("deleted_at", null)
          .order("first_name");

        if (error) {
          console.error("useHrRecruiters query error:", error);
          if (fallbackEmployees.length > 0 && !cancelled) {
            const eligible = fallbackEmployees
              .filter((emp) => isEmployeeHrRecruiter(emp, branches, hrBranchIds))
              .sort((a, b) => (a.first_name || "").localeCompare(b.first_name || ""));
            setRecruiters(eligible);
          }
          return;
        }

        if (data && !cancelled) {
          const allPool: SearchableEmployee[] = [...(data as any[])];
          for (const fe of fallbackEmployees) {
            if (!allPool.some((p) => p.id === fe.id)) {
              allPool.push(fe);
            }
          }

          const eligible = allPool.filter((emp) => isEmployeeHrRecruiter(emp, branches, hrBranchIds));

          // Sort alphabetically by first name
          eligible.sort((a, b) => (a.first_name || "").localeCompare(b.first_name || ""));
          setRecruiters(eligible);
        }
      } catch (err) {
        console.error("useHrRecruiters error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRecruiters();

    return () => {
      cancelled = true;
    };
  }, [branches, fallbackEmployees]);

  return { recruiters, loading };
}
