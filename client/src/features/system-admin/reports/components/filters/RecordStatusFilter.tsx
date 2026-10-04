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
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Record Status
        </label>
        {recordStatus !== "all" && (
          <button
            onClick={() => setRecordStatus("all")}
            className="text-[11px] text-[#253C7D] font-medium hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/80 rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setRecordStatus("all")}
          className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
            recordStatus === "all"
              ? "bg-[#253C7D] text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setRecordStatus("active")}
          className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
            recordStatus === "active"
              ? "bg-emerald-600 text-white shadow-2xs"
              : "text-slate-600 hover:text-emerald-700 hover:bg-white/80"
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setRecordStatus("deleted")}
          className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
            recordStatus === "deleted"
              ? "bg-rose-600 text-white shadow-2xs"
              : "text-slate-600 hover:text-rose-700 hover:bg-white/80"
          }`}
        >
          Deleted
        </button>
      </div>
    </div>
  );
});
