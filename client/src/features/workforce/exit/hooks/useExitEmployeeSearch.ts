import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ExitEmployee } from "../types";

export function useExitEmployeeSearch(branchId: string | null) {
  const [results, setResults] = useState<ExitEmployee[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(
    async (q: string = "", overrideBranchId?: string | null) => {
      const activeBranch = overrideBranchId !== undefined ? overrideBranchId : branchId;
      setSearching(true);

      let query = supabase
        .from("employees")
        .select(
          "id, first_name, last_name, kh_name, role, department, avatar_url, branch_id, biometric_user_id, employee_code, contract_type, status, branches(id, name)"
        )
        .is("deleted_at", null)
        .order("first_name", { ascending: true })
        .limit(100);

      if (activeBranch) {
        query = query.eq("branch_id", activeBranch);
      }

      const { data, error } = await query;
      if (!error && data) {
        let emps = (data as unknown as ExitEmployee[]);
        const term = q.trim();
        if (term) {
          const cleanTerm = term.toLowerCase();
          emps = emps.filter((e) => {
            const fullName = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
            const khName = (e.kh_name || "").toLowerCase();
            const rawBio = (e.biometric_user_id || "").toLowerCase();
            const rawCode = (e.employee_code || "").toLowerCase();
            const cleanDigits = cleanTerm.replace(/^(id\s*[:#\-]?|#)/i, "").trim();
            return (
              fullName.includes(cleanTerm) ||
              khName.includes(cleanTerm) ||
              rawBio.includes(cleanDigits) ||
              rawCode.includes(cleanDigits) ||
              rawBio === cleanDigits.padStart(3, "0")
            );
          });
        }
        emps.sort((a, b) => {
          return (a.biometric_user_id || "").localeCompare(b.biometric_user_id || "", undefined, { numeric: true });
        });
        setResults(emps);
      } else {
        setResults([]);
      }
      setSearching(false);
    },
    [branchId]
  );

  const clear = useCallback(() => setResults([]), []);

  return {
    results,
    searching,
    search,
    clear,
  };
}
