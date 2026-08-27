import { memo } from "react";
import type { PayrollRun, PayrollApproval } from "../../types";
import { PayrollRunCard } from "./PayrollRunCard";

interface PayrollRunsListViewProps {
  runs: PayrollRun[];
  getRunApprovals: (runId: string) => PayrollApproval[];
  canManage: boolean;
  processingId: string | null;
  onApprove: (run: PayrollRun) => void;
  onReject: (run: PayrollRun) => void;
  onProcess: (run: PayrollRun) => void;
  onViewBatch: (run: PayrollRun) => void;
  emptyTitle: string;
  emptyDescription: string;
}

export const PayrollRunsListView = memo(function PayrollRunsListView({
  runs,
  getRunApprovals,
  canManage,
  processingId,
  onApprove,
  onReject,
  onProcess,
  onViewBatch,
  emptyTitle,
  emptyDescription,
}: PayrollRunsListViewProps) {
  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-file-search-line" />
        </div>
        <p className="font-extrabold text-sm text-gray-800">{emptyTitle}</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {runs.map((run) => (
        <PayrollRunCard
          key={run.id}
          run={run}
          approvals={getRunApprovals(run.id)}
          canManage={canManage}
          processingId={processingId}
          onApprove={onApprove}
          onReject={onReject}
          onProcess={onProcess}
          onViewBatch={onViewBatch}
        />
      ))}
    </div>
  );
});
