import { memo } from "react";

interface ComplaintHeaderProps {
  onNew: () => void;
  onExportCSV: () => void;
  onExportXLSX: () => void;
}

export const ComplaintHeader = memo(function ComplaintHeader({
  onNew,
  onExportCSV,
  onExportXLSX,
}: ComplaintHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)" }}
        >
          <i className="ri-feedback-line text-white text-base" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Complaints & Suggestions
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Track grievances, employee feedback, and improvement suggestions
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Export Dropdown */}
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
              <i className="ri-file-excel-2-line text-green-600" />
              Excel (.xlsx)
            </button>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer border-t border-gray-100"
            >
              <i className="ri-file-text-line text-blue-500" />
              CSV (.csv)
            </button>
          </div>
        </div>

        {/* New Button */}
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}
        >
          <i className="ri-add-line text-sm" />
          New Entry
        </button>
      </div>
    </div>
  );
});
