import { memo, useState, useEffect } from "react";
import type { ExitTypeSetting, SettingFormData } from "./types";
import { DEFAULT_SETTING_FORM } from "./types";

interface ExitTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing: ExitTypeSetting | null;
  saving: boolean;
  onSave: (id: string | null, form: SettingFormData) => Promise<boolean>;
}

export const ExitTypeModal = memo(function ExitTypeModal({
  isOpen,
  onClose,
  editing,
  saving,
  onSave,
}: ExitTypeModalProps) {
  const [form, setForm] = useState<SettingFormData>(DEFAULT_SETTING_FORM);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        status: editing.status,
        display_order: editing.display_order,
      });
    } else {
      setForm(DEFAULT_SETTING_FORM);
    }
  }, [editing, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const ok = await onSave(editing ? editing.id : null, form);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">
            {editing ? "Edit Exit Type" : "Add Exit Type"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Exit Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. End Contract, Cut Off"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 outline-none text-gray-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))
                }
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:border-[#253C7D] outline-none text-gray-800 dark:text-slate-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={form.display_order}
                onChange={(e) =>
                  setForm((p) => ({ ...p, display_order: parseInt(e.target.value, 10) || 0 }))
                }
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:border-[#253C7D] outline-none text-gray-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1f3166] rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editing ? "Save Changes" : "Create Exit Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
