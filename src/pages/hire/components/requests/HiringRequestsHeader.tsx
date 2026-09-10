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
    <div className="bg-[#1B2B5A] bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#1e293b] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wide uppercase text-blue-100 border border-white/10">
              Pipeline: Request → CEO/Director Endorsement → HR Manager Review → HR Admin Director Approval → Chairwoman Authorization (Go Live)
            </span>
            {isChairman && (
              <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 rounded-full text-[11px] font-bold">
                Chairwoman Oversight View
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Recruitment & Hiring Requisitions
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed font-medium">
            Enterprise Governance: Requisition requested by Manager, endorsed by CEO/Director, reviewed by HR Manager, approved by HR Admin Director, and authorized by Chairwoman to go live.
          </p>
        </div>

        {canRequest && (
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-[#172554] hover:bg-blue-50 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer shrink-0"
          >
            <i className="ri-user-add-line text-lg" />
            Request New Employee
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/15 relative">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
          <p className="text-[10px] text-amber-200 font-bold uppercase tracking-wider">CEO/Director</p>
          <p className="text-xl font-black text-amber-300 mt-1">{stats.pendingBranch}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
          <p className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">HR Manager</p>
          <p className="text-xl font-black text-sky-300 mt-1">{stats.pendingHr}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
          <p className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">HR Admin Director</p>
          <p className="text-xl font-black text-purple-300 mt-1">{stats.pendingHrAdmin}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
          <p className="text-[10px] text-orange-200 font-bold uppercase tracking-wider">Chairwoman</p>
          <p className="text-xl font-black text-orange-300 mt-1">{stats.pendingChairman}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
          <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Live Active Jobs</p>
          <p className="text-xl font-black text-emerald-300 mt-1">{stats.approved}</p>
        </div>
      </div>
    </div>
  );
});
