import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { RecordDetailsBody } from "./RecordDetailsBody";

interface RecordDetailsDrawerProps {
  selectedRecord: AttendanceRecord | null;
  onClose: () => void;
  canManage: boolean;
  onOpenEditModal: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
}

export const RecordDetailsDrawer = memo(function RecordDetailsDrawer({
  selectedRecord,
  onClose,
  canManage,
  onOpenEditModal,
  onDeleteRecord,
}: RecordDetailsDrawerProps) {
  if (!selectedRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative w-full sm:w-[440px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          {/* Drawer Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Attendance Log Details</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(selectedRecord.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer">
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          <RecordDetailsBody selectedRecord={selectedRecord} />
        </div>

        {/* Drawer Actions */}
        {canManage && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onOpenEditModal(selectedRecord)}
              className="px-4 py-2.5 bg-[#253C7D] text-white rounded-xl text-xs font-bold hover:bg-[#1E3064] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <i className="ri-edit-line" />
              Edit Record
            </button>
            <button
              type="button"
              onClick={() => onDeleteRecord(selectedRecord.id)}
              className="px-4 py-2.5 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="ri-delete-bin-line" />
              Delete Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
