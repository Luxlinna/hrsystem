import { memo } from "react";
import type { ExitFormState } from "../../types";

interface ExitSeveranceSectionProps {
  form: ExitFormState;
  onChange: (field: keyof ExitFormState, value: any) => void;
}

export const ExitSeveranceSection = memo(function ExitSeveranceSection({
  form,
  onChange,
}: ExitSeveranceSectionProps) {
  const sev = form.severance_pay_info || {};

  const updateSev = (key: string, val: any) => {
    const updated = { ...sev, [key]: val };
    const total =
      (Number(updated.severance_amount) || 0) +
      (Number(updated.unused_leave_amount) || 0) +
      (Number(updated.notice_pay_amount) || 0);
    updated.total_amount = total;
    onChange("severance_pay_info", updated);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <span className="text-xs font-black tracking-wider text-sky-600 uppercase">
          Serverance Pay Info
        </span>
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 select-none">
          <input
            type="checkbox"
            checked={Boolean(sev.eligible)}
            onChange={(e) => updateSev("eligible", e.target.checked)}
            className="w-3.5 h-3.5 text-[#253C7D] rounded border-slate-300 focus:ring-[#253C7D]"
          />
          Eligible for Severance
        </label>
      </div>

      {sev.eligible ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Severance Amount ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sev.severance_amount || ""}
              onChange={(e) => updateSev("severance_amount", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Unused Leave Pay ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sev.unused_leave_amount || ""}
              onChange={(e) => updateSev("unused_leave_amount", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Notice Pay ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sev.notice_pay_amount || ""}
              onChange={(e) => updateSev("notice_pay_amount", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="md:col-span-3 flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-xs font-extrabold text-slate-800">
              Total Severance Settlement:
            </span>
            <span className="font-mono text-sm font-black text-[#253C7D]">
              ${(sev.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 italic py-1">
          No severance pay required for this exit type (check &ldquo;Eligible for Severance&rdquo; above to specify severance compensation).
        </div>
      )}
    </div>
  );
});
