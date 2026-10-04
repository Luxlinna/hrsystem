import { memo } from "react";
import type { OnboardingHire, ChecklistTask } from "../../types";
import { getHireName } from "../../checklistUtils";
import {
  exportChecklistPDF,
  exportChecklistXLSX,
} from "../../exportUtils";

interface ExportChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHire: OnboardingHire | null;
  hireTasks: ChecklistTask[];
}

export const ExportChecklistModal = memo(function ExportChecklistModal({
  isOpen,
  onClose,
  selectedHire,
  hireTasks,
}: ExportChecklistModalProps) {
  if (!isOpen || !selectedHire) return null;

  const hireName = getHireName(selectedHire);
  const emp = selectedHire.employees;
  const completedCount = hireTasks.filter((t) => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-5 gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">Onboarding Checklist Summary</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Employee: <span className="text-gray-900 font-extrabold">{hireName}</span> &middot; {emp?.role || "Staff"} &middot; {emp?.department || "General"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => exportChecklistPDF(selectedHire, hireTasks)}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Save as PDF"
            >
              <i className="ri-file-pdf-line" /> PDF
            </button>
            <button
              type="button"
              onClick={() => exportChecklistXLSX(selectedHire, hireTasks)}
              className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export Excel"
            >
              <i className="ri-file-excel-line" /> Excel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer ml-1"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Progress Snapshot */}
        <div className="p-3 bg-gray-50 rounded-2xl mb-4 text-xs flex items-center justify-between">
          <span className="font-bold text-gray-700">Total Completion:</span>
          <span className="font-extrabold text-[#253C7D]">
            {completedCount} of {hireTasks.length} tasks completed ({Math.round((completedCount / (hireTasks.length || 1)) * 100)}%)
          </span>
        </div>

        {/* Tasks Checklist */}
        <div className="space-y-2 divide-y divide-gray-100">
          {hireTasks.map((t, idx) => (
            <div key={t.id} className="pt-2 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-bold text-gray-400 text-[10px] mt-0.5">{idx + 1}.</span>
                <div>
                  <p className={`font-bold ${t.completed ? "text-gray-900" : "text-gray-500"}`}>
                    {t.task_name}
                  </p>
                  {t.description && <p className="text-[11px] text-gray-400">{t.description}</p>}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    t.completed ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.completed ? "Completed" : "Pending"}
                </span>
                {t.assigned_to && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Assignee: {t.assigned_to}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sign-off footer */}
        <div className="pt-8 border-t border-gray-200 mt-6 grid grid-cols-2 gap-8 text-xs text-gray-500">
          <div>
            <p className="font-bold text-gray-800">HR Manager Signature:</p>
            <div className="mt-8 border-b border-gray-300 w-48" />
            <p className="text-[10px] text-gray-400 mt-1">Date: _______________</p>
          </div>
          <div>
            <p className="font-bold text-gray-800">Department Lead Signature:</p>
            <div className="mt-8 border-b border-gray-300 w-48" />
            <p className="text-[10px] text-gray-400 mt-1">Date: _______________</p>
          </div>
        </div>
      </div>
    </div>
  );
});
