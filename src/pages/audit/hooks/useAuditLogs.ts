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
  const { isSuperAdmin, targetBranch, isPartnerBranchBlocked, userBranchName, userBranchId } = useBranchScope();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    if (isPartnerBranchBlocked) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let q = supabase
      .from("audit_logs")
      .select("*, branches(id, name)")
      .order("created_at", { ascending: false })
      .limit(300);

    // Filter by branch if a specific branch is selected or user is branch-scoped
    if (targetBranch) {
      q = q.eq("branch_id", targetBranch);
    } else if (!isSuperAdmin && userBranchId) {
      q = q.eq("branch_id", userBranchId);
    }

    if (moduleFilter !== "all") q = q.eq("module", moduleFilter);
    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
    const { data, error } = await q;
    if (error) console.error("Failed to fetch audit logs:", error);
    setLogs((data as unknown as AuditLog[]) || []);
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch, isSuperAdmin, userBranchId, moduleFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (isPartnerBranchBlocked) return;

    const channel = supabase
      .channel("audit-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, async (payload) => {
        const newLogRaw = payload.new as AuditLog;
        const effectiveBranch = targetBranch || (!isSuperAdmin ? userBranchId : null);
        if (!effectiveBranch || newLogRaw.branch_id === effectiveBranch) {
          let branchName: string | undefined;
          if (newLogRaw.branch_id) {
            const { data: b } = await supabase
              .from("branches")
              .select("name")
              .eq("id", newLogRaw.branch_id)
              .maybeSingle();
            branchName = b?.name;
          }
          const newLog: AuditLog = {
            ...newLogRaw,
            branches: branchName ? { id: newLogRaw.branch_id!, name: branchName } : null,
          };
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
  }, [isPartnerBranchBlocked, targetBranch, isSuperAdmin, userBranchId]);

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
