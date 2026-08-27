import { memo } from "react";

interface DisciplinaryHeaderProps {
  recordsCount: number;
  canManage: boolean;
  onExportCSV: () => void;
  onOpenCreateModal: () => void;
}

export const DisciplinaryHeader = memo(function DisciplinaryHeader({
  recordsCount,
  canManage,
  onExportCSV,
  onOpenCreateModal,
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
        <button
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
          Export Records
        </button>

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
