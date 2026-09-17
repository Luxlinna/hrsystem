import React, { memo, useRef } from "react";
import type { Employee } from "../../types";
import { useCreateOvertime } from "../../hooks/useCreateOvertime";
import { OvertimeEmployeeSection } from "./OvertimeEmployeeSection";
import { OvertimeTypeInfoSection } from "./OvertimeTypeInfoSection";
import { OvertimeAttachmentSection } from "./OvertimeAttachmentSection";
import { OvertimeSummaryCard } from "./OvertimeSummaryCard";
import { OvertimeApprovalSection } from "./OvertimeApprovalSection";

export interface CreateOvertimeFormProps {
  onBack: () => void;
  employees: Employee[];
  initialEmployeeId?: string;
  isEmployeeFixed?: boolean;
  onSaved?: () => Promise<void> | void;
  activeBranchId?: string | null;
  formMode?: "direct" | "request" | "request_for";
}

export const CreateOvertimeForm = memo(function CreateOvertimeForm({
  onBack,
  employees,
  initialEmployeeId,
  isEmployeeFixed = false,
  onSaved,
  activeBranchId,
  formMode = "direct",
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
    approvalStatus, setApprovalStatus,
    approverEmployeeId, setApproverEmployeeId,
    rejectionReason, setRejectionReason,
    approvalDate, setApprovalDate,
  } = useCreateOvertime({
    employees, initialEmployeeId, isEmployeeFixed, onSaved, onBack, activeBranchId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-5 sm:p-7 lg:p-8 font-sans">
      <div className="w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>Workforce Operations</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span>Attendance &amp; Timesheets</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span className="text-[#253C7D] dark:text-sky-400 font-bold">Overtime</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              {formMode === "request" ? "Create Overtime Request" : formMode === "request_for" ? "Create Overtime Request For" : "Create New Overtime"}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950/60 dark:text-sky-300">
                {formMode === "request" ? "Self Request" : formMode === "request_for" ? "Staff Request" : "Direct Entry"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              {formMode === "request"
                ? "Submit an overtime request for yourself for manager/HR review and approval."
                : formMode === "request_for"
                ? "Submit an overtime request on behalf of an employee for approval."
                : "Log overtime hours, rate multiplier, and approval attachments for staff."}
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

        {/* Responsive Grid Form: 8 cols for main form, 4 cols for summary sidebar */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Form Fields */}
            <div className="lg:col-span-8 space-y-5">
              <OvertimeEmployeeSection
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

              <OvertimeApprovalSection
                formMode={formMode}
                employees={employees}
                approvalStatus={approvalStatus}
                setApprovalStatus={setApprovalStatus}
                approverEmployeeId={approverEmployeeId}
                setApproverEmployeeId={setApproverEmployeeId}
                rejectionReason={rejectionReason}
                setRejectionReason={setRejectionReason}
                approvalDate={approvalDate}
                setApprovalDate={setApprovalDate}
              />
            </div>

            {/* Right 4 Columns: Summary & Attachment Panel */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
              <OvertimeSummaryCard
                calculatedHours={calculatedHours}
                overtimeType={overtimeType}
                fromDate={fromDate}
                toDate={toDate}
                inHour={inHour}
                inMinute={inMinute}
                inPeriod={inPeriod}
                outHour={outHour}
                outMinute={outMinute}
                outPeriod={outPeriod}
                breakMinutes={breakMinutes}
                saving={saving}
                formMode={formMode}
                onBack={onBack}
              />

              <OvertimeAttachmentSection
                attachmentFile={attachmentFile}
                setAttachmentFile={setAttachmentFile}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
