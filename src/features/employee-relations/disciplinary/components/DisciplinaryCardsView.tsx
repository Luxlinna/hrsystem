import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { DisciplinaryCard } from "./DisciplinaryCard";

interface DisciplinaryCardsViewProps {
  records: DisciplinaryRecord[];
  selectedRecordId: string | null;
  canManage: boolean;
  onSelectRecord: (record: DisciplinaryRecord) => void;
  onOpenCreateModal: () => void;
}

export const DisciplinaryCardsView = memo(function DisciplinaryCardsView({
  records,
  selectedRecordId,
  canManage,
  onSelectRecord,
  onOpenCreateModal,
}: DisciplinaryCardsViewProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-file-shield-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Disciplinary Records Found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No incident reports or PIP cases match your selected tab, severity filter, or search query.
        </p>
        {canManage && (
          <button
            onClick={onOpenCreateModal}
            className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
          >
            + Log Incident / PIP
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {records.map((r) => (
        <DisciplinaryCard
          key={r.id}
          record={r}
          isSelected={selectedRecordId === r.id}
          onSelect={onSelectRecord}
        />
      ))}
    </div>
  );
});
