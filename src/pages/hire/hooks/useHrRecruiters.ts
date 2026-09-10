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
          const eligible = data.filter((emp) => {
            if (emp.branch_id && hrBranchIds.has(emp.branch_id)) return true;
            const dept = (emp.department || "").toLowerCase();
            if (/^(hr|human\s*resources?|recruitment|talent|people)$/i.test(dept) || /hr\s*division/i.test(dept)) {
              return true;
            }
            const role = (emp.role || "").toLowerCase();
            if (/(^|\b)(hr|recruiter|recruitment|talent|human\s*resources?)(\b|$)/i.test(role)) {
              return true;
            }
            return false;
          });

          // Sort HR Division branch members first, then HR roles
          eligible.sort((a, b) => {
            const aInHrBranch = a.branch_id && hrBranchIds.has(a.branch_id) ? 1 : 0;
            const bInHrBranch = b.branch_id && hrBranchIds.has(b.branch_id) ? 1 : 0;
            if (bInHrBranch !== aInHrBranch) return bInHrBranch - aInHrBranch;

            const aIsHrRole = /hr|recruiter/i.test(a.role || "") ? 1 : 0;
            const bIsHrRole = /hr|recruiter/i.test(b.role || "") ? 1 : 0;
            if (bIsHrRole !== aIsHrRole) return bIsHrRole - aIsHrRole;

            return (a.first_name || "").localeCompare(b.first_name || "");
          });

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
