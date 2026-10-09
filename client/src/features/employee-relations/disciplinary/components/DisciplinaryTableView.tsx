import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { DisciplinaryTableRow } from "./DisciplinaryTableRow";

interface DisciplinaryTableViewProps {
  records: DisciplinaryRecord[];
  onSelectRecord: (record: DisciplinaryRecord) => void;
  onEditRecord?: (record: DisciplinaryRecord) => void;
  onVoidRecord?: (record: DisciplinaryRecord) => void;
  onDeleteRecord?: (record: DisciplinaryRecord) => void;
}

export const DisciplinaryTableView = memo(function DisciplinaryTableView({
  records,
  onSelectRecord,
  onEditRecord,
  onVoidRecord,
  onDeleteRecord,
}: DisciplinaryTableViewProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
        No warning records found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-bold text-xs">
              <th className="px-4 py-3.5 w-14">No.</th>
              <th className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>Warning Type</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <div className="leading-tight">
                    <div>Warning</div>
                    <div>Date</div>
                  </div>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <span>Employee</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 min-w-[220px]">
                <div className="flex items-center gap-1">
                  <span>Description of Violation</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 min-w-[220px]">
                <div className="flex items-center gap-1">
                  <span>Employee Promise</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-center w-24 whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <i className="ri-arrow-up-down-line text-slate-300 text-[11px]" />
                </div>
              </th>
              <th className="px-4 py-3.5 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r, idx) => (
              <DisciplinaryTableRow
                key={r.id}
                record={r}
                index={idx + 1}
                onSelectRecord={onSelectRecord}
                onEditRecord={onEditRecord}
                onVoidRecord={onVoidRecord}
                onDeleteRecord={onDeleteRecord}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
