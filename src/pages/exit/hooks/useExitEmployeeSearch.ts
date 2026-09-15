import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ExitEmployee } from "../types";

export function useExitEmployeeSearch(branchId: string | null) {
  const [results, setResults] = useState<ExitEmployee[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(
    async (q: string = "") => {
      if (!branchId) {
        setResults([]);
        return;
      }
      setSearching(true);

      let query = supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, avatar_url, branch_id, branches(id, name)")
        .eq("status", "active")
        .eq("branch_id", branchId)
        .is("deleted_at", null)
        .order("first_name", { ascending: true })
        .limit(50);

      const term = q.trim();
      if (term) {
        query = query.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,id.ilike.${term}%,role.ilike.%${term}%,department.ilike.%${term}%`
        );
      }

      const { data, error } = await query;
      if (!error && data) {
        setResults(data as unknown as ExitEmployee[]);
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
