import { memo, useState, useEffect } from "react";
import type { Task, FormState, Employee } from "../../types";
import { emptyForm } from "../../constants";
import { TaskMultiAssigneeSelect } from "./TaskMultiAssigneeSelect";
import { TaskOutsideWorkSection } from "./TaskOutsideWorkSection";
import { TaskFormCoreFields } from "./TaskFormCoreFields";

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface TaskFormModalProps {
  editingTask: Task | null;
  employees: Employee[];
  currentEmployeeId?: string | null;
  saving: boolean;
  onSave: (form: FormState & {
    work_address?: string | null;
    work_lat?: number | null;
    work_lng?: number | null;
    work_accuracy_m?: number | null;
  }, editId?: string) => void;
  onClose: () => void;
}

export const TaskFormModal = memo(function TaskFormModal({
  editingTask,
  employees,
  currentEmployeeId,
  saving,
  onSave,
  onClose,
}: TaskFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [owLocation, setOwLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title,
        description: editingTask.description || "",
        assigned_to: editingTask.assigned_to,
        status: editingTask.status,
        priority: editingTask.priority,
        due_date: editingTask.due_date || "",
        is_outside_work: editingTask.is_outside_work,
      });
      setAssignedIds(editingTask.assigned_to ? [editingTask.assigned_to] : []);
      if (editingTask.is_outside_work && editingTask.work_address) {
        setOwLocation({
          lat: Number(editingTask.work_lat) || 0,
          lng: Number(editingTask.work_lng) || 0,
          accuracy: editingTask.work_accuracy_m || undefined,
          address: editingTask.work_address,
        });
      } else {
        setOwLocation(null);
      }
    } else {
      setForm(emptyForm);
      setAssignedIds(currentEmployeeId ? [currentEmployeeId] : []);
      setOwLocation(null);
    }
  }, [editingTask, currentEmployeeId]);

  const setDueDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setForm((prev) => ({ ...prev, due_date: dateStr }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || assignedIds.length === 0) return;

    const finalForm = {
      ...form,
      work_address: form.is_outside_work ? owLocation?.address || null : null,
      work_lat: form.is_outside_work ? owLocation?.lat || null : null,
      work_lng: form.is_outside_work ? owLocation?.lng || null : null,
      work_accuracy_m: form.is_outside_work ? owLocation?.accuracy || null : null,
    };

    if (assignedIds.length === 1) {
      onSave({ ...finalForm, assigned_to: assignedIds[0] }, editingTask?.id);
    } else {
      assignedIds.forEach((id) => {
        onSave({ ...finalForm, assigned_to: id });
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-base font-bold">
              <i className="ri-add-line" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h3>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TaskFormCoreFields
            form={form}
            setForm={setForm}
            setDueDateOffset={setDueDateOffset}
          />

          <TaskMultiAssigneeSelect
            employees={employees}
            assignedIds={assignedIds}
            setAssignedIds={setAssignedIds}
          />

          <TaskOutsideWorkSection
            isOutsideWork={form.is_outside_work}
            setIsOutsideWork={(val) => setForm((prev) => ({ ...prev, is_outside_work: val }))}
            location={owLocation}
            setLocation={setOwLocation}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim() || assignedIds.length === 0}
              className="px-6 py-2.5 bg-[#253C7D] hover:bg-[#1E293B] text-white text-xs font-bold rounded-2xl shadow-xs disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {saving ? "Saving…" : editingTask ? "Save Changes" : `Create ${assignedIds.length > 1 ? `(${assignedIds.length}) Tasks` : "Task"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
