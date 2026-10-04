import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ReportConfig, ReportRow } from "../types";
import {
  REPORT_FETCHERS,
  REPORT_REALTIME_TABLES,
} from "../fetchers";
export function useReportViewerData(config: ReportConfig, onDataReady: (rows: ReportRow[], cols: string[]) => void) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, string | number>>({});

  const fetchModule = useCallback(async () => {
    const fetchFn = REPORT_FETCHERS[config.module];
    if (!fetchFn) return;
    const result = await fetchFn(config);
    setRows(result.rows);
    setColumns(result.columns);
    setSummary(result.summary);
    onDataReady(result.rows, result.columns);
  }, [config, onDataReady]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const run = async () => {
      const fetchFn = REPORT_FETCHERS[config.module];
      if (!fetchFn) return;
      const result = await fetchFn(config);
      if (cancelled) return;
      setRows(result.rows);
      setColumns(result.columns);
      setSummary(result.summary);
      onDataReady(result.rows, result.columns);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [config, onDataReady]);

  // Real-time live synchronization: re-fetches automatically when records change
  useEffect(() => {
    const target = REPORT_REALTIME_TABLES[config.module];
    if (!target) return;

    const tables = Array.isArray(target) ? target : [target];
    const channels = tables.map((tbl) => {
      return supabase
        .channel(`report_realtime_${config.module}_${tbl}`)
        .on("postgres_changes", { event: "*", schema: "public", table: tbl }, () => {
          fetchModule();
        })
        .subscribe();
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [config.module, fetchModule]);

  return { rows, columns, loading, summary, reload: fetchModule };
}
