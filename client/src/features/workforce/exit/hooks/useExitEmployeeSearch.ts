import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { compareBiometricIds } from "@/lib/biometricUtils";
import type { ExitEmployee } from "../types";

export function useExitEmployeeSearch() {
  const [results, setResults] = useState<ExitEmployee[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(
    async (q: string = "") => {
      setSearching(true);

      const { data, error } = await supabase
        .from("employees")
        .select(
          "id, first_name, last_name, kh_name, role, department, avatar_url, branch_id, biometric_user_id, employee_code, contract_type, start_date, join_date, contract_effective_date, status, branches(id, name)"
        )
        .is("deleted_at", null)
        .order("first_name", { ascending: true })
        .limit(2000);

      if (!error && data) {
        let emps = (data as any[]).map((x) => ({
          ...x,
          branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null,
        })) as ExitEmployee[];

        const term = q.trim();
        if (term) {
          const cleanTerm = term.toLowerCase();
          emps = emps.filter((e) => {
            const fullName = `${e.last_name || ""} ${e.first_name || ""}`.toLowerCase();
            const khName = (e.kh_name || "").toLowerCase();
            const rawBio = (e.biometric_user_id || "").toLowerCase();
            const rawCode = (e.employee_code || "").toLowerCase();
            const cleanDigits = cleanTerm.replace(/^(id\s*[:#\-]?|#)/i, "").trim();
            const buName = (e.branches?.name || "").toLowerCase();
            const roleName = (e.role || "").toLowerCase();
            const deptName = (e.department || "").toLowerCase();
            return (
              fullName.includes(cleanTerm) ||
              khName.includes(cleanTerm) ||
              rawBio.includes(cleanDigits) ||
              rawCode.includes(cleanDigits) ||
              rawBio === cleanDigits.padStart(3, "0") ||
              buName.includes(cleanTerm) ||
              roleName.includes(cleanTerm) ||
              deptName.includes(cleanTerm)
            );
          });
        }

        emps.sort((a, b) => {
          const idComp = compareBiometricIds(a.biometric_user_id, b.biometric_user_id);
          if (idComp !== 0) return idComp;
          return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
        });

        setResults(emps);
      } else {
        setResults([]);
      }
      setSearching(false);
    },
    []
  );

  const clear = useCallback(() => setResults([]), []);

  return {
    results,
    searching,
    search,
    clear,
  };
}
