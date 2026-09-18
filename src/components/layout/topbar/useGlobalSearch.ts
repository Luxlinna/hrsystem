import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { matchEmployeeSearch } from "@/pages/employees/searchUtils";
import type { SearchResult } from "./types";
import { MODULE_SEARCH_RESULTS, pathToModule } from "./constants";

export function useGlobalSearch(can: (module: string) => boolean) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const runSearch = useCallback(
    async (q: string) => {
      const query = q.trim().toLowerCase();
      if (!query) {
        setSearchResults([]);
        setSearchOpen(false);
        return;
      }
      setSearchLoading(true);

      const cleanQ = query.replace(/^(id\s*[:#\-]?|#)/i, "").trim();
      const tokens = cleanQ.split(/\s+/).filter(Boolean);

      let empQuery = supabase
        .from("employees")
        .select("id, first_name, last_name, kh_name, role, department, status, biometric_user_id, employee_code, branches(name)")
        .is("deleted_at", null);

      if (tokens.length === 1 && !/^\d+$/.test(tokens[0])) {
        const t = tokens[0];
        empQuery = empQuery.or(
          `first_name.ilike.%${t}%,last_name.ilike.%${t}%,kh_name.ilike.%${t}%,role.ilike.%${t}%,department.ilike.%${t}%,biometric_user_id.ilike.%${t}%,employee_code.ilike.%${t}%`
        );
      } else if (/^\d+$/.test(cleanQ)) {
        const padded = cleanQ.padStart(3, "0");
        const rawNum = String(parseInt(cleanQ, 10));
        empQuery = empQuery.or(
          `biometric_user_id.ilike.%${cleanQ}%,biometric_user_id.eq.${padded},biometric_user_id.eq.${rawNum},employee_code.ilike.%${cleanQ}%`
        );
      }
      empQuery = empQuery.limit(40);

      const candQuery = supabase
        .from("candidates")
        .select("id, full_name, email, stage, job_postings(title)")
        .is("deleted_at", null)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(4);

      const [empRes, candRes] = await Promise.all([empQuery, candQuery]);

      const results: SearchResult[] = [];

      const rawEmps = (empRes.data ?? []).map((x: any) => ({
        ...x,
        branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null,
      }));

      const matchedEmps = rawEmps.filter((e: any) => matchEmployeeSearch(e, q)).slice(0, 6);

      matchedEmps.forEach((e: any) => {
        const buName = e.branches?.name || "";
        const staffId = e.biometric_user_id || e.employee_code || "";
        const idPart = staffId ? `ID: ${staffId}` : "";
        const sublabel = [idPart, buName, e.role || "Staff"].filter(Boolean).join(" · ");
        const label = `${e.first_name || ""} ${e.last_name || ""}${e.kh_name ? ` (${e.kh_name})` : ""}`.trim();

        results.push({
          id: `emp-${e.id}`,
          label,
          sublabel,
          icon: "ri-user-line",
          path: `/employees/${e.id}`,
          category: "Employee",
        });
      });

      (candRes.data ?? []).forEach((c: any) => {
        results.push({
          id: `cand-${c.id}`,
          label: c.full_name,
          sublabel: `${c.job_postings?.title ?? "Candidate"} · ${c.stage}`,
          icon: "ri-briefcase-line",
          path: `/hire/candidate/${c.id}`,
          category: "Candidate",
        });
      });

      const matchedModules = MODULE_SEARCH_RESULTS
        .filter(
          (m) =>
            can(pathToModule(m.path)) &&
            (m.label.toLowerCase().includes(query) || m.sublabel.toLowerCase().includes(query))
        )
        .slice(0, 4);
      results.push(...matchedModules);

      setSearchResults(results);
      setSearchOpen(results.length > 0 || query.length >= 1);
      setSearchLoading(false);
    },
    [can]
  );

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      navigate(result.path);
      setSearchQuery("");
      setSearchOpen(false);
    },
    [navigate]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchOpen(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchOpen,
    setSearchOpen,
    searchLoading,
    handleSelectResult,
    clearSearch,
  };
}
