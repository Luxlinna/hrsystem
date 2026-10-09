import React, { useState } from "react";
import type { EmployeeExit } from "../types";
import { toast } from "@/components/Toast";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

interface ExitInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exitItem: EmployeeExit | null;
}

export const ExitInterviewModal: React.FC<ExitInterviewModalProps> = ({
  isOpen,
  onClose,
  exitItem,
}) => {
  const [feedback, setFeedback] = useState("");
  const [satisfaction, setSatisfaction] = useState("Neutral");
  const [handoverComplete, setHandoverComplete] = useState(true);

  if (!isOpen || !exitItem) return null;

  const emp = exitItem.employees as any;
  const name = formatKhmerFullName(emp);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Exit Interview Saved", `Exit interview recorded for ${name}.`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-2xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden text-xs">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-chat-1-line text-base text-[#253C7D]" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Exit Interview - {name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Overall Experience / Satisfaction</label>
            <select
              value={satisfaction}
              onChange={(e) => setSatisfaction(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="Very Satisfied">Very Satisfied</option>
              <option value="Satisfied">Satisfied</option>
              <option value="Neutral">Neutral</option>
              <option value="Dissatisfied">Dissatisfied</option>
              <option value="Very Dissatisfied">Very Dissatisfied</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Key Feedback & Reasons for Leaving</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Record notes, suggestions, and career feedback..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={handoverComplete}
              onChange={(e) => setHandoverComplete(e.target.checked)}
              className="w-4 h-4 rounded text-[#253C7D]"
            />
            <span>Assets and responsibilities handover verified</span>
          </label>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#253C7D] text-white hover:bg-[#1E3066] cursor-pointer"
            >
              Save Interview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
