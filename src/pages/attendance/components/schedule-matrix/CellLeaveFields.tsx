import { memo } from "react";
import { CellLeaveAttachment } from "./CellLeaveAttachment";

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave (AL)" },
  { value: "sick", label: "Sick Leave (SL)" },
  { value: "special", label: "Special Leave (SP)" },
  { value: "maternity", label: "Maternity Leave (ML)" },
  { value: "paternity", label: "Paternity Leave (PL)" },
  { value: "unpaid", label: "Unpaid Leave (UL)" },
  { value: "bereavement", label: "Bereavement (BL)" },
  { value: "study", label: "Study Leave (STL)" },
];

function formatDateDisplay(ymd: string): string {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-");
  return y && m && d ? `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}` : ymd;
}

interface CellLeaveFieldsProps {
  leaveType: string;
  setLeaveType: (v: string) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  reason: string;
  setReason: (v: string) => void;
  remark: string;
  setRemark: (v: string) => void;
  showDeductionPeriod: boolean;
  setShowDeductionPeriod: React.Dispatch<React.SetStateAction<boolean>>;
  totalDays: number;
  attachmentFile: File | null;
  setAttachmentFile: (f: File | null) => void;
}

export const CellLeaveFields = memo(function CellLeaveFields({
  leaveType,
  setLeaveType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  reason,
  setReason,
  remark,
  setRemark,
  showDeductionPeriod,
  setShowDeductionPeriod,
  totalDays,
  attachmentFile,
  setAttachmentFile,
}: CellLeaveFieldsProps) {
  return (
    <>
      <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">LEAVE TYPE INFO</h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
            Leave Type <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-9 relative">
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3.5 py-2 pr-9 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:border-[#0284c7] cursor-pointer appearance-none"
            >
              {LEAVE_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>{lt.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <i className="ri-arrow-down-s-fill text-xs" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
            From Date <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-9">
            <input
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:border-[#0284c7]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
            To Date <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-9">
            <input
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:border-[#0284c7]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300 pt-2">
            Reason <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-9">
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:border-[#0284c7] resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300 pt-2">
            Remark
          </label>
          <div className="sm:col-span-9">
            <textarea
              rows={2}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Remark"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:border-[#0284c7] resize-none"
            />
          </div>
        </div>

        <div className="sm:ml-[25%] pt-1">
          <button
            type="button"
            onClick={() => setShowDeductionPeriod((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-md text-xs font-medium shadow-2xs cursor-pointer"
          >
            <i className="ri-information-line text-sm" />
            <span>{showDeductionPeriod ? "Hide deduction period" : "Show deduction period"}</span>
          </button>

          {showDeductionPeriod && (
            <div className="mt-3 p-4 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-sky-900 dark:text-sky-200 pb-1.5 border-b border-sky-200 dark:border-sky-800/60">
                <span>Deduction Schedule Breakdown</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-sky-200 dark:bg-sky-800 font-extrabold">
                  {totalDays} {totalDays === 1 ? "Day" : "Days"} Total
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Start Date</p>
                  <p className="font-semibold text-gray-800 dark:text-slate-200">{formatDateDisplay(fromDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">End Date</p>
                  <p className="font-semibold text-gray-800 dark:text-slate-200">{formatDateDisplay(toDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Deduction Type</p>
                  <p className="font-semibold text-gray-800 dark:text-slate-200 uppercase">Paid Leave</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Status</p>
                  <p className="font-bold text-amber-600 dark:text-amber-400">Pending Approval</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CellLeaveAttachment
        attachmentFile={attachmentFile}
        setAttachmentFile={setAttachmentFile}
      />
    </>
  );
});
