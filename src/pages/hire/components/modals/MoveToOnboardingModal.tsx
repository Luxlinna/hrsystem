import { memo } from "react";
import type { Branch, Candidate, Job } from "../../types";

interface MoveToOnboardingModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  branchId: string;
  setBranchId: (id: string) => void;
  joinDate: string;
  setJoinDate: (date: string) => void;
  branches: Branch[];
  jobs: Job[];
  moving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const MoveToOnboardingModal = memo(function MoveToOnboardingModal({
  isOpen,
  candidate,
  branchId,
  setBranchId,
  joinDate,
  setJoinDate,
  branches,
  jobs,
  moving,
  onClose,
  onSubmit,
}: MoveToOnboardingModalProps) {
  if (!isOpen || !candidate) return null;

  const targetJob = jobs.find((j) => j.id === candidate.job_posting_id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !moving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              <i className="ri-user-shared-line" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Transfer to Onboarding</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Initiate employee profile & onboarding journey
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs">
            <p className="font-extrabold text-emerald-950 text-sm">{candidate.full_name}</p>
            <p className="text-emerald-700 mt-0.5">{candidate.email}</p>
            <p className="text-emerald-600 font-semibold mt-1">
              Role: <span className="font-bold text-emerald-900">{targetJob?.title || "Staff"}</span>
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Assigned Branch <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">Select Branch...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Expected Join Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={moving || !branchId || !joinDate}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {moving ? "Starting Journey..." : "Start Onboarding"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
