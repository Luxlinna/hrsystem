import { memo, useState } from "react";
import { Link } from "react-router-dom";
import type { Candidate } from "../../types";
import { STAGE_CONFIG, PIPELINE_STAGES } from "../../constants";
import { initials, formatRelative } from "../../hireUtils";
import { CandidateCard } from "./CandidateCard";
import { EditHiringInfoModal } from "../candidate-detail/EditHiringInfoModal";

interface CandidatesTabContentProps {
  candidates: Candidate[];
  jobs?: any[];
  viewMode: "cards" | "list";
  canManage?: boolean;
  onOpenCreate: () => void;
  onOpenEdit?: (c: Candidate) => void;
  onUpdateStage: (id: string, stage: string) => void;
  onRate: (id: string, rating: number) => void;
  onDelete?: (id: string, name: string) => void;
  onMoveToOnboarding: (c: Candidate) => void;
  onUploadResume?: (id: string, file: File) => void;
  onOpenInterview?: (c: Candidate) => void;
  onOpenImport?: () => void;
}

export const CandidatesTabContent = memo(function CandidatesTabContent({
  candidates,
  viewMode,
  onOpenCreate,
  onOpenEdit,
  onUpdateStage,
  onRate,
  onDelete,
  onMoveToOnboarding,
  onUploadResume,
  onOpenInterview,
  onOpenImport,
}: CandidatesTabContentProps) {
  const [hiringInfoCandidate, setHiringInfoCandidate] = useState<Candidate | null>(null);

  const handleHiringInfoSaved = (updated: Partial<Candidate>) => {
    if (hiringInfoCandidate) {
      Object.assign(hiringInfoCandidate, updated);
    }
  };

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
        <div className="flex items-center justify-center gap-2.5 mt-4">
          <button
            type="button"
            onClick={onOpenCreate}
            className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
          >
            + Add Candidate
          </button>
          {onOpenImport && (
            <button
              type="button"
              onClick={onOpenImport}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-xl shadow-2xs hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-upload-cloud-2-line text-sm" />
              <span>Import Hiring Info</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-5 py-3.5">Job Opening</th>
                <th className="px-5 py-3.5">Recruiter</th>
                <th className="px-5 py-3.5">Pipeline Stage</th>
                <th className="px-5 py-3.5">Rating</th>
                <th className="px-5 py-3.5">Applied</th>
                <th className="px-5 py-3.5">Resume</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map((c) => {
                const normStage =
                  c.stage === "applied" ? "cv_received" : c.stage === "interview" ? "hr_interview" : c.stage;
                const cfg = STAGE_CONFIG[normStage] || STAGE_CONFIG.cv_received;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link to={`/hire/candidates/${c.id}`} className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
                          {initials(c.full_name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            {c.candidate_code && (
                              <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                                {c.candidate_code}
                              </span>
                            )}
                            <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors">{c.full_name}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {c.email} {c.location ? `• ${c.location}` : ""}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">{c.job_postings?.title || "Direct"}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-gray-600 font-medium">
                      {c.assigned_recruiter ? `${c.assigned_recruiter.first_name} ${c.assigned_recruiter.last_name}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <select
                        value={normStage}
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
                            type="button"
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
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-semibold text-[11px]">{formatRelative(c.applied_at)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {c.resume_url ? (
                        <a href={c.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#253C7D] hover:underline flex items-center gap-1">
                          <i className="ri-file-text-line" /> View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHiringInfoCandidate(c)}
                          className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-blue-200/70"
                          title="Add or Edit 33 Standard Hiring Information Fields"
                        >
                          <i className="ri-file-user-line text-xs" />
                          <span>Hiring Info</span>
                        </button>
                        {c.stage === "hired" && (
                          <button
                            type="button"
                            onClick={() => onMoveToOnboarding(c)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Onboarding
                          </button>
                        )}
                        <Link
                          to={`/hire/candidates/${c.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="View Profile"
                        >
                          <i className="ri-arrow-right-line" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hiringInfoCandidate && (
          <EditHiringInfoModal
            isOpen={Boolean(hiringInfoCandidate)}
            onClose={() => setHiringInfoCandidate(null)}
            candidate={hiringInfoCandidate}
            onSaved={handleHiringInfoSaved}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((c) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            onUpdateStage={onUpdateStage}
            onRate={onRate}
            onMoveToOnboarding={onMoveToOnboarding}
            onUploadResume={onUploadResume}
            onEdit={onOpenEdit}
            onDelete={onDelete}
            onScheduleInterview={onOpenInterview ? () => onOpenInterview(c) : undefined}
            onOpenHiringInfo={setHiringInfoCandidate}
          />
        ))}
      </div>

      {hiringInfoCandidate && (
        <EditHiringInfoModal
          isOpen={Boolean(hiringInfoCandidate)}
          onClose={() => setHiringInfoCandidate(null)}
          candidate={hiringInfoCandidate}
          onSaved={handleHiringInfoSaved}
        />
      )}
    </>
  );
});
