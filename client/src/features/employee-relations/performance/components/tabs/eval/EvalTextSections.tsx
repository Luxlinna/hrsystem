import { useMemo } from "react";
import type { ReviewForm } from "../../../types";
import { SectionHeader, TA, RATING_LABELS, CRITERIA } from "./EvalHelpers";
import { MIN_COMMENT_LENGTH } from "../../../constants";

interface Props {
  form: ReviewForm;
  set: <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => void;
  isSelfAssessment?: boolean;
}

function Section({ n, title, icon, color, children }: { n: number; title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="h-1" style={{ background: `linear-gradient(to right, ${color}, ${color}80)` }} />
      <div className="p-6"><SectionHeader number={n} title={title} icon={icon} />{children}</div>
    </div>
  );
}

export function EvalTextSections({ form, set, isSelfAssessment }: Props) {
  const managerScore = useMemo(() => {
    const s = CRITERIA.map((c) => (form[`${c.key}_score` as keyof ReviewForm] as number) || 3);
    return s.reduce((a, b) => a + b, 0) / s.length;
  }, [form]);
  const selfScore = useMemo(() => {
    const s = CRITERIA.map((c) => (form[`self_${c.key}_score` as keyof ReviewForm] as number) || 3);
    return s.reduce((a, b) => a + b, 0) / s.length;
  }, [form]);

  const displayScore = isSelfAssessment ? selfScore : managerScore;
  const info = RATING_LABELS[Math.round(displayScore)] ?? RATING_LABELS[3];

  return (
    <>
      <Section n={4} title="Areas for Improvement" icon="ri-arrow-up-circle-line" color="#f97316">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TA label="Skills that need improvement" value={form.skills_to_improve} onChange={(v) => set("skills_to_improve", v)} placeholder="Skills or competencies you want to work on..." />
          <TA label="Performance issues / challenges" value={form.performance_issues} onChange={(v) => set("performance_issues", v)} placeholder="Challenges or blockers faced..." />
          <TA label="Recommended training" value={form.recommended_training} onChange={(v) => set("recommended_training", v)} placeholder="Training or certifications requested..." />
        </div>
      </Section>

      <Section n={5} title="Development Plan" icon="ri-road-map-line" color="#8b5cf6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TA label="Training required" value={form.training_required} onChange={(v) => set("training_required", v)} placeholder="Formal training needed..." />
          <TA label="New skills to develop" value={form.new_skills_to_develop} onChange={(v) => set("new_skills_to_develop", v)} placeholder="Skills to build next quarter..." />
          <TA label="Career development goals" value={form.career_development_goals} onChange={(v) => set("career_development_goals", v)} placeholder="Long-term career aspirations..." />
          <TA label="Next-period objectives" value={form.next_period_objectives} onChange={(v) => set("next_period_objectives", v)} placeholder="Key objectives for next period..." />
        </div>
      </Section>

      <Section n={6} title="Overall Evaluation" icon="ri-file-list-3-line" color="#253C7D">
        <div className="space-y-4">
          {isSelfAssessment ? (
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
                Your Self-Reflection & Summary * <span className="text-gray-400 font-normal">(required)</span>
              </label>
              <textarea value={form.employee_comments} onChange={(e) => set("employee_comments", e.target.value)} rows={4} required
                placeholder="Reflect on your performance, key successes, challenges, and goals for the future..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] resize-none bg-gray-50 focus:bg-white transition-colors" />
            </div>
          ) : (
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
                Manager's Overall Comments * <span className="text-gray-400 font-normal">(min. {MIN_COMMENT_LENGTH} chars)</span>
              </label>
              <textarea value={form.comments} onChange={(e) => set("comments", e.target.value)} rows={3} required minLength={MIN_COMMENT_LENGTH}
                placeholder="Comprehensive performance summary..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] resize-none bg-gray-50 focus:bg-white transition-colors" />
              <p className={`text-[11px] mt-1 ${form.comments.trim().length < MIN_COMMENT_LENGTH ? "text-gray-400" : "text-emerald-600"}`}>
                {form.comments.trim().length}/{MIN_COMMENT_LENGTH} characters
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TA label="Key Strengths" value={form.strengths} onChange={(v) => set("strengths", v)} placeholder="Top strengths shown this period..." />
            <TA label="Areas for Growth (summary)" value={form.areas_for_improvement} onChange={(v) => set("areas_for_improvement", v)} placeholder="Summary of areas to develop..." />
          </div>

          {!isSelfAssessment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TA label="Manager's Specific Comments" value={form.manager_comments} onChange={(v) => set("manager_comments", v)} placeholder="Additional notes from evaluator..." />
              <TA label="Employee's Reflection" value={form.employee_comments} onChange={(v) => set("employee_comments", v)} placeholder="Employee's notes..." />
            </div>
          )}
        </div>

        {/* Score & sign-off */}
        <div className="mt-6 rounded-2xl p-5" style={{ background: info.color + "08", border: `1px solid ${info.color}30` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {isSelfAssessment ? "Self-Assessment Score" : "Final Score"}
              </p>
              <p className="text-[40px] font-black leading-none mt-1" style={{ color: info.color }}>
                {displayScore.toFixed(1)}<span className="text-[20px] font-bold text-gray-300">/5</span>
              </p>
              <p className="text-[13px] font-bold mt-1" style={{ color: info.color }}>{info.label}</p>
            </div>
            <div className="text-right space-y-2 text-[12px]">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-gray-400">{isSelfAssessment ? "Self Submitted" : "Evaluator Approval"}</span>
                <span className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center">
                  <i className={`${isSelfAssessment ? "ri-check-line text-emerald-500" : "ri-time-line text-gray-300"} text-[11px]`} />
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-gray-400">Manager Appraisal</span>
                <span className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center"><i className="ri-time-line text-gray-300 text-[11px]" /></span>
              </div>
            </div>
          </div>

          {/* Employee Acknowledgement */}
          <div className={`rounded-xl border-2 p-4 transition-colors ${form.employee_acknowledged ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-white"}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.employee_acknowledged}
                onChange={(e) => {
                  set("employee_acknowledged", e.target.checked);
                  set("employee_acknowledged_date", e.target.checked ? new Date().toISOString().split("T")[0] : "");
                }}
                className="mt-0.5 w-5 h-5 rounded accent-emerald-500 cursor-pointer" />
              <div>
                <p className="text-[13px] font-semibold text-gray-800">Employee Confirmation</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isSelfAssessment
                    ? "I confirm that this self-evaluation represents an accurate assessment of my work and performance."
                    : "I acknowledge that I have read and discussed this performance evaluation with my manager."}
                </p>
                {form.employee_acknowledged && form.employee_acknowledged_date && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1.5">
                    <i className="ri-checkbox-circle-fill mr-1" />Confirmed on {form.employee_acknowledged_date}
                  </p>
                )}
              </div>
            </label>
          </div>
        </div>
      </Section>
    </>
  );
}
