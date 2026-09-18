import { memo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { OvertimeTypeForm, type OvertimeTypeEntry } from "./OvertimeTypeForm";
import { OvertimeTypeRow } from "./OvertimeTypeRow";

export type { OvertimeTypeEntry };

interface OvertimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  canManage?: boolean;
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

  const handleAdd = () => {
    setForm(EMPTY_TYPE);
    setEditIndex(-1);
  };

  const handleEdit = (i: number) => {
    setForm({ ...types[i] });
    setEditIndex(i);
  };

  const handleCancelForm = () => {
    setEditIndex(null);
    setForm(EMPTY_TYPE);
  };

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

  const handleDelete = (i: number) => {
    setTypes((prev) => prev.filter((_, idx) => idx !== i));
  };

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
          {editIndex !== null && (
            <OvertimeTypeForm
              isNew={editIndex === -1}
              form={form}
              setForm={setForm}
              onSave={handleSaveEntry}
              onCancel={handleCancelForm}
            />
          )}

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
                <OvertimeTypeRow
                  key={i}
                  item={t}
                  index={i}
                  canManage={canManage}
                  isEditing={editIndex !== null}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
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
