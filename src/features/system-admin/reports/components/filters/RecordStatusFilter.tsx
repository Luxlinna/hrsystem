import { memo } from "react";

interface RecordStatusFilterProps {
  recordStatus: "all" | "active" | "deleted";
  setRecordStatus: (st: "all" | "active" | "deleted") => void;
}

export const RecordStatusFilter = memo(function RecordStatusFilter({
  recordStatus,
  setRecordStatus,
}: RecordStatusFilterProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Record Status
        </p>
        {recordStatus !== "all" && (
          <button
            onClick={() => setRecordStatus("all")}
            className="text-[11px] text-[#253C7D] hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-200/80">
        <button
          type="button"
          onClick={() => setRecordStatus("all")}
          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
            recordStatus === "all"
              ? "bg-[#253C7D] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/80"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setRecordStatus("active")}
          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
            recordStatus === "active"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-gray-600 hover:text-emerald-700 hover:bg-white/80"
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setRecordStatus("deleted")}
          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
            recordStatus === "deleted"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-gray-600 hover:text-rose-700 hover:bg-white/80"
          }`}
        >
          Deleted
        </button>
      </div>
    </div>
  );
});
