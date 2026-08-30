import { memo } from "react";
import type { ShiftForm, ShiftTemplate, Branch } from "../../types";
import { ShiftPresetTemplates } from "./ShiftPresetTemplates";
import { ShiftTimingCapacityFields } from "./ShiftTimingCapacityFields";

interface CreateEditShiftModalProps {
  showCreateModal: boolean;
  showEditModal: boolean;
  onClose: () => void;
  shiftForm: ShiftForm;
  setShiftForm: React.Dispatch<React.SetStateAction<ShiftForm>>;
  branches: Branch[];
  departments: string[];
  submitting: boolean;
  onApplyTemplate: (tpl: ShiftTemplate) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const CreateEditShiftModal = memo(function CreateEditShiftModal({
  showCreateModal,
  showEditModal,
  onClose,
  shiftForm,
  setShiftForm,
  branches,
  departments,
  submitting,
  onApplyTemplate,
  onSubmit,
}: CreateEditShiftModalProps) {
  if (!showCreateModal && !showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        <div
          className="p-5 text-white relative shrink-0 transition-colors"
          style={{ background: `linear-gradient(135deg, ${shiftForm.color || "#253C7D"}ee, #1E293B)` }}
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-white/20 text-white backdrop-blur-xs">
                {showEditModal ? "Edit Schedule" : "New Schedule"}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                {showEditModal ? "Edit Shift Details" : "Create New Shift"}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">Configure timing, branch location, department, and staffing capacity</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {!showEditModal && (
            <ShiftPresetTemplates shiftForm={shiftForm} onApplyTemplate={onApplyTemplate} />
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Name *</label>
            <input
              required
              type="text"
              value={shiftForm.name}
              onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
              placeholder="e.g., Morning Floor Shift, Operations Support"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Branch Location</label>
              <select
                value={shiftForm.branch_id}
                onChange={(e) => setShiftForm({ ...shiftForm, branch_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D] cursor-pointer"
              >
                <option value="">All / No specific branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
              <select
                value={shiftForm.department}
                onChange={(e) => setShiftForm({ ...shiftForm, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D] cursor-pointer"
              >
                <option value="">Select department...</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                {!departments.includes(shiftForm.department) && shiftForm.department && (
                  <option value={shiftForm.department}>{shiftForm.department}</option>
                )}
              </select>
            </div>
          </div>

          <ShiftTimingCapacityFields shiftForm={shiftForm} setShiftForm={setShiftForm} />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Optional Shift Notes</label>
            <textarea
              value={shiftForm.notes}
              onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
              rows={2}
              placeholder="Add any instructions, dress code, or special duties..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#253C7D] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#253C7D] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-60 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <><i className="ri-loader-4-line animate-spin" /><span>Saving...</span></>
              ) : (
                <><i className={showEditModal ? "ri-check-line" : "ri-add-line"} /><span>{showEditModal ? "Save Changes" : "Create Shift"}</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
