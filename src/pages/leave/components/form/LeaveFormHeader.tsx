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
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Time &amp; Attendance</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span>Absence &amp; Leave</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Create Leave</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Create Leave
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isSuperAdmin
                ? "bg-emerald-100 text-emerald-800"
                : formMode === "for_employee"
                ? "bg-[#253C7D]/10 text-[#253C7D]"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {isSuperAdmin
              ? "Super Admin (Auto-Approve)"
              : formMode === "for_employee"
              ? "Request Leave For Employee"
              : "Self Request"}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-xs font-bold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
      >
        <i className="ri-arrow-left-line text-sm text-[#253C7D]" />
        Back to Leave Hub
      </button>
    </div>
  );
}
