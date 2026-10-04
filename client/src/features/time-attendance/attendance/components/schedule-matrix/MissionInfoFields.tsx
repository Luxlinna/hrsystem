import { memo } from "react";

interface MissionInfoFieldsProps {
  missionType: string;
  setMissionType: (v: string) => void;
  missionFor: "daily" | "hourly" | "half_day";
  setMissionFor: (v: "daily" | "hourly" | "half_day") => void;
  subject: string;
  setSubject: (v: string) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  totalDays: number;
  setTotalDays: (v: number | ((prev: number) => number)) => void;
  detail: string;
  setDetail: (v: string) => void;
  remark: string;
  setRemark: (v: string) => void;
}

export const MissionInfoFields = memo(function MissionInfoFields({
  missionType, setMissionType, missionFor, setMissionFor, subject, setSubject,
  fromDate, setFromDate, toDate, setToDate, totalDays, setTotalDays,
  detail, setDetail, remark, setRemark,
}: MissionInfoFieldsProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
      <h3 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">MISSION INFO</h3>

      {/* Mission Type */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          Mission Type <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <select value={missionType} onChange={(e) => setMissionType(e.target.value)} required className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500 cursor-pointer">
            <option value="">Search...</option>
            <option value="Official Mission">Official Mission</option>
            <option value="Client Visit">Client Visit</option>
            <option value="Branch Audit">Branch Audit</option>
            <option value="Site Inspection">Site Inspection</option>
            <option value="Training Mission">Training Mission</option>
            <option value="Conference">Conference / Seminar</option>
            <option value="Project Deployment">Project Deployment</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Mission For */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">Mission For</label>
        <div className="sm:col-span-9 flex items-center gap-6 text-xs text-gray-700 dark:text-slate-200">
          {(["daily", "hourly", "half_day"] as const).map((mode) => (
            <label key={mode} className="inline-flex items-center gap-2 cursor-pointer capitalize">
              <input type="radio" name="missionFor" value={mode} checked={missionFor === mode} onChange={() => setMissionFor(mode)} className="text-[#0284c7] focus:ring-sky-500" />
              <span>{mode === "half_day" ? "Half Day" : mode}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Mission Subject */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          Mission Subject <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <input type="text" required placeholder="Mission Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500" />
        </div>
      </div>

      {/* From Date */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          From Date <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <input type="date" required value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500 cursor-pointer" />
        </div>
      </div>

      {/* To Date */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          To Date <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <input type="date" required value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500 cursor-pointer" />
        </div>
      </div>

      {/* Total Days */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          Total Days <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9 flex items-center">
          <button type="button" onClick={() => setTotalDays((d) => Math.max(1, d - 1))} className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-slate-700 rounded-l-md hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 cursor-pointer">‹</button>
          <div className="w-16 h-8 flex items-center justify-center border-t border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-800 select-none">{totalDays}</div>
          <button type="button" onClick={() => setTotalDays((d) => d + 1)} className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-slate-700 rounded-r-md hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 cursor-pointer">›</button>
        </div>
      </div>

      {/* Mission Detail */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300 pt-2">
          Mission Detail <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <textarea required rows={3} placeholder="Mission Detail" value={detail} onChange={(e) => setDetail(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500" />
        </div>
      </div>

      {/* Remark */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300 pt-2">Remark</label>
        <div className="sm:col-span-9">
          <textarea rows={2} placeholder="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500" />
        </div>
      </div>
    </div>
  );
});
