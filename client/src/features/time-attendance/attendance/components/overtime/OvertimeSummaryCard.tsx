import { memo } from "react";

interface OvertimeSummaryCardProps {
  calculatedHours: number;
  overtimeType: string;
  fromDate: string;
  toDate: string;
  inHour: string;
  inMinute: string;
  inPeriod: "AM" | "PM";
  outHour: string;
  outMinute: string;
  outPeriod: "AM" | "PM";
  breakMinutes: number;
  saving: boolean;
  formMode?: "direct" | "request" | "request_for";
  onBack: () => void;
}

export const OvertimeSummaryCard = memo(function OvertimeSummaryCard({
  calculatedHours,
  overtimeType,
  fromDate,
  toDate,
  inHour,
  inMinute,
  inPeriod,
  outHour,
  outMinute,
  outPeriod,
  breakMinutes,
  saving,
  formMode = "direct",
  onBack,
}: OvertimeSummaryCardProps) {
  const isRequest = formMode === "request";
  const isStaffRequest = formMode === "request_for";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 dark:border-slate-800">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
          <i className="ri-pie-chart-line font-bold" />
        </span>
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
          Overtime Summary
        </h3>
      </div>

      {/* Calculated Hours Display */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#253C7D]/5 via-sky-500/5 to-transparent dark:from-sky-950/40 border border-[#253C7D]/15 dark:border-sky-800/40 text-center">
        <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Total Overtime
        </p>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-3xl sm:text-4xl font-black text-[#253C7D] dark:text-sky-300">
            {calculatedHours}
          </span>
          <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Hours</span>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
          {breakMinutes > 0 ? `(${breakMinutes}m break deducted)` : "No break deduction"}
        </p>
      </div>

      {/* Key Details List */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-slate-800">
          <span className="text-gray-500 dark:text-slate-400 font-medium">Type</span>
          <span className="font-bold text-gray-900 dark:text-slate-100 text-right">{overtimeType}</span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-slate-800">
          <span className="text-gray-500 dark:text-slate-400 font-medium">Dates</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100 text-right">
            {fromDate === toDate ? fromDate : `${fromDate} → ${toDate}`}
          </span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-slate-800">
          <span className="text-gray-500 dark:text-slate-400 font-medium">Hours</span>
          <span className="font-mono font-bold text-gray-900 dark:text-slate-100">
            {inHour}:{inMinute} {inPeriod} - {outHour}:{outMinute} {outPeriod}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-gray-500 dark:text-slate-400 font-medium">Status</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isRequest || isStaffRequest
              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
          }`}>
            {isRequest || isStaffRequest ? "Pending Approval" : "Direct Entry"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#253C7D] hover:bg-[#1E3166] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <i className="ri-save-line text-sm" />
          <span>
            {saving
              ? "Submitting..."
              : isRequest
              ? "Submit Overtime Request"
              : isStaffRequest
              ? "Submit Staff Request"
              : "Save Overtime Entry"}
          </span>
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <i className="ri-close-line text-sm" />
          <span>Cancel & Return</span>
        </button>
      </div>
    </div>
  );
});
