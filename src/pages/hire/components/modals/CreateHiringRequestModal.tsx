import { memo } from "react";
import type { Branch, NewHiringRequestFormState } from "../../types";

interface CreateHiringRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  branches: Branch[];
  departments: string[];
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isSuperAdmin?: boolean;
}

export const CreateHiringRequestModal = memo(function CreateHiringRequestModal({
  isOpen,
  onClose,
  form,
  setForm,
  branches,
  departments,
  submitting,
  onSubmit,
  isSuperAdmin = true,
}: CreateHiringRequestModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 via-white to-transparent">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-1">
              <i className="ri-user-add-line" /> Manager Requisition
            </div>
            <h2 className="text-xl font-bold text-gray-900">Request New Employee</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Submit a hiring requisition for CEO review and Chairman reporting
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Job Title & Headcount */}
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

          {/* Department & Branch */}
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch *</label>
              <select
                value={form.branch_id}
                disabled={isSuperAdmin === false}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all disabled:bg-gray-100 cursor-pointer"
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

          {/* Employment Type & Urgency */}
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

          {/* Target Salary Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Salary Min ($)</label>
              <input
                type="number"
                placeholder="e.g. 800"
                value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Salary Max ($)</label>
              <input
                type="number"
                placeholder="e.g. 1500"
                value={form.salary_max}
                onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Justification / Need Explanation */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Business Justification & Need *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Why does the branch need this hire? e.g. Expansion of local sales team, replacing departed engineer, etc."
              value={form.justification}
              onChange={(e) => setForm({ ...form, justification: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
            />
          </div>

          {/* Footer Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-2">
            <i className="ri-shield-user-line text-sm mt-0.5 shrink-0" />
            <span>
              This request will be sent to the <strong>CEO</strong> for approval. Once accepted, the job posting is published and reported to the <strong>Chairman / Chairwoman</strong>.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#253C7D] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3066] transition-all shadow-md shadow-[#253C7D]/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <i className="ri-send-plane-line" /> Submit Requisition
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
