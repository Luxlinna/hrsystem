import { memo } from "react";

interface Stats {
  total: number;
  pendingBranch: number;
  pendingHr: number;
  pendingHrAdmin: number;
  pendingChairman: number;
  approved: number;
}

interface Props {
  isChairman: boolean;
  canRequest: boolean;
  onOpenCreate: () => void;
  stats?: Stats;
}

export const HiringRequestsHeader = memo(function HiringRequestsHeader({
  isChairman,
  canRequest,
  onOpenCreate,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold tracking-wide uppercase text-[#253C7D] bg-[#253C7D]/10 px-2.5 py-0.5 rounded-md">
            Pipeline: Request → CEO Endorsement → HR Review → HR Director → Chairwoman (Go Live)
          </span>
          {isChairman && (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
              Chairwoman View
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold tracking-tight text-gray-900">
          Recruitment &amp; Hiring Requisitions
        </h2>
        <p className="text-xs text-gray-500 max-w-xl leading-snug">
          Multi-stage enterprise requisition approval workflow from BU request to live job posting.
        </p>
      </div>

      {canRequest && (
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#253C7D] text-white hover:bg-[#1E3064] font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-center"
        >
          <i className="ri-user-add-line text-sm" />
          <span>Request New Employee</span>
        </button>
      )}
    </div>
  );
});
