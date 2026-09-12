import { memo } from "react";

interface ProposalCompensationSectionProps {
  baseSalary: number | "";
  setBaseSalary: (v: number | "") => void;
  isBasedOnQualification: boolean;
  setIsBasedOnQualification: (v: boolean) => void;
  probationSalary: number | "";
  setProbationSalary: (v: number | "") => void;
  probationMonths: number;
  setProbationMonths: (v: number) => void;
  targetStartDate: string;
  setTargetStartDate: (v: string) => void;
}

export const ProposalCompensationSection = memo(function ProposalCompensationSection({
  baseSalary,
  setBaseSalary,
  isBasedOnQualification,
  setIsBasedOnQualification,
  probationSalary,
  setProbationSalary,
  probationMonths,
  setProbationMonths,
  targetStartDate,
  setTargetStartDate,
}: ProposalCompensationSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <i className="ri-wallet-3-line text-blue-600" /> Proposed Remuneration &amp; Schedule
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Gross Base Salary ($/mo) {!isBasedOnQualification && <span className="text-rose-500">*</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
            <input
              type="number"
              min="0"
              step="any"
              required={!isBasedOnQualification}
              placeholder={isBasedOnQualification ? "e.g. 300 (or leave 0)" : "e.g. 800"}
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value === "" ? "" : Number(e.target.value))}
              className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                isBasedOnQualification ? "border-blue-400 bg-blue-50/20" : "border-slate-300"
              }`}
            />
          </div>
          <div className="mt-2">
            <label
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer select-none transition-all ${
                isBasedOnQualification
                  ? "bg-blue-50 border-blue-300 text-blue-800 shadow-2xs font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isBasedOnQualification}
                onChange={(e) => setIsBasedOnQualification(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Based on qualification</span>
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Probation Salary ($/mo) <span className="text-slate-400 text-[10px]">(Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 700"
              value={probationSalary}
              onChange={(e) => setProbationSalary(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            During probation period
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Probation Duration</label>
          <select
            value={probationMonths}
            onChange={(e) => setProbationMonths(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value={1}>1 Month</option>
            <option value={2}>2 Months</option>
            <option value={3}>3 Months (Standard)</option>
            <option value={6}>6 Months</option>
          </select>
          <span className="text-[11px] text-slate-400 block mt-2">
            Standard trial duration
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Target Commencement Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={targetStartDate}
            onChange={(e) => setTargetStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Working Schedule</label>
          <input
            type="text"
            readOnly
            value="Monday to Saturday Half (8:00 am – 5:00 pm)"
            className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-medium text-slate-600"
          />
        </div>
      </div>
    </div>
  );
});
