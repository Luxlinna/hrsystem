import { useMemo } from "react";
import type { ReviewForm } from "../../../types";
import { SectionHeader, StarRating, RATING_LABELS, CRITERIA } from "./EvalHelpers";

interface Props {
  form: ReviewForm;
  set: <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => void;
  isSelfAssessment?: boolean;
}

function ScoreBadge({ score, dim }: { score: number; dim?: boolean }) {
  const info = RATING_LABELS[score] ?? RATING_LABELS[3];
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-opacity ${dim ? "opacity-60" : ""}`}
      style={{ background: info.color + "18", color: info.color }}>
      {score} – {info.label}
    </span>
  );
}

export function EvalCriteriaSection({ form, set, isSelfAssessment }: Props) {
  const overallManager = useMemo(() => {
    const s = CRITERIA.map((c) => (form[`${c.key}_score` as keyof ReviewForm] as number) || 3);
    return s.reduce((a, b) => a + b, 0) / s.length;
  }, [form]);
  const overallSelf = useMemo(() => {
    const s = CRITERIA.map((c) => (form[`self_${c.key}_score` as keyof ReviewForm] as number) || 3);
    return s.reduce((a, b) => a + b, 0) / s.length;
  }, [form]);

  const mInfo = RATING_LABELS[Math.round(overallManager)] ?? RATING_LABELS[3];
  const sInfo = RATING_LABELS[Math.round(overallSelf)] ?? RATING_LABELS[3];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="h-1 bg-gradient-to-r from-[#22c55e] via-[#3b82f6] to-[#ef4444]" />
      <div className="p-6">
        <SectionHeader number={2} title="Performance Criteria" icon="ri-bar-chart-line" />

        {/* Column headers */}
        <div className={`hidden sm:grid ${isSelfAssessment ? "grid-cols-[1fr_240px]" : "grid-cols-[1fr_210px_210px]"} gap-4 mb-3 px-4`}>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Evaluation Criteria</div>
          <div className="text-center">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider flex items-center justify-center gap-1.5 bg-purple-50/80 py-1 px-2 rounded-lg">
              <i className="ri-user-line" /> {isSelfAssessment ? "Your Self-Rating" : "Self Assessment"}
            </span>
          </div>
          {!isSelfAssessment && (
            <div className="text-center">
              <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider flex items-center justify-center gap-1.5 bg-blue-50/80 py-1 px-2 rounded-lg">
                <i className="ri-user-star-line" /> Manager Rating
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {CRITERIA.map((c) => {
            const scoreKey = `${c.key}_score` as keyof ReviewForm;
            const selfKey = `self_${c.key}_score` as keyof ReviewForm;
            const commentKey = `${c.key}_comment` as keyof ReviewForm;
            const mScore = (form[scoreKey] as number) || 3;
            const sScore = (form[selfKey] as number) || 3;
            const delta = mScore - sScore;

            return (
              <div key={c.key} className="border border-gray-100 rounded-xl hover:border-[#253C7D]/20 hover:shadow-xs transition-all bg-white">
                <div className={`grid grid-cols-1 ${isSelfAssessment ? "sm:grid-cols-[1fr_240px]" : "sm:grid-cols-[1fr_210px_210px]"} gap-4 items-center p-4`}>
                  {/* Label */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#253C7D]/8 flex items-center justify-center shrink-0">
                      <i className={`${c.icon} text-[#253C7D] text-[15px]`} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-800">{c.label}</p>
                      {!isSelfAssessment && delta !== 0 && (
                        <p className={`text-[11px] font-semibold mt-0.5 ${delta > 0 ? "text-emerald-600" : "text-orange-500"}`}>
                          {delta > 0 ? `↑ Manager +${delta}` : `↓ Manager ${delta}`} vs self
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Self */}
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <StarRating value={sScore} onChange={(v) => set(selfKey, v)} />
                    <ScoreBadge score={sScore} dim={!isSelfAssessment} />
                  </div>
                  {/* Manager (if manager mode) */}
                  {!isSelfAssessment && (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <StarRating value={mScore} onChange={(v) => set(scoreKey, v)} />
                      <ScoreBadge score={mScore} />
                    </div>
                  )}
                </div>
                {!isSelfAssessment && (
                  <div className="px-4 pb-3 pt-0">
                    <input type="text" value={(form[commentKey] as string) || ""}
                      onChange={(e) => set(commentKey, e.target.value)} placeholder={`Notes or feedback on ${c.label.toLowerCase()} (optional)...`}
                      className="w-full px-3 py-2 border border-gray-100 rounded-lg text-[12px] text-gray-600 focus:outline-none focus:border-[#253C7D] bg-gray-50 focus:bg-white transition-colors" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Score summaries */}
        {isSelfAssessment ? (
          <div className="mt-5 rounded-xl p-4 text-center bg-purple-50/70 border border-purple-100">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Your Self-Assessment Average</p>
            <p className="text-[32px] font-black text-purple-600">{overallSelf.toFixed(1)}<span className="text-[15px] font-bold text-purple-300">/5</span></p>
            <p className="text-[12px] font-semibold text-purple-500 mt-0.5">{sInfo.label}</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 text-center bg-purple-50 border border-purple-100">
              <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">Self Average</p>
              <p className="text-[28px] font-black text-purple-600">{overallSelf.toFixed(1)}<span className="text-[14px] font-bold text-purple-300">/5</span></p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: mInfo.color + "10", border: `1px solid ${mInfo.color}30` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: mInfo.color }}>Manager Average</p>
              <p className="text-[28px] font-black" style={{ color: mInfo.color }}>{overallManager.toFixed(1)}<span className="text-[14px] font-bold text-gray-300">/5</span></p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: mInfo.color }}>{mInfo.label}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
