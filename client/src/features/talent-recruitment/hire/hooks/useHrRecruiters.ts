import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import type { Branch } from "../types";

export function useHrRecruiters(branches: Branch[] = []) {
  const [recruiters, setRecruiters] = useState<SearchableEmployee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecruiters() {
      setLoading(true);
      try {
        const hrBranchIds = new Set(
          (branches || [])
            .filter((b) => /hr\s*division|human\s*resource/i.test(b.name))
            .map((b) => b.id)
        );

        // Fetch enterprise employees to identify HR division & HR role staff
        const { data, error } = await supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url, branch_id")
          .is("deleted_at", null)
          .order("first_name");

        if (error) {
          console.error("useHrRecruiters query error:", error);
          return;
        }

        if (data && !cancelled) {
          const eligible = data.filter((emp: any) => {
            const empBranchName = emp.branches?.name || "";
            const isHrDivision =
              (emp.branch_id && hrBranchIds.has(emp.branch_id)) ||
              /hr\s*division|human\s*resource/i.test(empBranchName) ||
              /hr\s*division/i.test(emp.department || "");

            const isHrPosition =
              /(^|\b)(hr|recruiter|recruitment|talent|people|talent\s*acquisition)(\b|$)/i.test(emp.role || "") ||
              /hr\s*(officer|specialist|manager|executive|generalist|director|lead|coordinator|admin)/i.test(emp.role || "");

            // Employee must belong to HR Division AND hold an HR position
            return isHrDivision && isHrPosition;
          });

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
  }, [branches]);

  return { recruiters, loading };
}
