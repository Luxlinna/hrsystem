import { useState } from "react";
import type { Holiday } from "@/services/holidays/holidaysService";
import { toast } from "@/components/Toast";

interface AddHolidayFormProps {
  year: number;
  onAddHoliday: (holiday: Omit<Holiday, "id" | "created_at">) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function AddHolidayForm({ year, onAddHoliday, onClose }: AddHolidayFormProps) {
  const [newDate, setNewDate] = useState("");
  const [newName, setNewName] = useState("");
  const [newKhName, setNewKhName] = useState("");
  const [newIsPaid, setNewIsPaid] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newName.trim()) {
      toast("Error", "Please provide date and holiday name", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await onAddHoliday({
        date: newDate,
        name: newName.trim(),
        local_name: newKhName.trim() || null,
        year: parseInt(newDate.substring(0, 4), 10) || year,
        is_paid: newIsPaid,
      });

      if (res.success) {
        toast("Success", "Custom holiday added successfully", "success");
        onClose();
        setNewDate("");
        setNewName("");
        setNewKhName("");
        setNewIsPaid(true);
      } else {
        toast("Error", res.error || "Failed to add holiday", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="p-4 sm:p-5 bg-purple-50/40 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/40 animate-in slide-in-from-top duration-150">
      <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-1.5">
        <i className="ri-add-circle-fill text-purple-600" />
        Add Custom Company Holiday / Compensatory Day
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Holiday Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Company Anniversary"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={newIsPaid}
            onChange={(e) => setNewIsPaid(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
          />
          <span>Paid Holiday (100% Salary, 2.0x OT if worked)</span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Holiday"}
          </button>
        </div>
      </div>
    </form>
  );
}
