import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { EXIT_TYPE_CONFIG, EXIT_TYPE_ORDER, REASON_TYPE_CONFIG, REASON_TYPE_ORDER } from "../constants";

export interface ExitOptionItem {
  id: string;
  name: string;
  code?: string | null;
}

// Fallback options in case table is not populated yet
const DEFAULT_EXIT_TYPES: ExitOptionItem[] = EXIT_TYPE_ORDER.map((key) => ({
  id: key,
  name: EXIT_TYPE_CONFIG[key]?.label || key,
  code: key,
}));

const DEFAULT_REASON_TYPES: ExitOptionItem[] = REASON_TYPE_ORDER.map((key) => ({
  id: key,
  name: REASON_TYPE_CONFIG[key]?.label || key,
}));

export function useExitFormOptions() {
  const [exitTypes, setExitTypes] = useState<ExitOptionItem[]>(DEFAULT_EXIT_TYPES);
  const [reasonTypes, setReasonTypes] = useState<ExitOptionItem[]>(DEFAULT_REASON_TYPES);
  const [loading, setLoading] = useState(true);

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: typesData, error: typesErr },
        { data: reasonsData, error: reasonsErr },
      ] = await Promise.all([
        supabase
          .from("exit_types")
          .select("id, name, code, status, display_order")
          .eq("status", "active")
          .order("display_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("exit_reason_types")
          .select("id, name, status, display_order")
          .eq("status", "active")
          .order("display_order", { ascending: true })
          .order("name", { ascending: true }),
      ]);

      if (typesErr) {
        console.warn("Could not fetch exit_types from database, using defaults:", typesErr);
      } else if (typesData && typesData.length > 0) {
        // Deduplicate by name (in case duplicate rows exist in database)
        const seen = new Set<string>();
        const uniqueTypes: ExitOptionItem[] = [];
        for (const item of typesData) {
          const key = (item.name || "").trim().toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            uniqueTypes.push({ id: item.id, name: item.name, code: item.code });
          }
        }
        if (uniqueTypes.length > 0) {
          setExitTypes(uniqueTypes);
        }
      }

      if (reasonsErr) {
        console.warn("Could not fetch exit_reason_types from database, using defaults:", reasonsErr);
      } else if (reasonsData && reasonsData.length > 0) {
        // Deduplicate by name
        const seen = new Set<string>();
        const uniqueReasons: ExitOptionItem[] = [];
        for (const item of reasonsData) {
          const key = (item.name || "").trim().toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            uniqueReasons.push({ id: item.id, name: item.name });
          }
        }
        if (uniqueReasons.length > 0) {
          setReasonTypes(uniqueReasons);
        }
      }
    } catch (err) {
      console.error("Error loading exit form options:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    exitTypes,
    reasonTypes,
    loading,
    refreshOptions: fetchOptions,
  };
}
