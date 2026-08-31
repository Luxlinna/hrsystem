import { memo } from "react";
import type { Branch, NewHiringRequestFormState } from "../../types";

interface CreateHiringRequestFieldsProps {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  branches: Branch[];
  departments: string[];
  isSuperAdmin: boolean;
}

export const CreateHiringRequestFields = memo(function CreateHiringRequestFields({
  form,
  setForm,
  branches,
  departments,
  isSuperAdmin,
}: CreateHiringRequestFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Senior Frontend Developer"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Headcount *</label>
          <input
            type="number"
            min="1"
            max="50"
            required
            value={form.headcount}
            onChange={(e) => setForm({ ...form, headcount: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
          <input
            type="text"
            required
            placeholder="e.g. Operations, IT, Sales"
            list="req-departments"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
          />
          <datalist id="req-departments">
            {departments.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Branch / Work Site *</label>
          <select
            value={form.branch_id}
            onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all cursor-pointer"
          >
            <option value="">Headquarters / Default</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.is_site ? `↳ ${b.name} (Site)` : b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Employment Type</label>
          <select
            value={form.employment_type}
            onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all cursor-pointer"
          >
            <option value="full-time">Full-Time</option>
            <option value="part-time">Part-Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Priority / Urgency</label>
          <select
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: e.target.value as any })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all cursor-pointer"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🟠 High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Salary Min ($)</label>
          <input
            type="number"
            placeholder="e.g. 50000"
            value={form.salary_min}
            onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Salary Max ($)</label>
          <input
            type="number"
            placeholder="e.g. 80000"
            value={form.salary_max}
            onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Manager Justification / Business Need</label>
        <textarea
          rows={3}
          placeholder="Explain why this role is needed, team workload, project milestones, or revenue justification..."
          value={form.justification}
          onChange={(e) => setForm({ ...form, justification: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all resize-none"
        />
      </div>
    </>
  );
});
