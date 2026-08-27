import { memo } from "react";
import { Link } from "react-router-dom";
import type { Candidate } from "../../types";
import { STAGE_CONFIG, PIPELINE_STAGES } from "../../constants";
import { initials, formatRelative } from "../../hireUtils";
import { CandidateCard } from "./CandidateCard";

interface CandidatesTabContentProps {
  candidates: Candidate[];
  viewMode: "cards" | "list";
  onOpenCreateCandidate: () => void;
  onUpdateStage: (id: string, stage: string) => void;
  onRate: (id: string, rating: number) => void;
  onMoveToOnboarding: (c: Candidate) => void;
  onUploadResume: (id: string, file: File) => void;
  onEdit: (c: Candidate) => void;
  onDelete: (id: string, name: string) => void;
}

export const CandidatesTabContent = memo(function CandidatesTabContent({
  candidates,
  viewMode,
  onOpenCreateCandidate,
  onUpdateStage,
  onRate,
  onMoveToOnboarding,
  onUploadResume,
  onEdit,
  onDelete,
}: CandidatesTabContentProps) {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-user-search-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Candidates Found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No applicants match your search query or selected stage filters.
        </p>
        <button
          onClick={onOpenCreateCandidate}
          className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
        >
          + Add Candidate
        </button>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Candidate Name</th>
                <th className="px-5 py-3.5">Target Job</th>
                <th className="px-5 py-3.5">Pipeline Stage</th>
                <th className="px-5 py-3.5">Rating</th>
                <th className="px-5 py-3.5">Applied</th>
                <th className="px-5 py-3.5">Resume</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map((c) => {
                const cfg = STAGE_CONFIG[c.stage] || STAGE_CONFIG.applied;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link to={`/hire/candidates/${c.id}`} className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
                          {initials(c.full_name)}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                            {c.full_name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">{c.email}</p>
                        </div>
                      </Link>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">
                      {c.job_postings?.title || "Direct"}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <select
                        value={c.stage}
                        onChange={(e) => onUpdateStage(c.id, e.target.value)}
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border cursor-pointer focus:outline-none ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        {PIPELINE_STAGES.map((st) => (
                          <option key={st} value={st}>
                            {STAGE_CONFIG[st]?.label || st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => onRate(c.id, star)}
                            className={`text-xs cursor-pointer transition-colors ${
                              star <= (c.rating || 0) ? "text-amber-400" : "text-gray-200 hover:text-amber-300"
                            }`}
                          >
                            <i className={star <= (c.rating || 0) ? "ri-star-fill" : "ri-star-line"} />
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-semibold text-[11px]">
                      {formatRelative(c.applied_at)}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {c.resume_url ? (
                        <a
                          href={c.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#253C7D] hover:underline flex items-center gap-1"
                        >
                          <i className="ri-file-text-line" />
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.stage === "hired" && (
                          <button
                            onClick={() => onMoveToOnboarding(c)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Onboarding
                          </button>
                        )}
                        <Link
                          to={`/hire/candidates/${c.id}`}
                          className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <i className="ri-eye-line text-sm" />
                        </Link>
                        <button
                          onClick={() => onEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <i className="ri-edit-line text-sm" />
                        </button>
                        <button
                          onClick={() => onDelete(c.id, c.full_name)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {candidates.map((c) => (
        <CandidateCard
          key={c.id}
          candidate={c}
          onUpdateStage={onUpdateStage}
          onRate={onRate}
          onMoveToOnboarding={onMoveToOnboarding}
          onUploadResume={onUploadResume}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});
