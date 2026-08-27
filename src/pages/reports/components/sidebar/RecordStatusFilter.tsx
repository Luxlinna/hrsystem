type RecordStatus = "all" | "active" | "deleted";

interface StatusOption {
  value: RecordStatus;
  label: string;
  activeClass: string;
}

const OPTIONS: StatusOption[] = [
  { value: "all", label: "All", activeClass: "bg-[#253C7D] text-white shadow-xs" },
  { value: "active", label: "Active", activeClass: "bg-emerald-600 text-white shadow-xs" },
  { value: "deleted", label: "Deleted", activeClass: "bg-rose-600 text-white shadow-xs" },
];

interface RecordStatusFilterProps {
  recordStatus: RecordStatus;
  setRecordStatus: (v: RecordStatus) => void;
}

export function RecordStatusFilter({ recordStatus, setRecordStatus }: RecordStatusFilterProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Record Status</p>
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
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRecordStatus(opt.value)}
            className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
              recordStatus === opt.value
                ? opt.activeClass
                : "text-gray-600 hover:text-gray-900 hover:bg-white/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
