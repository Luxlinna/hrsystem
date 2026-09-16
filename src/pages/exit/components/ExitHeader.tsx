import { memo } from "react";
import type { EmployeeExit } from "../types";

interface ExitHeaderProps {
  onRecord: () => void;
  exits: EmployeeExit[];
  onExportCSV: () => void;
  onExportXLSX: () => void;
  canManageSettings?: boolean;
  onOpenSettings?: () => void;
}

export const ExitHeader = memo(function ExitHeader({
  onRecord,
  onExportCSV,
  onExportXLSX,
  canManageSettings,
  onOpenSettings,
}: ExitHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#1a2e5e,#3554a5)" }}>
            <i className="ri-logout-box-r-line text-white text-base" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Exit Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Record and track employee departures</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Settings Button (BU CEO Admin, SuperAdmin, or permitted role) */}
        {canManageSettings && onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
          >
            <i className="ri-settings-3-line text-[#253C7D] text-sm" />
            Setting
          </button>
        )}

        {/* Export dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shadow-xs">
            <i className="ri-download-line" />
            Export
            <i className="ri-arrow-down-s-line text-gray-400" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button
              onClick={onExportXLSX}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <i className="ri-file-excel-2-line text-green-600" />Excel
            </button>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer border-t border-gray-100"
            >
              <i className="ri-file-text-line text-blue-500" />CSV
            </button>
          </div>
        </div>

        {/* Record Exit */}
        <button
          onClick={onRecord}
          className="flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          style={{ background: "linear-gradient(135deg,#253C7D,#3554a5)" }}
        >
          <i className="ri-add-line text-sm" />
          Record Exit
        </button>
      </div>
    </div>
  );
});
