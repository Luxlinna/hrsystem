import React from "react";
import type { Employee } from "../../types";

interface MovementInfoCardProps {
  employee: Employee;
}

export const MovementInfoCard: React.FC<MovementInfoCardProps> = ({ employee }) => {
  const joinDate = employee.join_date ? new Date(employee.join_date).toLocaleDateString() : "Not specified";
  const isExited = employee.status === "resigned" || employee.status === "terminated" || employee.status === "inactive";
  const statusColor =
    employee.status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : employee.status === "onboarding" || employee.status === "probation"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-[#253C7D]">
            <i className="ri-route-line text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Movement &amp; Career Lifecycle</h3>
            <p className="text-xs text-gray-500">Employee progression from initial join to current status or exit</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor} capitalize`}>
          Status: {employee.status || "Active"}
        </span>
      </div>

      {/* Timeline Progression */}
      <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6 ml-2">
        {/* Step 1: Onboarding & Join */}
        <div className="relative">
          <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#253C7D] ring-4 ring-indigo-50" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900">Onboarding &amp; Join Date</span>
            <span className="text-[11px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{joinDate}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Joined as <strong>{employee.role || "Staff"}</strong> in the <strong>{employee.department || "General"}</strong> department.
          </p>
        </div>

        {/* Step 2: Placement & Location */}
        <div className="relative">
          <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-50" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900">Current Work Assignment</span>
            <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
              {employee.branches?.name || "Main Headquarters"}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Assigned Site: {employee.work_locations?.name || "Standard Facility"} &middot; Biometric ID: {employee.biometric_user_id || "Unassigned"}
          </p>
        </div>

        {/* Step 3: Lifecycle Milestone */}
        <div className="relative">
          <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${isExited ? "bg-amber-500 ring-amber-50" : "bg-emerald-500 ring-emerald-50"} ring-4`} />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900">
              {isExited ? "Exit / Separation Milestone" : "Active Service Record"}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${isExited ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              {isExited ? "Separated" : "In Good Standing"}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isExited
              ? "Staff has completed exit clearance and offboarding handover."
              : "Active staff member with regular attendance and ongoing employment contract."}
          </p>
        </div>
      </div>

      {/* Summary table */}
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-gray-50 p-2.5 rounded-lg">
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Join Date</span>
          <span className="font-bold text-gray-800">{joinDate}</span>
        </div>
        <div className="bg-gray-50 p-2.5 rounded-lg">
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Department</span>
          <span className="font-bold text-gray-800">{employee.department || "—"}</span>
        </div>
        <div className="bg-gray-50 p-2.5 rounded-lg">
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Position</span>
          <span className="font-bold text-gray-800">{employee.role || "—"}</span>
        </div>
        <div className="bg-gray-50 p-2.5 rounded-lg">
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Current State</span>
          <span className="font-bold text-gray-800 capitalize">{employee.status || "Active"}</span>
        </div>
      </div>
    </div>
  );
};
