import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { AuditLog } from "../types";

interface UseAuditLogsProps {
  moduleFilter: string;
  actionFilter: string;
  dateFrom: string;
  dateTo: string;
}

export function useAuditLogs({
  moduleFilter,
  actionFilter,
  dateFrom,
  dateTo,
}: UseAuditLogsProps) {
  const { targetBranch, isPartnerBranchBlocked, userBranchName, userBranchId } = useBranchScope();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let q = supabase
      .from("audit_logs")
      .select("*")
      .eq("branch_id", targetBranch)
      .order("created_at", { ascending: false })
      .limit(200);

    if (moduleFilter !== "all") q = q.eq("module", moduleFilter);
    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
    const { data } = await q;
    setLogs(data || []);
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch, moduleFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (isPartnerBranchBlocked || !targetBranch) return;

    const channel = supabase
      .channel("audit-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, (payload) => {
        const newLog = payload.new as AuditLog;
        if (newLog.branch_id === targetBranch) {
          setLogs((prev) => [newLog, ...prev]);
          setNewCount((c) => c + 1);
          setTimeout(() => setNewCount((c) => Math.max(0, c - 1)), 5000);
        }
      })
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isPartnerBranchBlocked, targetBranch]);

  return {
    logs,
    loading,
    isLive,
    newCount,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    fetchLogs,
  };
}
