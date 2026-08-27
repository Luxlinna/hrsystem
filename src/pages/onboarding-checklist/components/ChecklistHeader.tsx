import { memo } from "react";
import type { OnboardingHire } from "../types";
import { getHireName } from "../checklistUtils";

interface ChecklistHeaderProps {
  selectedHire: OnboardingHire | null;
  populatingDefaults: boolean;
  onPopulateDefaultTasks: () => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onOpenAuditLogs: () => void;
}

export const ChecklistHeader = memo(function ChecklistHeader({
  selectedHire,
  populatingDefaults,
  onPopulateDefaultTasks,
  onOpenAddModal,
  onOpenExportModal,
  onOpenAuditLogs,
}: ChecklistHeaderProps) {
  const hireName = getHireName(selectedHire);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Lifecycle Management</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Onboarding Checklist</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          <span>New Hire Action Checklist</span>
          {selectedHire && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D] hidden sm:inline-flex">
              {hireName}
            </span>
          )}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Track cross-departmental onboarding milestones, IT equipment assignment, and training orientation.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={onPopulateDefaultTasks}
          disabled={populatingDefaults || !selectedHire}
          className="px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          title="Reload standard 17-item checklist"
        >
          <i className="ri-magic-line text-sm text-[#253C7D]" />
          <span>Load Standard Tasks</span>
        </button>

        <button
          onClick={onOpenExportModal}
          disabled={!selectedHire}
          className="p-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          title="Export / Print Checklist"
        >
          <i className="ri-printer-line text-sm" />
        </button>

        <button
          onClick={onOpenAuditLogs}
          disabled={!selectedHire}
          className="p-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          title="Audit Trail History"
        >
          <i className="ri-history-line text-sm" />
        </button>

        <button
          onClick={onOpenAddModal}
          disabled={!selectedHire}
          className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
        >
          <i className="ri-add-circle-line text-base" />
          <span>Add Custom Task</span>
        </button>
      </div>
    </div>
  );
});
