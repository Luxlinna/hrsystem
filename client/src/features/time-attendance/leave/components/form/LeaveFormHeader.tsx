import React from "react";

interface LeaveFormHeaderProps {
  onBack: () => void;
  isSuperAdmin: boolean;
  formMode?: "self" | "for_employee";
}

export function LeaveFormHeader({ onBack, isSuperAdmin, formMode = "self" }: LeaveFormHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
          <span>Time &amp; Attendance</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span>Absence &amp; Leave</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] dark:text-sky-400 font-bold">Create Leave</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          Create Leave
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isSuperAdmin
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border dark:border-emerald-800/60"
                : formMode === "for_employee"
                ? "bg-[#253C7D]/10 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 border dark:border-blue-800/60"
                : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border dark:border-blue-800/60"
            }`}
          >
            {isSuperAdmin
              ? "Super Admin (Auto-Approve)"
              : formMode === "for_employee"
              ? "Request Leave For Employee"
              : "Self Request"}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
          {isSuperAdmin
            ? "Directly record and approve employee leave without managerial review."
            : formMode === "for_employee"
            ? "Submit an official leave request on behalf of a team member."
            : "Submit a time off application for line manager and HR approval."}
        </p>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
      >
        <i className="ri-arrow-left-line text-sm text-[#253C7D] dark:text-sky-400" />
        Back to Leave Hub
      </button>
    </div>
  );
}
