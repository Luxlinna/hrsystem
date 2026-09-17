import { memo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface OvertimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  canManage?: boolean;
}

interface OvertimeTypeEntry {
  code: string;
  name: string;
  rate: number;
  remark: string;
}

const DEFAULT_TYPES: OvertimeTypeEntry[] = [
  { code: "OT-STD", name: "Normal Overtime (1.5x)", rate: 1.5, remark: "" },
  { code: "OT-WKD", name: "Weekend Overtime (2.0x)", rate: 2.0, remark: "" },
  { code: "OT-HOL", name: "Holiday Overtime (2.0x)", rate: 2.0, remark: "" },
  { code: "OT-NGT", name: "Night Shift Overtime (1.5x)", rate: 1.5, remark: "" },
  { code: "OT-SPL", name: "Special Project Overtime (1.5x)", rate: 1.5, remark: "" },
];

const EMPTY_TYPE: OvertimeTypeEntry = { code: "", name: "", rate: 1.5, remark: "" };

export const OvertimeSettingsModal = memo(function OvertimeSettingsModal({
  isOpen,
  onClose,
  canManage = true,
}: OvertimeSettingsModalProps) {
  const [types, setTypes] = useState<OvertimeTypeEntry[]>(DEFAULT_TYPES);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<OvertimeTypeEntry>(EMPTY_TYPE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "overtime_types")
          .maybeSingle();
        if (data?.value) {
          const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTypes(parsed);
          }
        }
      } catch {
        // use defaults
      }
    };
    load();
  }, [isOpen]);

  // Open form for add
  const handleAdd = () => {
    setForm(EMPTY_TYPE);
    setEditIndex(-1); // -1 = new
  };

  // Open form for edit
  const handleEdit = (i: number) => {
    setForm({ ...types[i] });
    setEditIndex(i);
  };

  // Cancel form
  const handleCancelForm = () => {
    setEditIndex(null);
    setForm(EMPTY_TYPE);
  };

  // Save single type entry
  const handleSaveEntry = () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast("Error", "Code and Name are required", "error");
      return;
    }
    if (editIndex === -1) {
      setTypes((prev) => [...prev, form]);
    } else if (editIndex !== null) {
      setTypes((prev) => prev.map((t, i) => (i === editIndex ? form : t)));
    }
    setEditIndex(null);
    setForm(EMPTY_TYPE);
  };

  // Delete a type
  const handleDelete = (i: number) => {
    setTypes((prev) => prev.filter((_, idx) => idx !== i));
  };

  // Save all to Supabase
  const handleSaveAll = async () => {
    if (!canManage) return;
    setSaving(true);
    try {
      await supabase.from("system_settings").upsert(
        { key: "overtime_types", value: JSON.stringify(types), type: "json" },
        { onConflict: "key" }
      );
      toast("Success", "Overtime types saved successfully", "success");
      onClose();
    } catch (err: any) {
      toast("Error", err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center">
              <i className="ri-settings-3-line text-lg" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Overtime Type</h3>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Manage overtime types, rates and codes</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer p-1">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {/* Entry Form (Add / Edit) */}
          {editIndex !== null ? (
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40">
              <p className="text-[11px] font-bold text-[#253C7D] dark:text-sky-400 uppercase tracking-wider mb-4">
                {editIndex === -1 ? "Add New Type" : "Edit Overtime Type"}
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
                  onClick={handleCancelForm}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <i className="ri-close-line" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <i className="ri-checkbox-circle-line" />
                  Done
                </button>
              </div>
            </div>
          ) : null}

          {/* Types Table */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {types.length} Overtime Type{types.length !== 1 ? "s" : ""}
              </p>
              {canManage && editIndex === null && (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 rounded-lg text-[11px] font-bold hover:bg-[#253C7D]/20 cursor-pointer transition-colors"
                >
                  <i className="ri-add-line text-xs" />
                  Add Type
                </button>
              )}
            </div>

            <div className="space-y-2">
              {types.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 dark:bg-sky-950/50 flex items-center justify-center shrink-0">
                    <i className="ri-timer-line text-xs text-[#253C7D] dark:text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">{t.code}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{t.rate}x</span>
                      {t.remark && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
                          <span className="text-[10px] text-gray-400 italic truncate max-w-[120px]">{t.remark}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {canManage && editIndex === null && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleEdit(i)}
                        className="p-1.5 hover:bg-[#253C7D]/10 text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 rounded-lg cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <i className="ri-pencil-line text-xs" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(i)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-xs" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {types.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400 dark:text-slate-500">
                  <i className="ri-timer-line text-2xl block mb-2 opacity-40" />
                  No overtime types defined. Click "Add Type" to create one.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <i className="ri-close-line" />
            Cancel
          </button>
          {canManage && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <i className="ri-checkbox-circle-line" />
              {saving ? "Saving..." : "Done"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
