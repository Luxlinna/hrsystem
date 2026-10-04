import { memo } from "react";
import type { OnboardingHire } from "../../types";
import { getHireName } from "../../checklistUtils";

interface CandidateAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHire: OnboardingHire | null;
  hireAuditLogs: any[];
  loadingAuditLogs: boolean;
}

export const CandidateAuditModal = memo(function CandidateAuditModal({
  isOpen,
  onClose,
  selectedHire,
  hireAuditLogs,
  loadingAuditLogs,
}: CandidateAuditModalProps) {
  if (!isOpen || !selectedHire) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Candidate Onboarding History</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Audit log for <span className="text-[#253C7D] font-bold">{getHireName(selectedHire)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {loadingAuditLogs ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading audit history...</div>
        ) : hireAuditLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No audit records recorded for this candidate yet.
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-gray-100">
            {hireAuditLogs.map((log) => (
              <div key={log.id} className="pt-3 first:pt-0 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-gray-900 capitalize">
                    {log.action} &middot; {log.actor_name || "Admin"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-0.5">{log.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
