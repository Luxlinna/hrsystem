import React from "react";
import type { BranchFormState } from "../../types";

interface BranchScheduleTabProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
}

export function BranchScheduleTab({ form, setForm }: BranchScheduleTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[12px] font-bold text-gray-800">
          Work Schedule & Grace Policy
        </label>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Configure shift hours and the chance given to branch employees for late arrivals and early timeouts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Check-In Start Time</label>
          <input
            type="time"
            value={form.work_start_time}
            onChange={(e) => setForm({ ...form, work_start_time: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
          />
          <p className="text-[10px] text-gray-400 mt-1">Check-ins after this time calculate late minutes</p>
        </div>
        <div>
          <label className="block text-[11px] text-gray-600 mb-1 font-semibold">Check-Out End Time</label>
          <input
            type="time"
            value={form.work_end_time}
            onChange={(e) => setForm({ ...form, work_end_time: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
          />
          <p className="text-[10px] text-gray-400 mt-1">Check-outs before this time count as early leave</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0088cc]/5 p-3.5 rounded-xl border border-[#0088cc]/15">
        <div>
          <label className="block text-[11px] text-[#0088cc] mb-1 font-bold">
            Late Arrival Grace (Minutes Chance)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="120"
              value={form.late_grace_minutes}
              onChange={(e) => setForm({ ...form, late_grace_minutes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0088cc]"
              placeholder="15"
            />
            <span className="absolute right-3 top-2 text-[10px] text-gray-400">mins chance</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            Chance given for arriving late. Within this window, employee is marked On Time.
          </p>
        </div>
        <div>
          <label className="block text-[11px] text-[#0088cc] mb-1 font-bold">
            Early Departure Grace (Minutes Chance)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="120"
              value={form.early_leave_grace_minutes}
              onChange={(e) => setForm({ ...form, early_leave_grace_minutes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0088cc]"
              placeholder="15"
            />
            <span className="absolute right-3 top-2 text-[10px] text-gray-400">mins chance</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            Employees leaving within this window of shift end are not flagged with early penalty.
          </p>
        </div>
      </div>
    </div>
  );
}
