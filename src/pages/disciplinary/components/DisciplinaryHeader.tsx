import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { DisciplinaryExportMenu } from "./DisciplinaryExportMenu";

interface DisciplinaryHeaderProps {
  recordsCount: number;
  canManage: boolean;
  onExportCSV?: () => void;
  onOpenCreateModal: () => void;
  records?: DisciplinaryRecord[];
}

export const DisciplinaryHeader = memo(function DisciplinaryHeader({
  recordsCount,
  canManage,
  onOpenCreateModal,
  records = [],
}: DisciplinaryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Employee Relations</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Disciplinary &amp; PIP Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Disciplinary &amp; Incidents
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            {recordsCount} Cases
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {canManage
            ? "Track warnings, safety incidents, and performance improvement plans (PIPs) with follow-up milestones."
            : "View your warnings, incident reports, and performance improvement plans."}
        </p>
      </div>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <DisciplinaryExportMenu records={records} />

        {canManage && (
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-alert-line text-base font-bold" />
            Log Incident / PIP
          </button>
        )}
      </div>
    </div>
  );
});
