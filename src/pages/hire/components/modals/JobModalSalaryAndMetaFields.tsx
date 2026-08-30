import { memo } from "react";
import type { NewJobFormState } from "../../types";

interface JobModalSalaryAndMetaFieldsProps {
  form: NewJobFormState;
  setForm: React.Dispatch<React.SetStateAction<NewJobFormState>>;
}

export const JobModalSalaryAndMetaFields = memo(function JobModalSalaryAndMetaFields({
  form,
  setForm,
}: JobModalSalaryAndMetaFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Min Salary ($)
          </label>
          <input
            type="number"
            value={form.salary_min}
            onChange={(e) => setForm((prev) => ({ ...prev, salary_min: e.target.value }))}
            placeholder="e.g. 50000"
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Max Salary ($)
          </label>
          <input
            type="number"
            value={form.salary_max}
            onChange={(e) => setForm((prev) => ({ ...prev, salary_max: e.target.value }))}
            placeholder="e.g. 80000"
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Employment Type
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Application Deadline
          </label>
          <input
            type="date"
            value={form.closing_date}
            onChange={(e) => setForm((prev) => ({ ...prev, closing_date: e.target.value }))}
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          />
        </div>
      </div>
    </>
  );
});
