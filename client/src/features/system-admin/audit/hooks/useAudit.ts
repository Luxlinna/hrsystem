import { useBranchScope } from "@/context/BranchContext";
import { useAuditLogs } from "./useAuditLogs";
import { useAuditFilters } from "./useAuditFilters";

export function useAudit() {
  const { branches } = useBranchScope();
  const logsData = useAuditLogs();
  const filters = useAuditFilters(logsData.logs, branches);

  return {
    logsData,
    filters,
  };
}
