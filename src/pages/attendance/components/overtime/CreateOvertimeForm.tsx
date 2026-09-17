import React, { memo, useRef } from "react";
import type { Employee } from "../../types";
import { useCreateOvertime } from "../../hooks/useCreateOvertime";
import { TimeLogEmployeeSection } from "../time-log/TimeLogEmployeeSection";
import { OvertimeTypeInfoSection } from "./OvertimeTypeInfoSection";
import { OvertimeAttachmentSection } from "./OvertimeAttachmentSection";

export interface CreateOvertimeFormProps {
  onBack: () => void;
  employees: Employee[];
  initialEmployeeId?: string;
  isEmployeeFixed?: boolean;
  onSaved?: () => Promise<void> | void;
  activeBranchId?: string | null;
}

export const CreateOvertimeForm = memo(function CreateOvertimeForm({
  onBack,
  employees,
  initialEmployeeId,
  isEmployeeFixed = false,
  onSaved,
  activeBranchId,
}: CreateOvertimeFormProps) {
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  const {
    employeeId, setEmployeeId, employeeSearchQuery, setEmployeeSearchQuery,
    isEmployeeDropdownOpen, setIsEmployeeDropdownOpen, selectedEmployee, filteredEmployees,
    overtimeType, setOvertimeType, fromDate, setFromDate, toDate, setToDate,
    inHour, setInHour, inMinute, setInMinute, inPeriod, setInPeriod,
    outHour, setOutHour, outMinute, setOutMinute, outPeriod, setOutPeriod,
    breakMinutes, setBreakMinutes, calculatedHours, reason, setReason,
    remark, setRemark, attachmentFile, setAttachmentFile, saving, handleSave,
  } = useCreateOvertime({
    employees, initialEmployeeId, isEmployeeFixed, onSaved, onBack, activeBranchId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-5 sm:p-7 lg:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>Workforce Operations</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span>Attendance &amp; Timesheets</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span className="text-[#253C7D] dark:text-sky-400 font-bold">Overtime</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              Create Overtime Entry
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950/60 dark:text-sky-300">
                OT Tracking
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Log overtime hours, rate multiplier, and approval attachments for staff.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 border border-gray-200/80 dark:border-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <i className="ri-arrow-left-line text-sm text-[#253C7D] dark:text-sky-400" />
            Back to Hub
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TimeLogEmployeeSection
            isEmployeeFixed={isEmployeeFixed}
            selectedEmployee={selectedEmployee}
            employeeId={employeeId}
            isEmployeeDropdownOpen={isEmployeeDropdownOpen}
            setIsEmployeeDropdownOpen={setIsEmployeeDropdownOpen}
            employeeDropdownRef={employeeDropdownRef}
            employeeSearchQuery={employeeSearchQuery}
            setEmployeeSearchQuery={setEmployeeSearchQuery}
            filteredEmployees={filteredEmployees}
            handleSelectEmployee={(id) => {
              setEmployeeId(id);
              setIsEmployeeDropdownOpen(false);
            }}
          />

          <OvertimeTypeInfoSection
            overtimeType={overtimeType}
            setOvertimeType={setOvertimeType}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            inHour={inHour}
            setInHour={setInHour}
            inMinute={inMinute}
            setInMinute={setInMinute}
            inPeriod={inPeriod}
            setInPeriod={setInPeriod}
            outHour={outHour}
            setOutHour={setOutHour}
            outMinute={outMinute}
            setOutMinute={setOutMinute}
            outPeriod={outPeriod}
            setOutPeriod={setOutPeriod}
            breakMinutes={breakMinutes}
            setBreakMinutes={setBreakMinutes}
            calculatedHours={calculatedHours}
            reason={reason}
            setReason={setReason}
            remark={remark}
            setRemark={setRemark}
          />

          <OvertimeAttachmentSection
            attachmentFile={attachmentFile}
            setAttachmentFile={setAttachmentFile}
          />

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#253C7D] hover:bg-[#1E3166] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <i className="ri-save-line text-sm" />
              <span>{saving ? "Saving Overtime..." : "Save Overtime"}</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <i className="ri-close-line text-sm" />
              <span>Discard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
