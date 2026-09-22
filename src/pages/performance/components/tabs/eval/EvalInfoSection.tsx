import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { ReviewForm, Employee, TaskStats } from "../../../types";
import { SectionHeader, REVIEW_TYPES } from "./EvalHelpers";

interface Props {
  form: ReviewForm;
  set: <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => void;
  setForm: React.Dispatch<React.SetStateAction<ReviewForm>>;
  employees: Employee[];
  evaluators?: Employee[];
  taskStats: TaskStats | null;
  isSelfAssessment?: boolean;
}

export function EvalInfoSection({
  form, set, setForm, employees, evaluators = employees, taskStats, isSelfAssessment,
}: Props) {
  const emp = employees.find((e) => e.id === form.employee_id) || evaluators.find((e) => e.id === form.employee_id);
  const rev = evaluators.find((e) => e.id === form.reviewer_id);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="h-1 bg-gradient-to-r from-[#253C7D] via-[#4f8ef7] to-[#253C7D]" />
      <div className="p-6">
        <SectionHeader number={1} title="Employee Information" icon="ri-user-3-line" />

        {/* Review Type — prominent selector */}
        <div className="mb-5">
          <label className="block text-[12px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Review Type</label>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => set("review_type", t)}
                className={`px-4 py-2 rounded-full text-[12px] font-semibold border transition-all cursor-pointer ${
                  form.review_type === t
                    ? "bg-[#253C7D] text-white border-[#253C7D] shadow-md"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#253C7D] hover:text-[#253C7D]"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
              {isSelfAssessment ? "Employee (You) *" : "Employee *"}
            </label>
            {isSelfAssessment ? (
              <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <i className="ri-user-smile-line text-[#253C7D]" />
                  {emp ? `${emp.first_name} ${emp.last_name}` : "You"}
                </span>
                <span className="text-[11px] font-normal text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-200">Locked</span>
              </div>
            ) : (
              <EmployeeSearchSelect
                employees={employees}
                value={form.employee_id}
                onChange={(id) => {
                  const targetEmp = employees.find((e) => e.id === id);
                  setForm((p) => ({
                    ...p,
                    employee_id: id,
                    reviewer_id: targetEmp?.reports_to || (p.reviewer_id === id ? "" : p.reviewer_id),
                  }));
                }}
              />
            )}
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
              Manager / Evaluator * {emp?.reports_to && <span className="text-emerald-600 font-normal">(From Reporting Line)</span>}
            </label>
            <EmployeeSearchSelect employees={evaluators} value={form.reviewer_id}
              onChange={(id) => set("reviewer_id", id)} excludeIds={[form.employee_id]} placeholder="Search evaluator..." />
          </div>
        </div>

        {emp && (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Department", value: emp.department, icon: "ri-building-line" },
              { label: "Position", value: emp.role, icon: "ri-briefcase-line" },
              ...(emp.employee_code ? [{ label: "Employee ID", value: emp.employee_code, icon: "ri-id-card-line" }] : []),
              ...(rev ? [{
                label: "Evaluator",
                value: `${rev.first_name} ${rev.last_name}${rev.id === emp.reports_to || rev.is_direct_manager ? " (Direct Manager)" : ""}`,
                icon: "ri-user-star-line"
              }] : []),
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-3 bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-100 rounded-xl px-4 py-3">
                <i className={`${icon} text-[#253C7D]/60 text-[16px]`} />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                  <p className="text-[13px] font-semibold text-gray-800 mt-0.5">{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Quarter</label>
            <select value={form.quarter} onChange={(e) => set("quarter", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] cursor-pointer bg-gray-50 hover:border-[#253C7D]/50 transition-colors">
              {["Q1","Q2","Q3","Q4"].map((q) => <option key={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Year</label>
            <select value={form.year} onChange={(e) => set("year", parseInt(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] cursor-pointer bg-gray-50 hover:border-[#253C7D]/50 transition-colors">
              {[2026,2025,2024].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Evaluation Date</label>
            <input type="date" value={form.evaluation_date} onChange={(e) => set("evaluation_date", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] bg-gray-50" />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Evaluation Period</label>
          <input type="text" value={form.evaluation_period} onChange={(e) => set("evaluation_period", e.target.value)}
            placeholder="e.g. January – March 2026"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] bg-gray-50" />
        </div>

        {taskStats && (
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-5 text-[12px]">
            <span className="text-[#253C7D] font-semibold flex items-center gap-1.5"><i className="ri-checkbox-multiple-line" /> Task Record:</span>
            <span className="text-gray-600 font-medium">{taskStats.total} total</span>
            <span className="text-emerald-600 font-bold">{taskStats.done} done ✓</span>
            <span className={taskStats.overdue > 0 ? "text-red-500 font-bold" : "text-gray-400"}>{taskStats.overdue} overdue</span>
          </div>
        )}
      </div>
    </div>
  );
}
