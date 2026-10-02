import { memo } from "react";
import type { OnboardingRequest, OnboardingDoc } from "../../types";
import { STAGES } from "../../constants";
import { initials, getOverallProgress } from "../../onboardingUtils";

interface OnboardingTableViewProps {
  requests: OnboardingRequest[];
  documents: OnboardingDoc[];
  onSelectRequest: (id: string) => void;
  onApprove: (req: OnboardingRequest) => void;
  onDeleteRequest: (req: OnboardingRequest) => void;
}

export const OnboardingTableView = memo(function OnboardingTableView({
  requests,
  documents,
  onSelectRequest,
  onApprove,
  onDeleteRequest,
}: OnboardingTableViewProps) {
  if (requests.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Branch / Dept</th>
              <th className="px-5 py-3.5">Current Stage</th>
              <th className="px-5 py-3.5">Overall Progress</th>
              <th className="px-5 py-3.5">Approval Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => {
              const emp = req.employees;
              const fullName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Staff";
              const progress = getOverallProgress(req, documents);
              const stageLabel = STAGES.find((s) => s.key === req.stage)?.shortLabel || req.stage;

              return (
                <tr
                  key={req.id}
                  onClick={() => onSelectRequest(req.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
                        {initials(emp?.first_name, emp?.last_name)}
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 text-xs sm:text-[13px]">{fullName}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{emp?.role || "Staff"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 font-medium">
                    {emp?.branches?.name || "HQ"} &middot; {emp?.department || "General"}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
                      {stageLabel}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2 max-w-[140px]">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            req.status === "completed" ? "bg-emerald-500" : "bg-[#253C7D]"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-gray-700">{progress}%</span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        req.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : req.status === "approved"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {req.status === "completed"
                        ? "Completed"
                        : req.status === "approved"
                        ? "In Progress"
                        : "Pending Approval"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {req.status === "pending" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(req);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRequest(req);
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
