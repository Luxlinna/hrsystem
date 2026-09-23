import { memo, useEffect } from "react";
import type { ReviewForm, Employee, TaskStats, Goal } from "../../types";
import { MIN_COMMENT_LENGTH } from "../../constants";
import { EvalInfoSection } from "./eval/EvalInfoSection";
import { EvalCriteriaSection } from "./eval/EvalCriteriaSection";
import { EvalGoalsSection } from "./eval/EvalGoalsSection";
import { EvalTextSections } from "./eval/EvalTextSections";

interface SubmitReviewTabProps {
  mode?: "manager" | "self";
  form: ReviewForm;
  setForm: React.Dispatch<React.SetStateAction<ReviewForm>>;
  employees: Employee[];
  evaluators?: Employee[];
  currentEmployee?: Employee | null;
  goals: Goal[];
  taskStats: TaskStats | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const SubmitReviewTab = memo(function SubmitReviewTab({
  mode = "manager", form, setForm, employees, evaluators = employees, currentEmployee,
  goals, taskStats, submitting, onSubmit,
}: SubmitReviewTabProps) {
  const isSelf = mode === "self";
  const set = <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (isSelf && currentEmployee?.id && form.employee_id !== currentEmployee.id) {
      setForm((prev) => ({ ...prev, employee_id: currentEmployee.id }));
    }
    const emp = (isSelf ? currentEmployee : employees.find((e) => e.id === form.employee_id)) || null;
    if (emp?.reports_to && !form.reviewer_id) {
      setForm((prev) => ({ ...prev, reviewer_id: emp.reports_to }));
    }
  }, [isSelf, currentEmployee, form.employee_id, form.reviewer_id, employees, setForm]);

  const canSubmit = isSelf
    ? !submitting && !!form.employee_id && !!form.reviewer_id && form.employee_id !== form.reviewer_id && form.employee_comments.trim().length > 0
    : !submitting && !!form.employee_id && !!form.reviewer_id && form.employee_id !== form.reviewer_id && form.comments.trim().length >= MIN_COMMENT_LENGTH;

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`rounded-2xl p-7 mb-6 text-white relative overflow-hidden shadow-sm ${
        isSelf
          ? "bg-gradient-to-r from-[#3b2d71] via-[#5b40b2] to-[#7c3aed]"
          : "bg-gradient-to-r from-[#1a2f6b] via-[#253C7D] to-[#1a5fb4]"
      }`}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }} />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <i className={`${isSelf ? "ri-user-star-line" : "ri-survey-line"} text-2xl`} />
          </div>
          <div>
            <h2 className="text-[22px] font-black tracking-tight">
              {isSelf ? "Employee Self-Assessment" : "Employee Performance Evaluation"}
            </h2>
            <p className="text-white/70 text-[13px] mt-0.5">
              {isSelf
                ? "Rate your performance · Detail your achievements & development goals · Submit to your manager"
                : form.id
                ? "Appraise employee's self-evaluation · Enter official manager ratings and feedback"
                : "Complete all 6 sections · Self-assessment + Manager rating · Standard HR format"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <EvalInfoSection form={form} set={set} setForm={setForm} employees={employees}
          evaluators={evaluators} taskStats={taskStats} isSelfAssessment={isSelf} />
        <EvalCriteriaSection form={form} set={set} isSelfAssessment={isSelf} />
        <EvalGoalsSection goals={goals} employeeId={form.employee_id} />
        <EvalTextSections form={form} set={set} isSelfAssessment={isSelf} />

        <button type="submit" disabled={!canSubmit}
          className={`w-full py-4 text-white font-bold rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[15px] flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl ${
            isSelf
              ? "bg-gradient-to-r from-[#5b40b2] to-[#7c3aed] hover:from-[#4c339c] hover:to-[#6d28d9]"
              : "bg-gradient-to-r from-[#253C7D] to-[#1a5fb4] hover:from-[#1F336A] hover:to-[#1a4fa0]"
          }`}>
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
          ) : isSelf ? (
            <><i className="ri-send-plane-fill" />Submit Self-Assessment to Evaluator</>
          ) : form.id ? (
            <><i className="ri-check-double-line" />Complete & Finalize Appraisal</>
          ) : (
            <><i className="ri-send-plane-fill" />Submit Performance Evaluation</>
          )}
        </button>
      </form>
    </div>
  );
});
