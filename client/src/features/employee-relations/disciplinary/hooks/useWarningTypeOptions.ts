import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_WARNING_TYPES = [
  "Instruction",
  "Verbal",
  "First Written",
  "Second Written",
  "Final Warning",
  "Notice",
  "Suspense",
];

export function useWarningTypeOptions() {
  const [options, setOptions] = useState<string[]>(DEFAULT_WARNING_TYPES);
  const [loading, setLoading] = useState(true);

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("warning_types")
        .select("id, name, status, display_order")
        .eq("status", "active")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.warn("Could not load warning_types from database, using defaults:", error);
      } else if (data && data.length > 0) {
        const seen = new Set<string>();
        const uniqueNames: string[] = [];
        for (const row of data) {
          const trimmed = (row.name || "").trim();
          const key = trimmed.toLowerCase();
          if (trimmed && !seen.has(key)) {
            seen.add(key);
            uniqueNames.push(trimmed);
          }
        }
        if (uniqueNames.length > 0) {
          setOptions(uniqueNames);
        }
      }
    } catch (err) {
      console.error("Error fetching warning type options:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    refreshOptions: fetchOptions,
  };
}
