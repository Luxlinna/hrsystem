import React, { memo, useState, useEffect } from "react";
import type { WarningTypeSetting, WarningTypeFormData } from "./types";
import { DEFAULT_WARNING_TYPE_FORM } from "./types";

interface WarningTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: WarningTypeSetting | null;
  onSave: (id: string | undefined, form: WarningTypeFormData) => Promise<boolean>;
  saving: boolean;
  itemCount: number;
}

export const WarningTypeModal = memo(function WarningTypeModal({
  isOpen,
  onClose,
  editingItem,
  onSave,
  saving,
  itemCount,
}: WarningTypeModalProps) {
  const [form, setForm] = useState<WarningTypeFormData>(DEFAULT_WARNING_TYPE_FORM);

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        alert_days_after: editingItem.alert_days_after || 0,
        stop_alert_days: editingItem.stop_alert_days || 0,
        remark: editingItem.remark || "",
        status: editingItem.status || "active",
        display_order: editingItem.display_order ?? itemCount + 1,
      });
    } else {
      setForm({
        ...DEFAULT_WARNING_TYPE_FORM,
        display_order: itemCount + 1,
      });
    }
  }, [editingItem, itemCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const ok = await onSave(editingItem?.id, form);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-900">
            {editingItem ? "Edit Warning Type" : "Add New Warning Type"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Warning Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Instruction, Verbal, First Written"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Alert Day After Warning(day)
              </label>
              <input
                type="number"
                min={0}
                value={form.alert_days_after}
                onChange={(e) => setForm({ ...form, alert_days_after: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Stop Alert After Alert Day(day)
              </label>
              <input
                type="number"
                min={0}
                value={form.stop_alert_days}
                onChange={(e) => setForm({ ...form, stop_alert_days: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Remark</label>
            <textarea
              rows={3}
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              placeholder="Description or conditions for this warning level..."
              className="w-full p-3 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#253C7D]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Display Order</label>
              <input
                type="number"
                min={1}
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 font-bold text-white bg-[#253C7D] hover:bg-[#1E3064] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : editingItem ? "Save Changes" : "Create Warning Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
