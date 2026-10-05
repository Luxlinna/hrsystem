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
  stats: Stats;
}

export const HiringRequestsHeader = memo(function HiringRequestsHeader({
  isChairman,
  canRequest,
  onOpenCreate,
  stats,
}: Props) {
  return (
    <div className="bg-[#1B2B5A] bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#1e293b] rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-md text-[9.5px] font-semibold tracking-wide uppercase text-blue-100 border border-white/10">
              Pipeline: Request → CEO Endorsement → HR Review → HR Director → Chairwoman (Go Live)
            </span>
            {isChairman && (
              <span className="px-2 py-0.5 bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 rounded-md text-[9.5px] font-bold">
                Chairwoman View
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
            Recruitment & Hiring Requisitions
          </h2>
          <p className="text-[11px] text-blue-100/80 max-w-xl leading-snug font-normal">
            Multi-stage enterprise requisition approval workflow from BU request to live job posting.
          </p>
        </div>

        {canRequest && (
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#172554] hover:bg-blue-50 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer shrink-0 self-start sm:self-center"
          >
            <i className="ri-user-add-line text-sm" />
            <span>Request New Employee</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-white/10 relative">
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10">
          <p className="text-[9px] text-amber-200 font-bold uppercase tracking-wider">CEO / Director</p>
          <p className="text-base font-extrabold text-amber-300 mt-0.5">{stats.pendingBranch}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10">
          <p className="text-[9px] text-sky-200 font-bold uppercase tracking-wider">HR Manager</p>
          <p className="text-base font-extrabold text-sky-300 mt-0.5">{stats.pendingHr}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10">
          <p className="text-[9px] text-purple-200 font-bold uppercase tracking-wider">HR Admin Director</p>
          <p className="text-base font-extrabold text-purple-300 mt-0.5">{stats.pendingHrAdmin}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10">
          <p className="text-[9px] text-orange-200 font-bold uppercase tracking-wider">Chairwoman</p>
          <p className="text-base font-extrabold text-orange-300 mt-0.5">{stats.pendingChairman}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10">
          <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">Live Active Jobs</p>
          <p className="text-base font-extrabold text-emerald-300 mt-0.5">{stats.approved}</p>
        </div>
      </div>
    </div>
  );
});
