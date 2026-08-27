import { useMemo } from "react";
import type { PayrollRun, EmployeeItemRecord } from "../types";

export function usePayrollApprovalCalculations(
  runs: PayrollRun[],
  itemizedRecords: EmployeeItemRecord[]
) {
  const pendingRuns = useMemo(
    () => runs.filter((r) => r.status === "pending_approval"),
    [runs]
  );
  const approvedRuns = useMemo(
    () => runs.filter((r) => r.status === "approved"),
    [runs]
  );
  const processedRuns = useMemo(
    () => runs.filter((r) => r.status === "processed"),
    [runs]
  );
  const historyRuns = useMemo(
    () => runs.filter((r) => r.status !== "pending_approval" && r.status !== "draft"),
    [runs]
  );

  const periods = useMemo(() => {
    const set = new Set<string>();
    runs.forEach((r) => r.period && set.add(r.period));
    itemizedRecords.forEach((r) => r.month && set.add(r.month));
    return ["all", ...Array.from(set).sort().reverse()];
  }, [runs, itemizedRecords]);

  const totalPendingNet = useMemo(
    () => pendingRuns.reduce((s, r) => s + Number(r.total_net || 0), 0),
    [pendingRuns]
  );
  const totalApprovedNet = useMemo(
    () => approvedRuns.reduce((s, r) => s + Number(r.total_net || 0), 0),
    [approvedRuns]
  );
  const totalProcessedNet = useMemo(
    () => processedRuns.reduce((s, r) => s + Number(r.total_net || 0), 0),
    [processedRuns]
  );

  return {
    pendingRuns,
    approvedRuns,
    processedRuns,
    historyRuns,
    periods,
    totalPendingNet,
    totalApprovedNet,
    totalProcessedNet,
  };
}
