import { memo } from "react";
import { OVERTIME_TYPES } from "../../types/overtimeTypes";

interface OvertimeTypeInfoSectionProps {
  overtimeType: string;
  setOvertimeType: (v: string) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  inHour: string;
  setInHour: (v: string) => void;
  inMinute: string;
  setInMinute: (v: string) => void;
  inPeriod: "AM" | "PM";
  setInPeriod: (v: "AM" | "PM") => void;
  outHour: string;
  setOutHour: (v: string) => void;
  outMinute: string;
  setOutMinute: (v: string) => void;
  outPeriod: "AM" | "PM";
  setOutPeriod: (v: "AM" | "PM") => void;
  breakMinutes: number;
  setBreakMinutes: (v: number) => void;
  calculatedHours: number;
  reason: string;
  setReason: (v: string) => void;
  remark: string;
  setRemark: (v: string) => void;
}

export const OvertimeTypeInfoSection = memo(function OvertimeTypeInfoSection({
  overtimeType, setOvertimeType, fromDate, setFromDate, toDate, setToDate,
  inHour, setInHour, inMinute, setInMinute, inPeriod, setInPeriod,
  outHour, setOutHour, outMinute, setOutMinute, outPeriod, setOutPeriod,
  breakMinutes, setBreakMinutes, calculatedHours, reason, setReason, remark, setRemark,
}: OvertimeTypeInfoSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-5">
      <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 dark:border-slate-800">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
          <i className="ri-time-line font-bold" />
        </span>
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
          Overtime Schedule & Details
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
        {/* Overtime Type */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Overtime Type <span className="text-rose-500">*</span>
          </label>
          <select
            value={overtimeType}
            onChange={(e) => setOvertimeType(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer transition-all"
          >
            {OVERTIME_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            From Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer transition-all"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            To Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer transition-all"
          />
        </div>

        {/* Time In */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Time In <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <input
                type="text" maxLength={2} value={inHour}
                onChange={(e) => setInHour(e.target.value.replace(/\D/g, ""))}
                className="w-full py-0.5 text-center font-mono text-xs font-black text-gray-900 dark:text-slate-100 bg-transparent focus:outline-none"
              />
              <span className="text-gray-400 font-bold px-1">:</span>
              <input
                type="text" maxLength={2} value={inMinute}
                onChange={(e) => setInMinute(e.target.value.replace(/\D/g, ""))}
                className="w-full py-0.5 text-center font-mono text-xs font-black text-gray-900 dark:text-slate-100 bg-transparent focus:outline-none"
              />
            </div>
            <div className="inline-flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200 dark:border-slate-700 shrink-0">
              <button
                type="button" onClick={() => setInPeriod("AM")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${inPeriod === "AM" ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-400 shadow-xs" : "text-gray-500"}`}
              >AM</button>
              <button
                type="button" onClick={() => setInPeriod("PM")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${inPeriod === "PM" ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-400 shadow-xs" : "text-gray-500"}`}
              >PM</button>
            </div>
          </div>
        </div>

        {/* Time Out */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Time Out <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <input
                type="text" maxLength={2} value={outHour}
                onChange={(e) => setOutHour(e.target.value.replace(/\D/g, ""))}
                className="w-full py-0.5 text-center font-mono text-xs font-black text-gray-900 dark:text-slate-100 bg-transparent focus:outline-none"
              />
              <span className="text-gray-400 font-bold px-1">:</span>
              <input
                type="text" maxLength={2} value={outMinute}
                onChange={(e) => setOutMinute(e.target.value.replace(/\D/g, ""))}
                className="w-full py-0.5 text-center font-mono text-xs font-black text-gray-900 dark:text-slate-100 bg-transparent focus:outline-none"
              />
            </div>
            <div className="inline-flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200 dark:border-slate-700 shrink-0">
              <button
                type="button" onClick={() => setOutPeriod("AM")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${outPeriod === "AM" ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-400 shadow-xs" : "text-gray-500"}`}
              >AM</button>
              <button
                type="button" onClick={() => setOutPeriod("PM")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${outPeriod === "PM" ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-400 shadow-xs" : "text-gray-500"}`}
              >PM</button>
            </div>
          </div>
        </div>

        {/* Allow Break Min */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Allow Break (Minutes)
          </label>
          <input
            type="number" min={0} step={5} value={breakMinutes}
            onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="0"
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Overtime Period */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Overtime Period (Calculated)
          </label>
          <div className="w-full px-3.5 py-2.5 bg-[#253C7D]/5 dark:bg-sky-950/30 border border-[#253C7D]/20 dark:border-sky-800/40 rounded-xl text-xs font-extrabold text-[#253C7D] dark:text-sky-300 flex items-center justify-between">
            <span>{calculatedHours} Hours</span>
            <i className="ri-time-line text-sm opacity-60" />
          </div>
        </div>

        {/* Reason */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            required rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for overtime..."
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] resize-none"
          />
        </div>

        {/* Remark */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
            Remark (Optional)
          </label>
          <textarea
            rows={2} value={remark} onChange={(e) => setRemark(e.target.value)}
            placeholder="Optional remarks..."
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] resize-none"
          />
        </div>
      </div>
    </div>
  );
});
