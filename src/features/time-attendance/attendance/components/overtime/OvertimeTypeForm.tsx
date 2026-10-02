export interface OvertimeTypeEntry {
  code: string;
  name: string;
  rate: number;
  remark: string;
}

interface OvertimeTypeFormProps {
  isNew: boolean;
  form: OvertimeTypeEntry;
  setForm: React.Dispatch<React.SetStateAction<OvertimeTypeEntry>>;
  onSave: () => void;
  onCancel: () => void;
}

export function OvertimeTypeForm({
  isNew,
  form,
  setForm,
  onSave,
  onCancel,
}: OvertimeTypeFormProps) {
  return (
    <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40">
      <p className="text-[11px] font-bold text-[#253C7D] dark:text-sky-400 uppercase tracking-wider mb-4">
        {isNew ? "Add New Type" : "Edit Overtime Type"}
      </p>

      {/* Overtime Type Code */}
      <div className="flex items-start gap-4 mb-3">
        <label className="w-44 shrink-0 text-xs font-semibold text-gray-600 dark:text-slate-300 pt-2.5 text-right">
          Overtime Type Code <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Overtime Type Code"
          className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-500 transition-colors placeholder:text-gray-300"
        />
      </div>

      {/* Overtime Type Name */}
      <div className="flex items-start gap-4 mb-3">
        <label className="w-44 shrink-0 text-xs font-semibold text-gray-600 dark:text-slate-300 pt-2.5 text-right">
          Overtime Type Name <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Overtime Type Name"
          className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-500 transition-colors placeholder:text-gray-300"
        />
      </div>

      {/* Rate */}
      <div className="flex items-start gap-4 mb-3">
        <label className="w-44 shrink-0 text-xs font-semibold text-gray-600 dark:text-slate-300 pt-2.5 text-right">
          Rate <span className="text-rose-400">*</span>
        </label>
        <input
          type="number"
          step="0.1"
          min="1"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 1 })}
          placeholder="Rate"
          className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-500 transition-colors"
        />
      </div>

      {/* Remark */}
      <div className="flex items-start gap-4 mb-5">
        <label className="w-44 shrink-0 text-xs font-semibold text-gray-600 dark:text-slate-300 pt-2.5 text-right">
          Remark
        </label>
        <textarea
          value={form.remark}
          onChange={(e) => setForm({ ...form, remark: e.target.value })}
          placeholder="Remark"
          rows={3}
          className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-500 transition-colors resize-none placeholder:text-gray-300"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <i className="ri-close-line" />
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1.5 px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <i className="ri-checkbox-circle-line" />
          Done
        </button>
      </div>
    </div>
  );
}
