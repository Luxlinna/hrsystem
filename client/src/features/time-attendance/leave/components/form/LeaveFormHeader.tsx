import React from "react";

interface LeaveFormHeaderProps {
  onBack: () => void;
  isSuperAdmin: boolean;
  formMode?: "self" | "for_employee";
}

export function LeaveFormHeader({ onBack }: LeaveFormHeaderProps) {
  return (
    <div className="pb-1">
      <div className="space-y-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#2563eb] transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line text-sm" />
          <span>Leave Hub</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Create Leave
        </h1>
      </div>
    </div>
  );
}
