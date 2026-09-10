import { memo } from "react";
import { useNavigate } from "react-router-dom";
import type { OnboardingRequest } from "../../types";
import { initials } from "../../onboardingUtils";

interface OnboardingCardHeaderProps {
  request: OnboardingRequest;
  fullName: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onDeleteRequest: (req: OnboardingRequest) => void;
  onOpenSetupModal: () => void;
}

export const OnboardingCardHeader = memo(function OnboardingCardHeader({
  request,
  fullName,
  isExpanded,
  onToggleExpand,
  onDeleteRequest,
  onOpenSetupModal,
}: OnboardingCardHeaderProps) {
  const navigate = useNavigate();
  const emp = request.employees;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
          {initials(emp?.first_name, emp?.last_name)}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm text-gray-900 leading-tight">{fullName}</h3>
            {emp?.candidate_code && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-[#253C7D] border border-blue-200/60 inline-flex items-center gap-1">
                <i className="ri-fingerprint-line text-[11px]" />
                {emp.candidate_code}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                request.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-700"
              }`}
            >
              {request.status}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              Day {request.day_count}
            </span>
            {emp?.resume_url && (
              <a
                href={emp.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100 inline-flex items-center gap-1"
              >
                <i className="ri-file-pdf-fill" /> CV
              </a>
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-semibold mt-1">
            {emp?.role || "Staff"} &middot; {emp?.department || "General"} &middot; {emp?.branches?.name || "HQ"}
            {emp?.location && ` · ${emp.location}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSetupModal}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl text-xs font-bold text-[#253C7D] flex items-center gap-1 cursor-pointer transition-colors"
          title="Set up which requirements are needed for this employee"
        >
          <i className="ri-settings-4-line" />
          <span>Set up Requirements</span>
        </button>
        <button
          type="button"
          onClick={() => navigate(`/onboarding-checklist?hire=${request.id}`)}
          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <i className="ri-task-line" />
          <span>Checklist</span>
        </button>
        <button
          type="button"
          onClick={() => onToggleExpand(request.id)}
          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{isExpanded ? "Collapse" : "Expand"}</span>
          <i className={`ri-arrow-down-s-line text-sm transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => onDeleteRequest(request)}
          className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl border border-gray-200 transition-colors cursor-pointer"
          title="Delete Request"
        >
          <i className="ri-delete-bin-line text-sm" />
        </button>
      </div>
    </div>
  );
});
