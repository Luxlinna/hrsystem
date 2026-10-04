import { useState } from "react";
import { useAuditLogs } from "./useAuditLogs";
import { useAuditFilters } from "./useAuditFilters";

export function useAudit() {
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const logsData = useAuditLogs({
    moduleFilter,
    actionFilter,
    dateFrom,
    dateTo,
  });

  const filters = useAuditFilters(logsData.logs);

  return {
    logsData,
    filters,
    moduleFilter,
    setModuleFilter,
    actionFilter,
    setActionFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
  };
}
