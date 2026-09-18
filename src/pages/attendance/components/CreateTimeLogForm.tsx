import React, { memo } from "react";
import type { Employee, WorkLocation } from "../types";
import { useCreateTimeLog } from "../hooks/useCreateTimeLog";
import { TimeLogEmployeeSection } from "./time-log/TimeLogEmployeeSection";
import { TimeLogInfoSection } from "./time-log/TimeLogInfoSection";
import { TimeLogActions } from "./time-log/TimeLogActions";

export interface CreateTimeLogFormProps {
  onBack: () => void;
  employees: Employee[];
  workLocations: WorkLocation[];
  initialEmployeeId?: string;
  isEmployeeFixed?: boolean;
  onSaved?: () => Promise<void> | void;
  activeBranchId?: string | null;
}

export const CreateTimeLogForm = memo(function CreateTimeLogForm({
  onBack,
  employees,
  workLocations: initialWorkLocations,
  initialEmployeeId,
  isEmployeeFixed = false,
  onSaved,
  activeBranchId,
}: CreateTimeLogFormProps) {
  const {
    employeeId, employeeSearchQuery, setEmployeeSearchQuery,
    isEmployeeDropdownOpen, setIsEmployeeDropdownOpen, employeeDropdownRef,
    sites, logSiteId, setLogSiteId, refreshingSites, handleRefreshSites,
    date, setDate, hour, setHour, minute, setMinute, period, setPeriod,
    logType, setLogType, remark, setRemark, saving, saveMenuOpen, setSaveMenuOpen,
    saveMenuRef, selectedEmployee, filteredEmployees, handleSelectEmployee,
    handleHourBlur, handleMinuteBlur, handleSave, employeeBranchName,
    workStartTime, setWorkStartTime, graceMinutes, statusMode, setStatusMode, liveEvaluation,
  } = useCreateTimeLog({
    employees, initialWorkLocations, initialEmployeeId,
    isEmployeeFixed, onSaved, onBack, activeBranchId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(false);
  };

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              <span>Workforce Operations</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span>Attendance &amp; Timesheets</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span className="text-[#253C7D] font-bold">New Punch</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              Create New Time Log
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
                Manual Entry
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Record a single time-in or time-out punch for the employee's work location.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200/80 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <i className="ri-arrow-left-line text-sm text-[#253C7D]" />
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
            handleSelectEmployee={handleSelectEmployee}
          />

          <TimeLogInfoSection
            date={date}
            setDate={setDate}
            hour={hour}
            setHour={setHour}
            minute={minute}
            setMinute={setMinute}
            period={period}
            setPeriod={setPeriod}
            logType={logType}
            setLogType={setLogType}
            remark={remark}
            setRemark={setRemark}
            handleHourBlur={handleHourBlur}
            handleMinuteBlur={handleMinuteBlur}
            workStartTime={workStartTime}
            setWorkStartTime={setWorkStartTime}
            graceMinutes={graceMinutes}
            statusMode={statusMode}
            setStatusMode={setStatusMode}
            liveEvaluation={liveEvaluation}
          />

          <TimeLogActions
            saving={saving}
            saveMenuOpen={saveMenuOpen}
            setSaveMenuOpen={setSaveMenuOpen}
            saveMenuRef={saveMenuRef}
            onSave={handleSave}
            onDiscard={onBack}
          />
        </form>
      </div>
    </div>
  );
});
