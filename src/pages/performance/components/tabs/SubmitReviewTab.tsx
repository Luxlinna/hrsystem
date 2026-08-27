import { memo } from "react";
import type { ReviewForm, Employee, TaskStats } from "../../types";
import { MIN_COMMENT_LENGTH } from "../../constants";
import { scoreColor } from "../../performanceUtils";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";

interface SubmitReviewTabProps {
  form: ReviewForm;
  setForm: React.Dispatch<React.SetStateAction<ReviewForm>>;
  employees: Employee[];
  taskStats: TaskStats | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const SubmitReviewTab = memo(function SubmitReviewTab({
  form,
  setForm,
  employees,
  taskStats,
  submitting,
  onSubmit,
}: SubmitReviewTabProps) {
  const overall =
    (form.communication_score + form.teamwork_score + form.technical_score + form.leadership_score) / 4;

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-2xs">
        <h2 className="text-[16px] font-bold text-gray-900 mb-5">Submit Quarterly Review</h2>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Employee *</label>
              <EmployeeSearchSelect
                employees={employees}
                value={form.employee_id}
                onChange={(id) =>
                  setForm((p) => ({
                    ...p,
                    employee_id: id,
                    reviewer_id: p.reviewer_id === id ? "" : p.reviewer_id,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Reviewer *</label>
              <EmployeeSearchSelect
                employees={employees}
                value={form.reviewer_id}
                onChange={(id) => setForm({ ...form, reviewer_id: id })}
                excludeIds={[form.employee_id]}
                placeholder="Search reviewer by name..."
              />
            </div>
          </div>

          {taskStats && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 flex items-center gap-5 text-[12px]">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <i className="ri-checkbox-multiple-line" /> Task record:
              </span>
              <span className="text-gray-700">{taskStats.total} total</span>
              <span className="text-emerald-600 font-semibold">{taskStats.done} completed</span>
              <span className={taskStats.overdue > 0 ? "text-red-500 font-semibold" : "text-gray-400"}>
                {taskStats.overdue} overdue
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Quarter</label>
              <select
                value={form.quarter}
                onChange={(e) => setForm({ ...form, quarter: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option>Q1</option>
                <option>Q2</option>
                <option>Q3</option>
                <option>Q4</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Year</label>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-gray-700 mb-3">Scores (1–5)</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "communication_score", label: "Communication" },
                { key: "teamwork_score", label: "Teamwork" },
                { key: "technical_score", label: "Technical" },
                { key: "leadership_score", label: "Leadership" },
              ].map((m) => (
                <div key={m.key}>
                  <label className="block text-[11px] text-gray-500 mb-1.5">{m.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={(form as any)[m.key]}
                      onChange={(e) => setForm({ ...form, [m.key]: parseFloat(e.target.value) })}
                      className="flex-1 accent-[#253C7D] cursor-pointer"
                    />
                    <span className={`text-[14px] font-bold w-8 text-right ${scoreColor((form as any)[m.key])}`}>
                      {(form as any)[m.key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-[#253C7D]/5 rounded-lg p-3 text-center">
              <p className="text-[11px] text-gray-500">Overall Score</p>
              <p className={`text-2xl font-black ${scoreColor(overall)}`}>{overall.toFixed(1)}</p>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Comments *</label>
            <textarea
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
              rows={3}
              required
              minLength={MIN_COMMENT_LENGTH}
              placeholder="Overall performance summary..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] resize-none"
            />
            <p
              className={`text-[11px] mt-1 ${
                form.comments.trim().length < MIN_COMMENT_LENGTH ? "text-gray-400" : "text-emerald-600"
              }`}
            >
              {form.comments.trim().length}/{MIN_COMMENT_LENGTH} minimum characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Strengths</label>
              <textarea
                value={form.strengths}
                onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                rows={2}
                placeholder="Key strengths..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] resize-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Areas for Improvement</label>
              <textarea
                value={form.areas_for_improvement}
                onChange={(e) => setForm({ ...form, areas_for_improvement: e.target.value })}
                rows={2}
                placeholder="Growth areas..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={
              submitting ||
              !form.employee_id ||
              !form.reviewer_id ||
              form.employee_id === form.reviewer_id ||
              form.comments.trim().length < MIN_COMMENT_LENGTH
            }
            className="w-full py-3 bg-[#253C7D] text-white font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
});
