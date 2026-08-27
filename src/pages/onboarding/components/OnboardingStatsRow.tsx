import { memo } from "react";

interface OnboardingStatsRowProps {
  totalActive: number;
  pendingApproval: number;
  inDocStage: number;
  completed: number;
  statusFilter: string;
  stageFilter: string;
  onFilterStatus: (s: string) => void;
  onFilterStage: (s: string) => void;
}

export const OnboardingStatsRow = memo(function OnboardingStatsRow({
  totalActive,
  pendingApproval,
  inDocStage,
  completed,
  statusFilter,
  stageFilter,
  onFilterStatus,
  onFilterStage,
}: OnboardingStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      {/* Active Journeys */}
      <div
        onClick={() => {
          onFilterStatus("all");
          onFilterStage("all");
        }}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          statusFilter === "all" && stageFilter === "all"
            ? "border-[#253C7D] ring-2 ring-[#253C7D]/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">
            Active Journeys
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-user-follow-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{totalActive}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">In progress & pending</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Pending Approval */}
      <div
        onClick={() => {
          onFilterStatus("pending");
          onFilterStage("all");
        }}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          statusFilter === "pending"
            ? "border-amber-500 ring-2 ring-amber-500/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Pending Approval
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-time-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{pendingApproval}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Requires manager sign-off</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Document Phase */}
      <div
        onClick={() => {
          onFilterStatus("approved");
          onFilterStage("document");
        }}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          stageFilter === "document"
            ? "border-sky-600 ring-2 ring-sky-600/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
            Step 1: Document Phase
          </span>
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <i className="ri-file-list-3-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-sky-700 mt-2">{inDocStage}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Contract & forms collection</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
      </div>

      {/* Completed Journeys */}
      <div
        onClick={() => {
          onFilterStatus("completed");
          onFilterStage("all");
        }}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          statusFilter === "completed"
            ? "border-emerald-600 ring-2 ring-emerald-600/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Completed Onboarding
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{completed}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Graduated to active status</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>
    </div>
  );
});
