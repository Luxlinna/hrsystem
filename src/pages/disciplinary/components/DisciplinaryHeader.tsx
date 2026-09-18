import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { DisciplinaryExportMenu } from "./DisciplinaryExportMenu";

interface DisciplinaryHeaderProps {
  recordsCount: number;
  canManage: boolean;
  onExportCSV?: () => void;
  onOpenCreateModal: () => void;
  records?: DisciplinaryRecord[];
  canManageSettings?: boolean;
  onOpenSettings?: () => void;
}

export const DisciplinaryHeader = memo(function DisciplinaryHeader({
  recordsCount,
  canManage,
  onOpenCreateModal,
  records = [],
  canManageSettings,
  onOpenSettings,
}: DisciplinaryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Employee Relations</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Employee Warnings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
          Employee Warnings
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            {recordsCount} Records
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          {canManage
            ? "Track formal warnings, corrective actions, employee promises, and performance improvement plans."
            : "View your warnings, incident reports, and performance improvement plans."}
        </p>
      </div>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <DisciplinaryExportMenu records={records} />

        {canManageSettings && onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all border border-gray-200 dark:border-slate-700 shadow-2xs hover:bg-gray-50 dark:hover:bg-slate-750 cursor-pointer"
          >
            <i className="ri-settings-3-line text-[#253C7D] text-base" />
            Setting
          </button>
        )}

        {canManage && (
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-file-shield-line text-base font-bold" />
            Issue Warning / Log Incident
          </button>
        )}
      </div>
    </div>
  );
});
