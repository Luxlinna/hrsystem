import { memo, useState } from "react";
import { Link } from "react-router-dom";
import type { Employee } from "../types";
import { deptColors } from "../constants";

interface BranchStaffSectionProps {
  deptGroups: Record<string, Employee[]>;
  empLoading: boolean;
}

export const BranchStaffSection = memo(function BranchStaffSection({
  deptGroups,
  empLoading,
}: BranchStaffSectionProps) {
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  const toggleDept = (dept: string) => {
    setExpandedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  return (
    <div className="p-5 flex-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Employees by Department</h3>
        <span className="text-[11px] text-gray-400">
          {Object.values(deptGroups).reduce((acc, list) => acc + list.length, 0)} Total Staff
        </span>
      </div>

      {empLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(deptGroups).length === 0 ? (
        <p className="text-xs text-gray-400 italic py-4">No employees assigned to this branch.</p>
      ) : (
        <div className="space-y-2.5">
          {Object.entries(deptGroups).map(([dept, emps]) => {
            const isExpanded = expandedDepts[dept] ?? true;
            return (
              <div key={dept} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleDept(dept)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${deptColors[dept] || "bg-gray-400"}`} />
                    <span className="text-xs font-bold text-gray-800">{dept}</span>
                    <span className="text-[11px] text-gray-400">({emps.length})</span>
                  </div>
                  <i className={`ri-arrow-down-s-line text-gray-400 text-sm transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-50 p-1">
                    {emps.map((emp) => (
                      <div key={emp.id} className="p-2.5 flex items-center justify-between hover:bg-gray-50/50 rounded-lg transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link to={`/employees/${emp.id}`} className="text-xs font-bold text-gray-800 hover:text-[#253C7D] truncate">
                              {emp.first_name} {emp.last_name}
                            </Link>
                            {emp.biometric_user_id && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shrink-0"
                                title="ZKTeco Machine Fingerprint/Face ID"
                              >
                                <i className="ri-fingerprint-line text-[9px]" />
                                PIN: {emp.biometric_user_id}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-gray-400 truncate">{emp.role || "Staff"}</span>
                            <span className="text-gray-300">·</span>
                            {emp.work_locations?.name ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0 shadow-2xs">
                                <i className="ri-map-pin-2-fill text-[9px] text-emerald-500 dark:text-emerald-400" />
                                <span>{emp.work_locations.name}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-1.5 py-0.5 rounded shrink-0">
                                <i className="ri-building-2-line text-[9px] text-blue-500 dark:text-blue-400" />
                                <span>Main Office</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${emp.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {emp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
