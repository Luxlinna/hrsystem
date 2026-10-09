import { memo, useState } from "react";
import type { NoticePeriodValidation } from "../../utils/noticePeriodUtils";

interface ExitNoticePeriodNoticeProps {
  validation: NoticePeriodValidation;
  onApplyMinDate?: (dateStr: string) => void;
}

const formatDMY = (d?: string | null) => {
  if (!d) return "—";
  try {
    const parts = d.split("T")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
  } catch {
    return d;
  }
};

export const ExitNoticePeriodNotice = memo(function ExitNoticePeriodNotice({
  validation,
  onApplyMinDate,
}: ExitNoticePeriodNoticeProps) {
  const [showPolicyTable, setShowPolicyTable] = useState(false);

  if (!validation.isPermanent) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 p-3.5 space-y-2.5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Permanent Contract Notice Policy
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowPolicyTable((prev) => !prev)}
          className="text-[11px] text-sky-600 hover:text-sky-700 font-medium hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>{showPolicyTable ? "Hide policy" : "View notice tiers"}</span>
          <i className={`ri-arrow-down-s-line transition-transform ${showPolicyTable ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
        <div>
          <span className="text-slate-500">Service Tenure: </span>
          <strong className="text-slate-800 dark:text-slate-100 font-semibold">
            {validation.tenureDisplay}
          </strong>
          {validation.startDate && (
            <span className="text-slate-400 block text-[10px]">
              Started on {formatDMY(validation.startDate)}
            </span>
          )}
        </div>
        <div>
          <span className="text-slate-500">Required Notice: </span>
          <strong className="text-[#253C7D] dark:text-sky-400 font-bold block">
            {validation.requiredNoticeLabel}
          </strong>
        </div>
      </div>

      {showPolicyTable && (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-700 text-[11px] space-y-1 animate-in fade-in duration-100">
          <div className="font-bold text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
            Labor Policy Notice Requirements:
          </div>
          <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[10.5px]">
            <li className="flex justify-between">
              <span>Less than 6 months:</span>
              <strong className="text-slate-700 dark:text-slate-200">7 days notice</strong>
            </li>
            <li className="flex justify-between">
              <span>6 months to 2 years:</span>
              <strong className="text-slate-700 dark:text-slate-200">15 days notice</strong>
            </li>
            <li className="flex justify-between">
              <span>2 years up to 5 years:</span>
              <strong className="text-slate-700 dark:text-slate-200">1 month notice</strong>
            </li>
            <li className="flex justify-between">
              <span>5 years up to 10 years:</span>
              <strong className="text-slate-700 dark:text-slate-200">2 months notice</strong>
            </li>
            <li className="flex justify-between">
              <span>More than 10 years:</span>
              <strong className="text-slate-700 dark:text-slate-200">3 months notice</strong>
            </li>
          </ul>
        </div>
      )}

      {/* Compliance / Shortfall Alert */}
      {!validation.isCompliant ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <i className="ri-error-warning-fill text-amber-600 dark:text-amber-400 text-sm mt-0.5 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold">Notice Shortfall ({validation.shortfallDays} days short): </span>
              <span>Earliest compliant effective date is </span>
              <strong>{formatDMY(validation.minCompliantDate)}</strong>.
            </div>
          </div>
          {onApplyMinDate && (
            <button
              type="button"
              onClick={() => onApplyMinDate(validation.minCompliantDate)}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
            >
              Use {formatDMY(validation.minCompliantDate)}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[11px]">
          <i className="ri-checkbox-circle-fill text-emerald-600 dark:text-emerald-400 text-sm shrink-0" />
          <span>
            Compliant with policy ({validation.selectedNoticeDays} days advance notice provided).
          </span>
        </div>
      )}
    </div>
  );
});
